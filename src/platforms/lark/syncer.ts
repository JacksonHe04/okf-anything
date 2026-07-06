/**
 * Lark `PlatformSyncer` implementation.
 *
 * Backed by the `lark-cli` binary (Go) — see `./client.ts` for the
 * thin process-spawn wrapper. This syncer composes that client into
 * the generic `PlatformSyncer` contract:
 *
 *   listCloud   : BFS wiki tree(s) from config + search minutes
 *   loadLocal   : scan workspace for `lark_id` frontmatter
 *                 (transitionally also accept `lark_node_token` so the
 *                  pre-migration 108 files keep loading)
 *   writeNew    : fetch markdown via `docs +fetch`, render frontmatter,
 *                 persist under <root>/Wiki/lark/<space-slug>/<title>.md
 *   writeUpdate : re-fetch body + re-render, preserving inon_id
 *   finalize    : stamp `last_sync_time` in config
 */
import * as fs from "fs";
import * as path from "path";
import { writeFrontmatterBody, parseFrontmatter } from "../../utils/frontmatter.js";
import { IgnoreMatcher } from "../../ignore/matcher.js";
import { safeRetrieve } from "../../utils/safe-call.js";
import { sanitizeFileName } from "../../utils/sanitize.js";
import { createPathAllocator } from "../../utils/path-allocator.js";
import type { LoadedConfig } from "../../config/loader.js";
import type { CloudItem, LocalEntry } from "../../sync/engine.js";
import type { PlatformSyncer } from "../../sync/types.js";
import { LarkClient, type WikiNode, type MinuteDetail } from "./client.js";
import {
  buildWikiNodeFrontmatter,
  buildMinuteFrontmatter,
  extractMinuteTitle,
  spaceSlug,
  unixToIso as unixToIsoLocal,
  type LarkOkfFields,
} from "./convert.js";

export class LarkSyncer implements PlatformSyncer {
  readonly platform = "lark" as const;
  private readonly api: LarkClient;

  constructor(opts?: { larkCliPath?: string; as?: "user" | "bot" }) {
    this.api = new LarkClient(opts);
  }

  // ─────────────────────────────────────────────────────────────────
  // listCloud: walk wiki trees + scan minutes
  // ─────────────────────────────────────────────────────────────────

  async listCloud(args: {
    config: LoadedConfig;
    rootOverride?: string;
  }): Promise<CloudItem[]> {
    const ping = await this.api.ping();
    if (!ping.ok) {
      throw new Error(
        `lark-cli not ready: ${ping.message ?? "unknown"}\n→ run: lark-cli auth login`,
      );
    }

    // Pull the wiki space list once so we can map space_id → human name
    // for the on-disk directory. Best-effort: if it fails we fall back
    // to the space-id slug in convert.ts.
    const spaceNames = new Map<string, string>();
    try {
      const spaces = await this.api.listWikiSpaces();
      for (const s of spaces) {
        if (s.name) spaceNames.set(s.space_id, s.name);
      }
    } catch (err) {
      console.warn(
        `  ⚠ wiki +space-list failed: ${err instanceof Error ? err.message : err}`,
      );
    }

    const out: CloudItem[] = [];
    const spaceIds = this.resolveSpaceIds(args.config, args.rootOverride);

    for (const spaceId of spaceIds) {
      await this.walkWikiSpace(spaceId, spaceNames, out);
    }

    // Minutes: wide time range; cheap metadata-only scan.
    try {
      const minutes = await this.api.searchMinutes({
        start: "2000-01-01",
        end: "2099-12-31",
      });
      for (const m of minutes) {
        out.push({
          uuid: m.token,
          title: extractMinuteTitle(m.display_info),
          url: m.meta_data?.app_link ?? `https://feishu.cn/minutes/${m.token}`,
          // Last-edited time unknown from search; fall back to created if any.
          lastEditedTime: new Date().toISOString(),
          createdTime: new Date().toISOString(),
          parent: { type: "minutes", id: null },
          extras: { kind: "minute" },
        });
      }
    } catch (err) {
      // Minutes search may fail with missing scope; surface but don't block wiki.
      console.warn(
        `  ⚠ minutes search skipped: ${err instanceof Error ? err.message : err}`,
      );
    }

    return out;
  }

