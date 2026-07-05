/**
 * Notion `PlatformSyncer` implementation.
 *
 * Wraps the historical Notion logic (page/db/search/blocks/ancestor/budget)
 * with the new sync contract:
 *  - listCloud: streaming pages + databases from a configured root id
 *  - loadLocal: scan workspace for `notion_id` frontmatter
 *  - writeNew / writeUpdate: fetch blocks, render markdown, persist
 */
import * as fs from "fs";
import * as path from "path";
import { Client } from "@notionhq/client";
import { writeFrontmatterBody, parseFrontmatter } from "../../utils/frontmatter.js";
import { safeRetrieve } from "../../utils/safe-call.js";
import { sanitizeFileName } from "../../utils/sanitize.js";
import { createPathAllocator } from "../../utils/path-allocator.js";
import { IgnoreMatcher } from "../../ignore/matcher.js";
import type { LoadedConfig } from "../../config/loader.js";
import type { CloudItem, LocalEntry } from "../../sync/engine.js";
import type { PlatformSyncer, SyncResult } from "../../sync/types.js";

import { retrievePage } from "./page.js";
import { retrieveDataSource } from "./database.js";
import { searchAll } from "./search.js";
import { makeFetchChildren, fetchAllBlocks, buildTree } from "./blocks.js";
import { renderBlocksToMarkdown } from "./markdown.js";
import { buildBlockAncestorIndex } from "./ancestor.js";
import { buildBudgetedPathMap } from "./budget.js";
import { NotionLimiter } from "../../utils/limiter.js";
import {
  buildNotionPageFrontmatter,
  buildNotionDatabaseFrontmatter,
} from "./convert.js";

export class NotionSyncer implements PlatformSyncer {
  readonly platform = "notion" as const;

  constructor(private readonly token: string) {}

  private client() {
    return new Client({ auth: this.token, notionVersion: "2026-03-11", timeoutMs: 60_000 });
  }

  async listCloud(args: { config: LoadedConfig; rootOverride?: string }): Promise<CloudItem[]> {
    const client = this.client();
    const limiter = new NotionLimiter();
    const notionRoot =
      args.rootOverride ??
      args.config.config.notion?.state?.default_root_id;
    if (!notionRoot) {
      throw new Error(
        "Notion sync requires a root page id — pass --root <UUID> or set notion.state.default_root_id in config.",
      );
    }

    const fetchChildren = makeFetchChildren(client, limiter);
    const out: CloudItem[] = [];

    // BFS over pages starting from `notionRoot`.
    // Use search to enumerate workspace, then restrict to the subtree rooted at the target.
    const allPages = await searchAll(client, limiter, "page");
    const allDataSources = await searchAll(client, limiter, "data_source");
    const allowedPageIds = computeDescendants(notionRoot, allPages);

    for (const p of allPages.filter((x) => allowedPageIds.has(x.id))) {
      out.push({
        uuid: p.id,
        title: p.title || "untitled",
        url: p.url,
        lastEditedTime: p.lastEditedTime,
        createdTime: (p as unknown as Record<string, string>).created_time ?? p.lastEditedTime,
        parent: { type: p.parentType, id: p.parentId },
      });
    }
    // Skip databases for now; the legacy puller supports them via
    // dedicated --data-source mode. Future work.
    void allDataSources;
    return out;
  }

  async loadLocal(args: { config: LoadedConfig }): Promise<Map<string, LocalEntry>> {
    const map = new Map<string, LocalEntry>();
    const matcher = IgnoreMatcher.fromConfig(args.config.root, args.config.config);
    const notionDir = path.join(args.config.root, "notion");
    if (!fs.existsSync(notionDir)) return map;

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
        if (e.isDirectory()) {
          await walk(full);
        } else if (e.isFile() && e.name.endsWith(".md")) {
          try {
            const content = await fs.promises.readFile(full, "utf8");
            const { frontmatter } = parseFrontmatter(content);
            if (frontmatter && typeof frontmatter.notion_id === "string") {
              let meta: unknown = frontmatter.last_edited_time;
              map.set(frontmatter.notion_id as string, {
                absPath: full,
                relPath: path.relative(args.config.root, full),
                lastEditedTime: typeof meta === "string" ? meta : undefined,
              });
            }
          } catch {
            // skip malformed
          }
        }
      }
    }

    await walk(notionDir);
    return map;
  }

  async writeNew(item: CloudItem, targetDir: string, _config: LoadedConfig): Promise<{ relPath: string }> {
    const client = this.client();
    const limiter = new NotionLimiter();
    const fetchChildren = makeFetchChildren(client, limiter);
    const meta = await safeRetrieve(
      () => retrievePage(client, limiter, item.uuid),
      `page:${item.uuid.slice(0, 8)}`,
    );
    if (!meta) throw new Error(`could not retrieve page ${item.uuid}`);

    const sanitized = sanitizeFileName(meta.title || "untitled");
    const allocator = createPathAllocator();
    const localPath = allocator.allocate(targetDir, sanitized, "file");
    const absPath = path.resolve(targetDir, localPath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });

    let body = "";
    try {
      const blocks = await fetchAllBlocks(fetchChildren, meta.id);
      const tree = buildTree(blocks);
      body = renderBlocksToMarkdown(tree, {
        pagePathMap: new Map(),
        currentPagePath: localPath,
        indentLevel: 0,
      });
    } catch (err) {
      console.warn(`  ⚠ blocks fetch failed for ${meta.id.slice(0, 8)}: ${err instanceof Error ? err.message : err}`);
    }

    const fm = buildNotionPageFrontmatter({
      id: meta.id,
      title: meta.title,
      url: meta.url,
      createdTime: meta.createdTime,
      lastEditedTime: meta.lastEditedTime,
      parentType: meta.parentType,
      parentId: meta.parentId,
      properties: meta.properties as Record<string, unknown>,
    });
    const md = writeFrontmatterBody(fm as unknown as Record<string, unknown>, `# ${meta.title}\n\n${body}\n`);
    fs.writeFileSync(absPath, md, "utf8");
    return { relPath: localPath };
  }

  async writeUpdate(item: CloudItem, existing: LocalEntry, _config: LoadedConfig) {
    // For v1, writeUpdate is a full re-fetch + overwrite (idempotent).
    return this.writeNew(item, path.dirname(existing.absPath), _config);
  }

  finalize(config: LoadedConfig, when: Date): LoadedConfig {
    const cur = (config.config.notion ?? { token: undefined, state: {}, options: {} }) as {
      token?: string;
      options?: Record<string, unknown>;
      state?: { last_sync_time?: string };
    };
    const next = {
      ...structuredClone(config.config),
      notion: {
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

/** Compute the descendant set of `rootUuid` using search hits' parent links. */
function computeDescendants(
  rootUuid: string,
  pages: import("./search.js").SearchHit[],
): Set<string> {
  const childrenByParent = new Map<string, string[]>();
  for (const p of pages) {
    if (p.parentType === "page_id" && p.parentId) {
      const list = childrenByParent.get(p.parentId) ?? [];
      list.push(p.id);
      childrenByParent.set(p.parentId, list);
    }
  }

  const out = new Set<string>([rootUuid]);
  const queue = [rootUuid];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const kids = childrenByParent.get(cur) ?? [];
    for (const k of kids) {
      if (!out.has(k)) {
        out.add(k);
        queue.push(k);
      }
    }
  }
  return out;
}
