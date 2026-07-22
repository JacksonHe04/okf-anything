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
import type { LoadedConfig } from "../../config/loader.js";
import type { CloudItem, LocalEntry } from "../../sync/engine.js";
import type { PlatformSyncer } from "../../sync/types.js";
import {
  LarkClient,
  type DriveSearchItem,
  type MindnoteNode,
  type WikiNode,
  type MinuteDetail,
} from "./client.js";
import {
  buildWikiNodeFrontmatter,
  buildMinuteFrontmatter,
  extractMinuteTitle,
  spaceSlug,
  unixToIso as unixToIsoLocal,
  type LarkOkfFields,
} from "./convert.js";

/**
 * Sentinel: when the user doesn't pin a space list and doesn't pass
 * `--root`, syncer expands this to "every space the user can see".
 */
const ALL_SPACES_SENTINEL = "*";

/**
 * Build the path-from-root segments for a node, walking up the
 * parent chain in the in-memory `tree`. Cycle-guard via a visited
 * set so a malformed parent loop doesn't hang.
 *
 * The returned list is *titles* (already sanitized at write time by
 * `sanitizeFileName`), not raw node_tokens, because the on-disk path
 * is title-based. Each segment is the directory name the parent
 * node should occupy.
 */
function computePathSegmentsFor(
  node: WikiNode,
  tree: Map<string, WikiNode>,
): string[] {
  const segments: string[] = [];
  const seen = new Set<string>();
  let cur: WikiNode | undefined = node;
  while (cur) {
    if (seen.has(cur.node_token)) break;
    seen.add(cur.node_token);
    segments.unshift(sanitizeFileNameLocal(cur.title || "untitled"));
    const parentToken = cur.parent_node_token;
    if (!parentToken) break;
    cur = tree.get(parentToken);
  }
  return segments;
}

/** Depth for sort-ordering: shorter path first so parents land first. */
function pathDepth(item: CloudItem): number {
  const segs = item.extras?.path_segments as string[] | undefined;
  return segs ? segs.length : 1;
}