  private async walkWikiSpace(
    spaceId: string,
    spaceNames: Map<string, string>,
    out: CloudItem[],
  ): Promise<void> {
    // Resolve `my_library` to its real space_id before listing. The CLI
    // resolves it for us and prints "Resolved my_library to space X",
    // but we need the resolved id to look up a human name in our map.
    // Easiest: pass `my_library` through and rely on `listWikiNodes`
    // to do the resolution server-side; we'll preserve the alias as
    // the display name when we couldn't find a real one.
    const spaceName = spaceNames.get(spaceId) ?? (spaceId === "my_library" ? "my-library" : null);
    const visited = new Set<string>();
    const queue: Array<{ spaceId: string; parent?: string }> = [
      { spaceId },
    ];

    while (queue.length > 0) {
      const head = queue.shift()!;
      const nodes = await safeRetrieve(
        () => this.api.listWikiNodes(head.spaceId, { parentNodeToken: head.parent }),
        `wiki +node-list ${head.spaceId}${head.parent ? ` (parent ${head.parent})` : ""}`,
      );
      if (!nodes) continue;

      for (const node of nodes) {
        if (!node.node_token || visited.has(node.node_token)) continue;
        visited.add(node.node_token);

        // Resolve the per-node edit timestamp via +node-get. Best-effort:
        // when it fails (missing scope, etc.) we keep the placeholder.
        let lastEdited: string | undefined;
        let createdTime: string | undefined;
        if (node.obj_token && node.obj_type) {
          const meta = await safeRetrieve(
            () => this.api.getWikiNode(node.obj_token!, node.obj_type!),
            `wiki +node-get ${node.obj_token}`,
          );
          if (meta) {
            const iso = unixToIsoLocal(meta.obj_edit_time);
            if (iso) lastEdited = iso;
            const c = unixToIsoLocal(meta.obj_create_time ?? meta.node_create_time);
            if (c) createdTime = c;
          }
        }

        out.push({
          uuid: node.node_token,
          title: node.title || "untitled",
          url: `https://feishu.cn/wiki/${node.node_token}`,
          lastEditedTime: lastEdited ?? new Date().toISOString(),
          createdTime: createdTime ?? new Date().toISOString(),
          parent: { type: "wiki", id: node.parent_node_token || null },
          extras: {
            kind: "wiki-node",
            space_id: node.space_id ?? head.spaceId,
            space_name: spaceName ?? null,
            obj_token: node.obj_token,
            obj_type: node.obj_type,
            lark_id: node.node_token,
          },
        });

        if (node.has_child && node.node_token) {
          queue.push({ spaceId: head.spaceId, parent: node.node_token });
        }
      }
    }
  }