/** Local thin wrapper so we don't pollute the import list at the top. */
function sanitizeFileNameLocal(name: string): string {
  // Mirrors utils/sanitize.ts:sanitizeFileName. Inlined here to keep
  // the BFS helper free of cross-module imports.
  if (!name) return "untitled";
  const cleaned = name.replace(/[\\\/\?%\*\:\|"<>]/g, " ").trim();
  return cleaned.length === 0 ? "untitled" : cleaned;
}

/**
 * Resolve the top-level subdirectory for a wiki space. The contract:
 *   - my_library → `["my-library"]`
 *   - any other (numeric) space_id → `["wiki", <space-slug>]`
 *
 * The space slug is the human-readable name (when we have one) or
 * `lark-<id-prefix>` as fallback — same logic as `convert.spaceSlug`.
 */
function resolveTopSubdir(
  spaceId: string | null,
  spaceName: string | null,
  ownerName?: string | null,
): string[] {
  // The personal library: detected either by the raw alias or by the
  // human name we hard-code for it in listCloud ("my-library").
  if (spaceId === "my_library" || spaceName === "my-library") {
    return ["personal", sanitizeFileNameLocal(ownerName || "未知所有者")];
  }
  if (spaceName) return ["wiki", normalizeSlug(spaceName)];
  return ["wiki", `lark-${(spaceId ?? "").slice(0, 6)}`];
}

/** Same normalization as `convert.normalizeSlug` — kept inline so the
 *  syncer doesn't import convert just for one helper. */
function normalizeSlug(label: string): string {
  return label
    .trim()
    .replace(/[\s·/\\:?*"<>|]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "unscoped";
}

export class LarkSyncer implements PlatformSyncer {
  readonly platform = "lark" as const;
  /** Every run refreshes every doc — see sync/types.ts for rationale. */
  readonly fullResync = true as const;
  private readonly api: LarkClient;
  private readonly wikiNodeCache = new Map<string, Promise<WikiNode>>();

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
    this.wikiNodeCache.clear();
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

    let allNodesBySpace = new Map<string, Map<string, WikiNode>>();
    const spaceNameBySpaceId = new Map<string, string>();
    const out: CloudItem[] = [];

    let spaceIds = this.resolveSpaceIds(args.config, args.rootOverride);
    // Expand the "all spaces" sentinel: my_library + every team space.
    if (spaceIds.length === 1 && spaceIds[0] === ALL_SPACES_SENTINEL) {
      const all = new Set<string>(["my_library"]);
      try {
        const spaces = await this.api.listWikiSpaces();
        for (const s of spaces) all.add(s.space_id);
      } catch (err) {
        console.warn(
          `  ⚠ wiki +space-list failed during default expansion: ${err instanceof Error ? err.message : err}`,
        );
      }
      spaceIds = Array.from(all);
    }

    for (const rawSpaceId of spaceIds) {
      // The `my_library` alias always resolves to the personal
      // library; we hard-code its human name because `+space-list`
      // only enumerates team spaces and never returns a name for it.
      const hintName = rawSpaceId === "my_library" ? "my-library" : spaceNames.get(rawSpaceId) ?? null;
      if (hintName) spaceNameBySpaceId.set(rawSpaceId, hintName);
      const tree = await this.collectWikiTree(rawSpaceId, hintName);
      allNodesBySpace.set(rawSpaceId, tree);
    }

    // Flatten to CloudItem[]. Sort by depth so parents are written
    // before children (helps path-allocator pre-fill directory names
    // and means a `mkdirSync(..., recursive: true)` succeeds for the
    // parent directory before the child tries to land inside).
    //
    // CRITICAL: `uuid` is the obj_token, NOT the node_token. The
    // pre-2026-07 local files stamped `lark_id = obj_token` into
    // frontmatter, so obj_token is the actual idempotency key on
    // disk. Using node_token as the cloud→local match key would
    // re-create every existing file at the new (correct) path,
    // because no local entry would ever match a node_token in the
    // loadLocal map. node_token is preserved in extras for
    // cross-referencing and as `lark_node_token` in frontmatter.
    const flat: CloudItem[] = [];
    for (const [rawSpaceId, tree] of allNodesBySpace.entries()) {
      // `+node-list` resolves my_library → a numeric space_id, so the
      // node's space_id is the numeric one. The map keys are the
      // *raw* input ids (may be "my_library"); look up either form.
      const sample = [...tree.values()][0];
      const resolvedSpaceId = sample?.space_id ?? rawSpaceId;
      const spaceName =
        spaceNameBySpaceId.get(rawSpaceId) ??
        spaceNameBySpaceId.get(resolvedSpaceId ?? "") ??
        null;

      if (resolvedSpaceId && resolvedSpaceId !== "my_library") {
        flat.push(this.spaceIndexItem(resolvedSpaceId, spaceName));
      }
      for (const node of tree.values()) {
        flat.push(this.nodeToCloudItem(node, tree));
      }
    }
    flat.sort((a, b) => pathDepth(a) - pathDepth(b));
    out.push(...flat);

    // Drive Search discovers standalone docs/files that are not reachable
    // from a Wiki tree. It also returns Wiki hits, so dedupe on the
    // underlying object token and keep the hierarchical Wiki item when one
    // already exists.
    try {
      const known = new Map(out.map((item) => [item.uuid, item]));
      const driveItems = await this.api.searchAllDriveItems();
      for (const result of driveItems) {
        const item = this.driveSearchItemToCloudItem(result);
        if (!item) continue;
        const existing = known.get(item.uuid);
        if (existing) {
          existing.extras = {
            ...(existing.extras ?? {}),
            owner_name: item.extras?.owner_name ?? existing.extras?.owner_name ?? null,
          };
          continue;
        }
        const resolved = result.entity_type === "WIKI"
          ? await this.resolveSearchWikiItem(item, spaceNames)
          : item;
        known.set(resolved.uuid, resolved);
        out.push(resolved);
      }

      // The personal-library space index has no owner metadata of its own.
      // Infer the directory owner from the personal docs returned by Search.
      const personalOwner = mostFrequentString(
        out
          .filter((item) => item.extras?.space_name === "my-library")
          .map((item) => item.extras?.owner_name)
          .filter((value): value is string => typeof value === "string" && value.length > 0),
      ) ?? "未知所有者";
      for (const item of out) {
        if (item.extras?.space_name === "my-library" && !item.extras.owner_name) {
          item.extras.owner_name = personalOwner;
        }
      }
    } catch (err) {
      console.warn(
        `  ⚠ drive +search skipped: ${err instanceof Error ? err.message : err}`,
      );
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
          lastEditedTime: new Date().toISOString(),
          createdTime: new Date().toISOString(),
          parent: { type: "minutes", id: null },
          extras: { kind: "minute" },
        });
      }
    } catch (err) {
      console.warn(
        `  ⚠ minutes search skipped: ${err instanceof Error ? err.message : err}`,
      );
    }

    return out;
  }

  private driveSearchItemToCloudItem(result: DriveSearchItem): CloudItem | null {
    const meta = result.result_meta;
    if (!meta?.token || !meta.doc_types) return null;

    let icon: { token?: string; file_type?: string | null } = {};
    try {
      icon = meta.icon_info ? JSON.parse(meta.icon_info) : {};
    } catch {
      // Search results remain usable without optional icon metadata.
    }

    const objType = normalizeDriveObjectType(meta.doc_types);
    const objToken = icon.token || meta.token;
    const title = decodeSearchHighlight(result.title_highlighted) || "untitled";
    return {
      uuid: objToken,
      title,
      url: meta.url ?? buildObjectUrl(objType, meta.token),
      createdTime: unixToIsoLocal(meta.create_time) || new Date().toISOString(),
      lastEditedTime: unixToIsoLocal(meta.update_time) || new Date().toISOString(),
      parent: { type: "drive", id: null },
      extras: {
        kind: "drive-item",
        obj_token: objToken,
        obj_type: objType,
        node_token: result.entity_type === "WIKI" ? meta.token : null,
        file_extension: icon.file_type ?? null,
        owner_name: meta.owner_name ?? null,
        entity_type: result.entity_type,
        path_segments: [objType, objToken],
      },
    };
  }

  /** Resolve Search-only Wiki hits into a knowledge-base hierarchy. */
  private async resolveSearchWikiItem(
    item: CloudItem,
    spaceNames: Map<string, string>,
  ): Promise<CloudItem> {
    const objToken = (item.extras?.obj_token as string | undefined) ?? item.uuid;
    const objType = (item.extras?.obj_type as string | undefined) ?? "docx";
    const node = await safeRetrieve(
      () => this.getWikiNodeCached(objToken, objType),
      `wiki +node-get ${objToken}`,
    );
    if (!node) return item;

    const chain: WikiNode[] = [node];
    const seen = new Set<string>([node.node_token]);
    let cursor = node;
    for (let depth = 0; depth < 100 && cursor.parent_node_token; depth++) {
      if (seen.has(cursor.parent_node_token)) break;
      seen.add(cursor.parent_node_token);
      const parent = await safeRetrieve(
        () => this.getWikiNodeByNodeTokenCached(cursor.parent_node_token!),
        `wiki +node-get ${cursor.parent_node_token}`,
      );
      if (!parent) break;
      chain.push(parent);
      cursor = parent;
    }

    const root = chain[chain.length - 1] ?? node;
    const listedSpaceName = node.space_id ? spaceNames.get(node.space_id) : undefined;
    const spaceName = listedSpaceName ?? root.title ?? `知识库-${(node.space_id ?? "unknown").slice(0, 8)}`;
    const fullSegments = chain
      .slice()
      .reverse()
      .map((entry) => sanitizeFileName(entry.title || "untitled"));
    const usesRootAsSpaceName = !listedSpaceName && root.title === spaceName;

    return {
      ...item,
      parent: { type: "wiki", id: node.parent_node_token || null },
      extras: {
        ...(item.extras ?? {}),
        kind: "wiki-node",
        space_id: node.space_id ?? null,
        space_name: spaceName,
        node_token: node.node_token,
        obj_token: node.obj_token ?? objToken,
        obj_type: node.obj_type ?? objType,
        has_child: node.has_child ?? false,
        is_space_root: usesRootAsSpaceName && node.node_token === root.node_token,
        path_segments: usesRootAsSpaceName ? fullSegments.slice(1) : fullSegments,
      },
    };
  }

  /**
   * Walk a wiki subtree and return every node (parents + leaves),
   * keyed by node_token. The returned map also records `parent_node_token`
   * on each node so callers can rebuild the path-to-root.
   */
  private async collectWikiTree(
    spaceId: string,
    spaceName: string | null,
  ): Promise<Map<string, WikiNode>> {
    const visited = new Map<string, WikiNode>();
    const queue: Array<{ spaceId: string; parent?: string }> = [{ spaceId }];

    while (queue.length > 0) {
      const head = queue.shift()!;
      const nodes = await safeRetrieve(
        () => this.api.listWikiNodes(head.spaceId, { parentNodeToken: head.parent }),
        `wiki +node-list ${head.spaceId}${head.parent ? ` (parent ${head.parent})` : ""}`,
      );
      if (!nodes) continue;

      for (const node of nodes) {
        if (!node.node_token || visited.has(node.node_token)) continue;

        // Resolve edit timestamp via +node-get (best-effort).
        let objEditTime = node.obj_edit_time;
        let objCreateTime = node.obj_create_time ?? node.node_create_time;
        if (node.obj_token && node.obj_type) {
          const meta = await safeRetrieve(
            () => this.getWikiNodeCached(node.obj_token!, node.obj_type!),
            `wiki +node-get ${node.obj_token}`,
          );
          if (meta) {
            objEditTime = meta.obj_edit_time ?? objEditTime;
            objCreateTime = meta.obj_create_time ?? meta.node_create_time ?? objCreateTime;
          }
        }

        visited.set(node.node_token, {
          ...node,
          space_id: node.space_id ?? head.spaceId,
          obj_edit_time: objEditTime,
          obj_create_time: objCreateTime,
        });

        if (node.has_child && node.node_token) {
          queue.push({ spaceId: head.spaceId, parent: node.node_token });
        }
      }
    }

    // Annotate every node with the resolved space name so the writer
    // can slug the top-level subdir without re-looking-up.
    if (spaceName) {
      for (const n of visited.values()) {
        n.space_name_hint = spaceName;
      }
    }

    return visited;
  }

  /** Reuse Wiki metadata across tree discovery, Search resolution, and render. */
  private getWikiNodeCached(objToken: string, objType: string): Promise<WikiNode> {
    return this.loadWikiNodeCached(
      `obj:${objType}:${objToken}`,
      () => this.api.getWikiNode(objToken, objType),
    );
  }

  private getWikiNodeByNodeTokenCached(nodeToken: string): Promise<WikiNode> {
    return this.loadWikiNodeCached(
      `node:${nodeToken}`,
      () => this.api.getWikiNodeByNodeToken(nodeToken),
    );
  }

  private loadWikiNodeCached(
    key: string,
    load: () => Promise<WikiNode>,
  ): Promise<WikiNode> {
    const existing = this.wikiNodeCache.get(key);
    if (existing) return existing;

    const pending = load()
      .then((node) => {
        this.wikiNodeCache.set(`node:${node.node_token}`, Promise.resolve(node));
        if (node.obj_token && node.obj_type) {
          this.wikiNodeCache.set(
            `obj:${node.obj_type}:${node.obj_token}`,
            Promise.resolve(node),
          );
        }
        return node;
      })
      .catch((error) => {
        this.wikiNodeCache.delete(key);
        throw error;
      });
    this.wikiNodeCache.set(key, pending);
    return pending;
  }

  /**
   * Build a synthetic CloudItem that writes the per-space `index.md`
   * — the human-readable anchor of a wiki knowledge base. Only team
   * spaces get this; my_library lives under `<root>/Wiki/lark/my-library/`
   * directly and doesn't need an index.
   */
  private spaceIndexItem(spaceId: string, spaceName: string | null): CloudItem {
    const name = spaceName ?? `lark-${spaceId.slice(0, 6)}`;
    return {
      // Synthetic UUID: derive a stable id from the space id so a
      // re-sync doesn't re-create the file (loadLocal will match).
      uuid: `space:${spaceId}`,
      title: name,
      url: `https://feishu.cn/wiki/space/${spaceId}`,
      lastEditedTime: new Date().toISOString(),
      createdTime: new Date().toISOString(),
      parent: { type: "wiki", id: null },
      extras: {
        kind: "space-index",
        space_id: spaceId,
        space_name: spaceName,
        has_child: false,
        path_segments: [], // depth 0 → top of the space tree
      },
    };
  }

  private nodeToCloudItem(
    node: WikiNode,
    tree: Map<string, WikiNode>,
  ): CloudItem {
    const lastEdited = unixToIsoLocal(node.obj_edit_time) || new Date().toISOString();
    const created = unixToIsoLocal(node.obj_create_time) || new Date().toISOString();
    // Idempotency key = obj_token. Pre-2026-07 local files stamped
    // `lark_id = obj_token` in frontmatter; using node_token here
    // would force re-creation on every sync because no local entry
    // would match a node_token in the loadLocal map. Falls back to
    // node_token only when the obj_token is missing (shouldn't
    // happen for real wiki nodes — `+node-list` always returns one).
    const uuid = node.obj_token || node.node_token;
    return {
      uuid,
      title: node.title || "untitled",
      url: `https://feishu.cn/wiki/${node.node_token}`,
      lastEditedTime: lastEdited,
      createdTime: created,
      parent: { type: "wiki", id: node.parent_node_token || null },
      extras: {
        kind: "wiki-node",
        space_id: node.space_id ?? null,
        space_name: node.space_name_hint ?? null,
        node_token: node.node_token,
        obj_token: node.obj_token,
        obj_type: node.obj_type,
        has_child: node.has_child ?? false,
        path_segments: computePathSegmentsFor(node, tree),
      },
    };
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
    if (stored) {
      return stored
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // No override and no stored default → walk every wiki space the
    // user can see (personal library + all team spaces). This is the
    // "just sync my whole workspace" default: the user shouldn't have
    // to enumerate space IDs by hand for v1.
    //
    // We can't synchronously call the API here (resolveSpaceIds is
    // sync), so return a sentinel marker and let listCloud expand it
    // before BFS kicks off.
    return [ALL_SPACES_SENTINEL];
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

    // Space-level index.md: written FIRST so the directory exists
    // before any child writeNew lands inside it. We never overwrite
    // a hand-edited index — if `existingInonId` is set (loadLocal
    // hit), writeUpdate was already routed there; otherwise we
    // write a fresh stub.
    if (kind === "space-index") {
      return this.writeSpaceIndex(item, config);
    }

    const absPath = this.resolveItemAbsPath(item, config);

    const { frontmatter: fm, body } = await this.renderItem(item, absPath);
    if (existingInonId) fm.inon_id = existingInonId;

    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    const md = writeFrontmatterBody(
      fm as unknown as Record<string, unknown>,
      body,
    );
    fs.writeFileSync(absPath, md, "utf8");
    return { relPath: path.relative(config.root, absPath) };
  }

  async writeUpdate(item: CloudItem, existing: LocalEntry, config: LoadedConfig) {
    existing = await this.migrateLegacyManagedPath(item, existing, config);
    const kind = (item.extras?.kind as string) ?? "wiki-node";
    if (kind === "space-index") {
      // We deliberately never overwrite a hand-edited space index.
      // User notes about the space (owners, conventions, etc.) live
      // in <space>/index.md; an unconditional rewrite would clobber
      // them. The anchor file is created on first sync; subsequent
      // runs are no-ops.
      return { relPath: path.relative(config.root, existing.absPath) };
    }
    const preserved = await this.readExistingInonId(existing.absPath);
    // Updates always target the existing Markdown path so user moves are
    // preserved and sidecar assets stay adjacent to the canonical file.
    const { frontmatter: fm, body } = await this.renderItem(item, existing.absPath);
    if (preserved) fm.inon_id = preserved;

    const md = writeFrontmatterBody(
      fm as unknown as Record<string, unknown>,
      body,
    );
    fs.writeFileSync(existing.absPath, md, "utf8");
    return { relPath: path.relative(config.root, existing.absPath) };
  }

  private resolveItemAbsPath(item: CloudItem, config: LoadedConfig): string {
    const kind = (item.extras?.kind as string) ?? "wiki-node";
    return this.resolveNodeAbsPath({
      config,
      kind,
      spaceId:
        kind === "minute" ? null : ((item.extras?.space_id as string | undefined) ?? null),
      spaceName:
        kind === "minute" ? null : ((item.extras?.space_name as string | undefined) ?? null),
      title: item.title || "untitled",
      hasChild: Boolean(item.extras?.has_child),
      pathSegments: (item.extras?.path_segments as string[] | undefined) ?? null,
      ownerName: (item.extras?.owner_name as string | undefined) ?? null,
      isSpaceRoot: Boolean(item.extras?.is_space_root),
    });
  }

  /** One-time migration from the superseded type-based layout. */
  private async migrateLegacyManagedPath(
    item: CloudItem,
    existing: LocalEntry,
    config: LoadedConfig,
  ): Promise<LocalEntry> {
    const rel = existing.relPath.split(path.sep).join("/");
    const legacy = rel.startsWith("Wiki/lark/drive/") || rel.startsWith("Wiki/lark/my-library/");
    if (!legacy) return existing;

    const kind = (item.extras?.kind as string) ?? "wiki-node";
    const desired = kind === "space-index"
      ? this.resolveSpaceIndexAbsPath(item, config)
      : this.resolveItemAbsPath(item, config);
    if (desired === existing.absPath || fs.existsSync(desired)) return existing;

    fs.mkdirSync(path.dirname(desired), { recursive: true });
    await fs.promises.rename(existing.absPath, desired);

    const oldAssets = path.join(
      path.dirname(existing.absPath),
      `${path.basename(existing.absPath, ".md")}.assets`,
    );
    const newAssets = path.join(
      path.dirname(desired),
      `${path.basename(desired, ".md")}.assets`,
    );
    if (fs.existsSync(oldAssets) && !fs.existsSync(newAssets)) {
      await fs.promises.rename(oldAssets, newAssets);
    }

    return {
      ...existing,
      absPath: desired,
      relPath: path.relative(config.root, desired),
    };
  }

  /** Shared body/frontmatter pipeline for both create and update paths. */
  private async renderItem(
    item: CloudItem,
    markdownPath: string,
  ): Promise<{ frontmatter: LarkOkfFields; body: string }> {
    const kind = (item.extras?.kind as string) ?? "wiki-node";
    if (kind === "minute") {
      const frontmatter = buildMinuteFrontmatter({
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
      if (detail) stampMinuteMetadata(frontmatter, detail);
      return {
        frontmatter,
        body: renderMinuteBody(detail, frontmatter.title, item.url),
      };
    }

    const objToken = (item.extras?.obj_token as string | undefined) ?? item.uuid;
    const objType = (item.extras?.obj_type as string | undefined) ?? "docx";
    let frontmatter: LarkOkfFields;

    if (kind === "drive-item") {
      frontmatter = buildDriveItemFrontmatter(item, objToken, objType);
    } else {
      const spaceId = (item.extras?.space_id as string | undefined) ?? null;
      const nodeMeta = await safeRetrieve(
        () => this.getWikiNodeCached(objToken, objType),
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
      frontmatter = buildWikiNodeFrontmatter({
        node: merged,
        url: item.url,
        spaceName: (item.extras?.space_name as string | undefined) ?? null,
      });
      const ownerName = item.extras?.owner_name;
      if (typeof ownerName === "string" && ownerName) frontmatter.author = ownerName;
    }

    const body = await this.fetchObjectBody(item, frontmatter, markdownPath, objToken, objType);
    return { frontmatter, body };
  }

  /** Fetch readable content or preserve a faithful sidecar snapshot. */
  private async fetchObjectBody(
    item: CloudItem,
    frontmatter: LarkOkfFields,
    markdownPath: string,
    objToken: string,
    objType: string,
  ): Promise<string> {
    if (objType === "docx") {
      const fetched = await safeRetrieve(
        () => this.api.fetchDocMarkdown(objToken),
        `docs +fetch ${objToken}`,
      );
      return fetched && fetched.trim()
        ? `${fetched}\n`
        : renderUnavailableBody(frontmatter.title, item.url, objType);
    }

    if (objType === "mindnote") {
      const nodes = await safeRetrieve(
        () => this.api.listMindnoteNodes(objToken),
        `mindnotes nodes list ${objToken}`,
      );
      return nodes
        ? renderMindnoteBody(frontmatter.title, item.url, nodes)
        : renderUnavailableBody(frontmatter.title, item.url, objType);
    }

    if (objType === "bitable") {
      const markdown = await safeRetrieve(
        () => this.api.fetchBaseMarkdown(objToken),
        `base records ${objToken}`,
      );
      const snapshot = await this.saveExportSnapshot(
        markdownPath,
        frontmatter.title,
        objToken,
        "bitable",
        "base",
      );
      return renderSnapshotBody(frontmatter.title, item.url, objType, snapshot, markdown);
    }

    if (objType === "sheet") {
      const snapshot = await this.saveExportSnapshot(
        markdownPath,
        frontmatter.title,
        objToken,
        "sheet",
        "xlsx",
      );
      return renderSnapshotBody(frontmatter.title, item.url, objType, snapshot);
    }

    if (objType === "slides") {
      const snapshot = await this.saveExportSnapshot(
        markdownPath,
        frontmatter.title,
        objToken,
        "slides",
        "pptx",
      );
      return renderSnapshotBody(frontmatter.title, item.url, objType, snapshot);
    }

    if (objType === "doc") {
      const snapshot = await this.saveExportSnapshot(
        markdownPath,
        frontmatter.title,
        objToken,
        "doc",
        "markdown",
      );
      let content: string | null = null;
      if (snapshot?.absPath) {
        content = await safeRetrieve(
          () => fs.promises.readFile(snapshot.absPath, "utf8"),
          `read exported markdown ${objToken}`,
        );
      }
      return content?.trim()
        ? `${content}\n`
        : renderSnapshotBody(frontmatter.title, item.url, objType, snapshot);
    }

    if (objType === "file") {
      const ext = inferFileExtension(item.title, item.extras?.file_extension);
      const artifact = this.resolveArtifactPath(markdownPath, item.title, ext);
      fs.mkdirSync(path.dirname(artifact.absPath), { recursive: true });
      const downloaded = await safeRetrieve(
        () => this.api.downloadFile(objToken, artifact.absPath),
        `drive +download ${objToken}`,
      );
      return renderSnapshotBody(
        frontmatter.title,
        item.url,
        objType,
        downloaded === null ? null : artifact,
      );
    }

    return renderUnavailableBody(frontmatter.title, item.url, objType);
  }

  private async saveExportSnapshot(
    markdownPath: string,
    title: string,
    token: string,
    docType: "doc" | "sheet" | "bitable" | "slides",
    extension: "markdown" | "xlsx" | "base" | "pptx",
  ): Promise<{ absPath: string; relPath: string } | null> {
    const artifact = this.resolveArtifactPath(markdownPath, title, extension);
    fs.mkdirSync(path.dirname(artifact.absPath), { recursive: true });
    const exported = await safeRetrieve(
      () => this.api.exportDocument({ token, docType, extension, outputPath: artifact.absPath }),
      `drive +export ${token}`,
    );
    return exported === null || !fs.existsSync(artifact.absPath) ? null : artifact;
  }

  private resolveArtifactPath(
    markdownPath: string,
    title: string,
    extension: string,
  ): { absPath: string; relPath: string } {
    const mdBase = path.basename(markdownPath, ".md");
    const assetDir = path.join(path.dirname(markdownPath), `${mdBase}.assets`);
    const safeTitle = sanitizeFileName(title);
    const wantedExt = `.${extension.replace(/^\./, "")}`;
    const fileName = safeTitle.toLowerCase().endsWith(wantedExt.toLowerCase())
      ? safeTitle
      : `${safeTitle}${wantedExt}`;
    const absPath = path.join(assetDir, fileName);
    const relPath = path.relative(path.dirname(markdownPath), absPath).split(path.sep).join("/");
    return { absPath, relPath };
  }

  /**
   * Write the per-space index.md. Path:
   * `<root>/Wiki/lark/wiki/<space-name>/index.md`.
   *
   * Body: name + space_id + URL. Kept short so users can hand-edit
   * notes about the space (purpose, owners, conventions) without
   * the syncer overwriting them — `existingInonId` plumbing in
   * dispatcher + writeUpdate preserves user edits to existing
   * index.md files.
   */
  private async writeSpaceIndex(
    item: CloudItem,
    config: LoadedConfig,
  ): Promise<{ relPath: string }> {
    const spaceId = item.extras?.space_id as string;
    const spaceName = (item.extras?.space_name as string | null) ?? item.title;
    const ownerName = (item.extras?.owner_name as string | null) ?? null;
    const absPath = this.resolveSpaceIndexAbsPath(item, config);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });

    // Read existing index.md if present (user may have hand-edited
    // notes); preserve their custom body and only refresh the
    // frontmatter + the minimal anchor lines.
    const fm: Record<string, unknown> = {
      type: "Lark Wiki Space",
      source: "lark",
      title: spaceName,
      resource: `https://feishu.cn/wiki/space/${spaceId}`,
      timestamp: new Date().toISOString(),
      created_time: "",
      last_edited_time: "",
      lark_id: `space:${spaceId}`,
      lark_space_id: spaceId,
      author: ownerName ?? "",
      tags: ["Lark", `lark/wiki/${spaceName.toLowerCase().replace(/\s+/g, "-")}`],
    };

    let body = `# ${spaceName}\n\n`;
    body += `> 飞书知识库空间 · space_id = \`${spaceId}\`\n`;
    body += `> 来源链接：[在飞书中打开](https://feishu.cn/wiki/space/${spaceId})\n\n`;
    body += `## 关于本目录\n\n`;
    body += `- 此目录下的文件是飞书 wiki 知识库「${spaceName}」的镜像。\n`;
    body += `- 有子节点的文档以 **目录 + index.md** 形式存放，叶子节点是 \`<title>.md\`。\n`;
    body += `- 移动、修改本目录下的文件不会被回写到飞书（okfa 只读）；\n`;
    body += `- 下次 \`okfa sync lark\` 时，本目录已有的文件按 \`lark_id\` 命中并保留原位。\n`;

    const md = writeFrontmatterBody(fm, body);
    fs.writeFileSync(absPath, md, "utf8");
    return { relPath: path.relative(config.root, absPath) };
  }

  private resolveSpaceIndexAbsPath(item: CloudItem, config: LoadedConfig): string {
    const spaceId = (item.extras?.space_id as string | null) ?? null;
    const spaceName = (item.extras?.space_name as string | null) ?? item.title;
    const ownerName = (item.extras?.owner_name as string | null) ?? null;
    return path.join(
      config.root,
      "Wiki",
      "lark",
      ...resolveTopSubdir(spaceId, spaceName, ownerName),
      "index.md",
    );
  }

  /**
   * Compute the absolute path a node should be written to.
   *
   * Top-level layout:
   *   - `<root>/Wiki/lark/personal/<owner>/...` for personal/Drive docs
   *   - `<root>/Wiki/lark/wiki/<space-name>/...` for team wiki spaces
   *   - `<root>/Wiki/lark/minutes/...` for minutes
   *
   * Inside a wiki space, every node — leaf OR intermediate — is laid
   * out as `<space>/<path-segments>/`. A leaf lands at
   * `<space>/<segments>/<title>.md`; a parent (has_child) lands at
   * `<space>/<segments>/<title>/index.md`. The space itself is the
   * root of the tree: its `index.md` describes the space and acts
   * as the "where to drop new docs into this knowledge base"
   * anchor.
   */
  private resolveNodeAbsPath(args: {
    config: LoadedConfig;
    kind: string;
    spaceId: string | null;
    spaceName: string | null;
    title: string;
    hasChild: boolean;
    pathSegments: string[] | null;
    ownerName: string | null;
    isSpaceRoot: boolean;
  }): string {
    const {
      config,
      kind,
      spaceId,
      spaceName,
      title,
      hasChild,
      pathSegments,
      ownerName,
      isSpaceRoot,
    } = args;

    if (kind === "minute") {
      return path.join(
        config.root,
        "Wiki",
        "lark",
        "minutes",
        `${sanitizeFileName(title)}.md`,
      );
    }

    if (kind === "drive-item") {
      const tokenSuffix = String(args.pathSegments?.[1] ?? "").slice(0, 8);
      const stableName = tokenSuffix
        ? `${sanitizeFileName(title)} [${tokenSuffix}]`
        : sanitizeFileName(title);
      return path.join(
        config.root,
        "Wiki",
        "lark",
        "personal",
        sanitizeFileName(ownerName || "未知所有者"),
        `${stableName}.md`,
      );
    }

    // Top-level subdir for this space: my-library for the personal
    // alias, wiki/<space-name> for team spaces.
    const topSubdir = resolveTopSubdir(spaceId, spaceName, ownerName);

    if (isSpaceRoot) {
      return path.join(config.root, "Wiki", "lark", ...topSubdir, "index.md");
    }

    // path_segments from BFS. The last segment is the node's own
    // title (matching its parent's "child" entry).
    const sanitized = sanitizeFileName(title);
    const segments = pathSegments && pathSegments.length > 0 ? pathSegments : [sanitized];

    const parentDirs = segments.slice(0, -1);
    const selfSegment = segments[segments.length - 1] ?? sanitized;

    const dirPath = path.join(
      config.root,
      "Wiki",
      "lark",
      ...topSubdir,
      ...parentDirs,
    );

    return hasChild
      ? path.join(dirPath, selfSegment, "index.md")
      : path.join(dirPath, `${selfSegment}.md`);
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

function normalizeDriveObjectType(raw: string): string {
  const normalized = raw.trim().toLowerCase();
  return normalized === "base" ? "bitable" : normalized;
}

function mostFrequentString(values: string[]): string | null {
  const counts = new Map<string, number>();
  let winner: string | null = null;
  let winnerCount = 0;
  for (const value of values) {
    const next = (counts.get(value) ?? 0) + 1;
    counts.set(value, next);
    if (next > winnerCount) {
      winner = value;
      winnerCount = next;
    }
  }
  return winner;
}

function decodeSearchHighlight(value: string): string {
  return value
    .replace(/<\/?h[b]?>/gi, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function buildObjectUrl(objType: string, token: string): string {
  const prefix: Record<string, string> = {
    bitable: "base",
    sheet: "sheets",
    slides: "slides",
    file: "file",
    mindnote: "mindnotes",
    doc: "doc",
    docx: "docx",
  };
  return `https://feishu.cn/${prefix[objType] ?? objType}/${token}`;
}

function buildDriveItemFrontmatter(
  item: CloudItem,
  objToken: string,
  objType: string,
): LarkOkfFields {
  return {
    type: "Lark Document",
    source: "lark",
    title: item.title || "untitled",
    resource: item.url,
    timestamp: item.lastEditedTime,
    created_time: item.createdTime,
    last_edited_time: item.lastEditedTime,
    lark_id: item.uuid,
    lark_obj_token: objToken,
    lark_obj_type: objType,
    lark_space_id: null,
    lark_parent_type: "drive",
    lark_parent_id: null,
    tags: ["Lark", `lark/drive/${objType}`],
    author: (item.extras?.owner_name as string | undefined) ?? "",
  };
}

function stampMinuteMetadata(frontmatter: LarkOkfFields, detail: MinuteDetail): void {
  if (detail.duration) frontmatter.lark_duration_ms = detail.duration;
  if (detail.create_time) {
    const created = millisToIso(detail.create_time);
    frontmatter.created_time = created;
    frontmatter.last_edited_time = created;
    frontmatter.timestamp = created;
  }
  if (detail.note_id) frontmatter.lark_note_id = detail.note_id;
  if (Array.isArray(detail.keywords) && detail.keywords.length > 0) {
    frontmatter.lark_keywords = detail.keywords.join(", ");
  }
}

function renderSnapshotBody(
  title: string,
  url: string,
  objType: string,
  snapshot?: { relPath: string } | null,
  markdown?: string | null,
): string {
  const parts = [
    `# ${title}`,
    `> 飞书 ${objType} · [原页面](${url})`,
  ];
  if (snapshot) {
    parts.push(`> 本地快照：[${path.basename(snapshot.relPath)}](<${snapshot.relPath}>)`);
  } else {
    parts.push("> 本地快照未能下载；元数据与原页面链接已保留。");
  }
  if (markdown?.trim()) parts.push(markdown.trim());
  return `${parts.join("\n\n")}\n`;
}

function renderUnavailableBody(title: string, url: string, objType: string): string {
  return `# ${title}\n\n> 飞书 ${objType} · [原页面](${url})\n\n` +
    "该对象已发现并保存元数据，但当前 lark-cli 没有返回可落盘的正文或快照。\n";
}

function inferFileExtension(title: string, rawExtension: unknown): string {
  const fromTitle = path.extname(title).replace(/^\./, "");
  if (fromTitle) return fromTitle;
  if (typeof rawExtension === "string" && rawExtension.trim()) {
    return rawExtension.trim().replace(/^\./, "").toLowerCase();
  }
  return "bin";
}

function renderMindnoteBody(title: string, url: string, nodes: MindnoteNode[]): string {
  const byParent = new Map<string, MindnoteNode[]>();
  const knownIds = new Set(nodes.map((node) => node.node_id));
  for (const node of nodes) {
    const parent = node.parent_id && knownIds.has(node.parent_id) ? node.parent_id : "__root__";
    const siblings = byParent.get(parent) ?? [];
    siblings.push(node);
    byParent.set(parent, siblings);
  }

  const lines = [`# ${title}`, "", `> 飞书思维笔记 · [原页面](${url})`, ""];
  const visited = new Set<string>();
  const render = (parent: string, depth: number): void => {
    for (const node of byParent.get(parent) ?? []) {
      if (visited.has(node.node_id)) continue;
      visited.add(node.node_id);
      const text = richTextContent(node.texts) || "（无标题节点）";
      const suffix = node.finish ? " ✅" : "";
      lines.push(`${"  ".repeat(depth)}- ${text}${suffix}`);
      const notes = richTextContent(node.notes);
      if (notes) lines.push(`${"  ".repeat(depth + 1)}> ${notes}`);
      render(node.node_id, depth + 1);
    }
  };
  render("__root__", 0);
  for (const node of nodes) {
    if (!visited.has(node.node_id)) {
      lines.push(`- ${richTextContent(node.texts) || "（无标题节点）"}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

function richTextContent(
  elements: Array<{ element_type?: string; text?: { content?: string } }> | undefined,
): string {
  return (elements ?? [])
    .map((element) => element.text?.content ?? "")
    .join("")
    .replace(/\s+/g, " ")
    .trim();
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