  private resolveSpaceIds(config: LoadedConfig, rootOverride?: string): string[] {
    if (rootOverride) {
      // Comma-separated tokens → list of space specs.
      return rootOverride
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    const stored = config.config.lark?.state?.default_root_id;
    if (!stored) return ["my_library"]; // sensible default for user identity
    return stored
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // ─────────────────────────────────────────────────────────────────
  // loadLocal: scan workspace, indexed by lark_id (with legacy fallback)
  // ─────────────────────────────────────────────────────────────────

  async loadLocal(args: { config: LoadedConfig }): Promise<Map<string, LocalEntry>> {
    const map = new Map<string, LocalEntry>();
    const matcher = IgnoreMatcher.fromConfig(args.config.root, args.config.config);
    // We may be writing into <root>/Wiki/lark or <root>/lark — walk both.
    const candidateDirs = [
      path.join(args.config.root, "Wiki", "lark"),
      path.join(args.config.root, "lark"),
    ];

    for (const base of candidateDirs) {
      if (!fs.existsSync(base)) continue;
      await this.walkMdFiles(base, args.config.root, matcher, (entry) => {
        // Prefer new `lark_id`; fall back to legacy `lark_node_token`.
        const id =
          (entry.frontmatter?.lark_id as string | undefined) ??
          (entry.frontmatter?.lark_node_token as string | undefined);
        if (id && !map.has(id)) {
          map.set(id, entry.entry);
        }
      });
    }
    return map;
  }

  private async walkMdFiles(
    base: string,
    root: string,
    matcher: IgnoreMatcher,
    onFile: (info: { frontmatter: Record<string, unknown> | null; entry: LocalEntry }) => void,
  ): Promise<void> {
    async function walk(dir: string): Promise<void> {
      let entries: fs.Dirent[];
      try {
        entries = await fs.promises.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (matcher.ignores(full)) continue;
        if (e.isDirectory()) await walk(full);
        else if (e.isFile() && e.name.endsWith(".md")) {
          try {
            const content = await fs.promises.readFile(full, "utf8");
            const { frontmatter } = parseFrontmatter(content);
            onFile({
              frontmatter,
              entry: {
                absPath: full,
                relPath: path.relative(root, full),
                lastEditedTime:
                  typeof frontmatter?.last_edited_time === "string"
                    ? (frontmatter.last_edited_time as string)
                    : undefined,
              },
            });
          } catch {
            // skip malformed
          }
        }
      }
    }
    await walk(base);
  }

  // ─────────────────────────────────────────────────────────────────
  // writeNew / writeUpdate
  // ─────────────────────────────────────────────────────────────────

  async writeNew(
    item: CloudItem,
    _targetDir: string,
    config: LoadedConfig,
    existingInonId?: string,
  ): Promise<{ relPath: string }> {
    const kind = (item.extras?.kind as string) ?? "wiki-node";

    let body = "";
    let fm: LarkOkfFields;

    if (kind === "minute") {
      fm = buildMinuteFrontmatter({
        item: {
          token: item.uuid,
          title: item.title,
          display_info: item.title,
          meta_data: { app_link: item.url },
        },
        resource: item.url,
      });

      // Pull full detail (transcript / chapters / summary). Best-effort:
      // if artifacts scope is missing, fall back to a stub body.
      const detail = await safeRetrieve(
        () => this.api.getMinuteDetail(item.uuid),
        `minutes detail ${item.uuid}`,
      );

      body = renderMinuteBody(detail, fm.title, item.url);
      if (detail) {
        // Stamp metadata back into frontmatter so the file is searchable.
        const meta = detail;
        if (meta.duration) fm.lark_duration_ms = meta.duration;
        if (meta.create_time) fm.created_time = millisToIso(meta.create_time);
        if (meta.create_time) fm.last_edited_time = millisToIso(meta.create_time);
        if (meta.create_time) fm.timestamp = millisToIso(meta.create_time);
        if (meta.note_id) fm.lark_note_id = meta.note_id;
        if (Array.isArray(meta.keywords) && meta.keywords.length > 0) {
          // Single-line comma-separated string instead of a YAML array —
          // keeps the frontmatter flat and grep-friendly.
          fm.lark_keywords = meta.keywords.join(", ");
        }
      }
    } else {
      // Wiki node: resolve to a full node record (with timestamps) before
      // computing frontmatter, then fetch markdown body via docs +fetch.
      const objToken =
        (item.extras?.obj_token as string | undefined) ?? item.uuid;
      const objType =
        (item.extras?.obj_type as string | undefined) ?? "docx";
      const spaceId =
        (item.extras?.space_id as string | undefined) ?? null;

      const nodeMeta = await safeRetrieve(
        () => this.api.getWikiNode(objToken, objType),
        `wiki +node-get ${objToken}`,
      );

      const merged: WikiNode = {
        space_id: spaceId ?? nodeMeta?.space_id ?? undefined,
        node_token: item.uuid,
        obj_token: objToken,
        obj_type: objType,
        parent_node_token: item.parent.id ?? "",
        title: item.title,
        has_child: false,
        obj_edit_time: nodeMeta?.obj_edit_time,
        obj_create_time: nodeMeta?.obj_create_time,
        node_create_time: nodeMeta?.node_create_time,
        updated_at: nodeMeta?.updated_at,
      };

      fm = buildWikiNodeFrontmatter({
        node: merged,
        spaceName: (item.extras?.space_name as string | undefined) ?? null,
      });

      // Fetch markdown body (best-effort: an empty/locked doc returns "").
      const fetched = await safeRetrieve(
        () => this.api.fetchDocMarkdown(objToken),
        `docs +fetch ${objToken}`,
      );
      body = fetched && fetched.trim() ? `${fetched}\n` : `# ${fm.title}\n\n（暂无正文）\n`;
    }

    if (existingInonId) fm.inon_id = existingInonId;

    // Path: <root>/Wiki/lark/<space-slug>/<sanitized-title>.md
    const spaceIdValue =
      kind === "minute" ? null : ((item.extras?.space_id as string | undefined) ?? null);
    const spaceNameValue =
      kind === "minute" ? null : ((item.extras?.space_name as string | undefined) ?? null);
    const subdir = kind === "minute" ? "minutes" : spaceSlug(spaceIdValue, spaceNameValue);
    const targetDir = path.join(config.root, "Wiki", "lark", subdir);

    fs.mkdirSync(targetDir, { recursive: true });
    const allocator = createPathAllocator();
    const sanitized = sanitizeFileName(item.title || "untitled");
    const filePath = allocator.allocate(targetDir, sanitized, "file");
    const absPath = path.resolve(targetDir, filePath);

    const md = writeFrontmatterBody(
      fm as unknown as Record<string, unknown>,
      body,
    );
    fs.writeFileSync(absPath, md, "utf8");
    return { relPath: path.relative(config.root, absPath) };
  }

  async writeUpdate(item: CloudItem, existing: LocalEntry, config: LoadedConfig) {
    const preserved = await this.readExistingInonId(existing.absPath);
    // For updates we MUST write to the existing path so we don't create a
    // duplicate alongside (e.g. `To Mum.md` next to the canonical
    // `To-Mum.md`). We override the title → path mapping by computing
    // the body + frontmatter here, then writing to `existing.absPath`
    // directly.
    const kind = (item.extras?.kind as string) ?? "wiki-node";
    let fm: LarkOkfFields;
    let body = "";

    if (kind === "minute") {
      fm = buildMinuteFrontmatter({
        item: {
          token: item.uuid,
          title: item.title,
          display_info: item.title,
          meta_data: { app_link: item.url },
        },
        resource: item.url,
      });
      const detail = await safeRetrieve(
        () => this.api.getMinuteDetail(item.uuid),
        `minutes detail ${item.uuid}`,
      );
      body = renderMinuteBody(detail, fm.title, item.url);
      if (detail) {
        if (detail.duration) fm.lark_duration_ms = detail.duration;
        if (detail.create_time) fm.created_time = millisToIso(detail.create_time);
        if (detail.create_time) fm.last_edited_time = millisToIso(detail.create_time);
        if (detail.create_time) fm.timestamp = millisToIso(detail.create_time);
        if (detail.note_id) fm.lark_note_id = detail.note_id;
        if (Array.isArray(detail.keywords) && detail.keywords.length > 0) {
          fm.lark_keywords = detail.keywords.join(", ");
        }
      }
    } else {
      const objToken =
        (item.extras?.obj_token as string | undefined) ?? item.uuid;
      const objType =
        (item.extras?.obj_type as string | undefined) ?? "docx";
      const spaceId =
        (item.extras?.space_id as string | undefined) ?? null;

      const nodeMeta = await safeRetrieve(
        () => this.api.getWikiNode(objToken, objType),
        `wiki +node-get ${objToken}`,
      );
      const merged: WikiNode = {
        space_id: spaceId ?? nodeMeta?.space_id ?? undefined,
        node_token: item.uuid,
        obj_token: objToken,
        obj_type: objType,
        parent_node_token: item.parent.id ?? "",
        title: item.title,
        has_child: false,
        obj_edit_time: nodeMeta?.obj_edit_time,
        obj_create_time: nodeMeta?.obj_create_time,
        node_create_time: nodeMeta?.node_create_time,
        updated_at: nodeMeta?.updated_at,
      };
      fm = buildWikiNodeFrontmatter({
        node: merged,
        spaceName: (item.extras?.space_name as string | undefined) ?? null,
      });
      const fetched = await safeRetrieve(
        () => this.api.fetchDocMarkdown(objToken),
        `docs +fetch ${objToken}`,
      );
      body = fetched && fetched.trim() ? `${fetched}\n` : `# ${fm.title}\n\n（暂无正文）\n`;
    }

    if (preserved) fm.inon_id = preserved;

    const md = writeFrontmatterBody(
      fm as unknown as Record<string, unknown>,
      body,
    );
    fs.writeFileSync(existing.absPath, md, "utf8");
    return { relPath: path.relative(config.root, existing.absPath) };
  }

  private async readExistingInonId(absPath: string): Promise<string | undefined> {
    try {
      const raw = await fs.promises.readFile(absPath, "utf8");
      const { frontmatter } = parseFrontmatter(raw);
      const v = frontmatter?.inon_id;
      return typeof v === "string" && v.length > 0 ? v : undefined;
    } catch {
      return undefined;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // finalize: stamp last_sync_time
  // ─────────────────────────────────────────────────────────────────

  finalize(config: LoadedConfig, when: Date): LoadedConfig {
    const cur = (config.config.lark ?? { token: undefined, state: {}, options: {} }) as {
      token?: string;
      options?: Record<string, unknown>;
      state?: { last_sync_time?: string };
    };
    const next = {
      ...structuredClone(config.config),
      lark: {
        token: cur.token,
        options: cur.options ?? {},
        state: {
          ...(cur.state ?? {}),
          last_sync_time: when.toISOString(),
        },
      },
    };
    return { ...config, config: next as typeof config.config };
  }
}

/**
 * Render a minute into markdown body: header / summary / chapters /
 * transcript. Sections that are missing from `detail` are skipped
 * rather than emitted as empty placeholders.
 */
function renderMinuteBody(
  detail: MinuteDetail | null,
  title: string,
  url: string,
): string {
  const parts: string[] = [`# ${title}`];

  parts.push(
    `> 飞书妙记 · [原页面](${url})` +
      (detail?.duration
        ? ` · 时长 ${formatDuration(detail.duration)}`
        : "") +
      (detail?.create_time
        ? ` · ${millisToIso(detail.create_time).slice(0, 10)}`
        : ""),
  );

  if (detail?.keywords && detail.keywords.length > 0) {
    parts.push(`\n## 关键词\n\n${detail.keywords.join("、")}`);
  }

  if (detail?.summary) {
    parts.push(`\n## 摘要\n\n${detail.summary.trim()}`);
  }

  if (detail?.chapters && detail.chapters.length > 0) {
    parts.push(`\n## 章节`);
    for (const ch of detail.chapters) {
      const head = ch.title?.trim() || "(untitled)";
      parts.push(`\n### ${head}`);
      if (ch.summary_content) {
        parts.push(`\n${ch.summary_content.trim()}`);
      }
    }
  }

  if (detail?.todos && detail.todos.length > 0) {
    parts.push(`\n## 待办`);
    for (const t of detail.todos) {
      const txt = (t.content ?? "").trim();
      if (!txt) continue;
      const owner = t.assignee ? ` — @${t.assignee}` : "";
      parts.push(`\n- [ ] ${txt}${owner}`);
    }
  }

  if (detail?.transcript) {
    parts.push(`\n## 逐字稿\n\n\`\`\`\n${detail.transcript.trim()}\n\`\`\``);
  }

  // Last-resort stub when no detail was fetched (scope missing).
  if (!detail) {
    parts.push(
      `\n> 妙记正文未能拉取。可能缺少 \`minutes:minutes.basic:read\` / ` +
        `\`minutes:minutes.artifacts:read\` scope。`,
    );
  }

  return parts.join("\n") + "\n";
}

/** Format millisecond duration ("4209290") as "1h 10min 9s". */
function formatDuration(ms: string | number): string {
  const n = typeof ms === "string" ? Number(ms) : ms;
  if (!Number.isFinite(n) || n <= 0) return "";
  const total = Math.round(n / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}min ${s}s`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

/** Convert millisecond-since-epoch string to ISO. Empty → empty. */
function millisToIso(ms: string | number | undefined): string {
  if (ms === undefined || ms === null || ms === "") return "";
  const n = typeof ms === "string" ? Number(ms) : ms;
  if (!Number.isFinite(n) || n <= 0) return "";
  return new Date(n).toISOString();
}