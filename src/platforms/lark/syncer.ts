/**
 * Lark `PlatformSyncer` implementation.
 *
 * Status: v1 stub. The full pull path is intentionally left as TODO so
 * we can ship a working CLI + Skill surface immediately. The hooks here
 * mean the engineer who wires the Lark API only needs to fill in
 * `listCloud` body; everything else reuses the generic dispatcher.
 */
import * as fs from "fs";
import * as path from "path";
import { writeFrontmatterBody, parseFrontmatter } from "../../utils/frontmatter.js";
import { IgnoreMatcher } from "../../ignore/matcher.js";
import type { LoadedConfig } from "../../config/loader.js";
import type { CloudItem, LocalEntry } from "../../sync/engine.js";
import type { PlatformSyncer } from "../../sync/types.js";
import { LarkClient, type LarkContext } from "./api.js";

export class LarkSyncer implements PlatformSyncer {
  readonly platform = "lark" as const;
  private readonly api: LarkClient;

  constructor(ctx: LarkContext) {
    this.api = new LarkClient(ctx);
  }

  async listCloud(_args: { config: LoadedConfig; rootOverride?: string }): Promise<CloudItem[]> {
    // TODO: walk Lark wiki / docx tree starting from a configured root.
    // For v1 we return [] — incremental sync from Lark surfaces nothing yet.
    console.warn("⚠ lark sync: not yet implemented — skipping (no-op).");
    return [];
  }

  async loadLocal(args: { config: LoadedConfig }): Promise<Map<string, LocalEntry>> {
    const map = new Map<string, LocalEntry>();
    const matcher = IgnoreMatcher.fromConfig(args.config.root, args.config.config);
    const larkDir = path.join(args.config.root, "lark");
    if (!fs.existsSync(larkDir)) return map;

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
            if (frontmatter && typeof frontmatter.lark_id === "string") {
              map.set(frontmatter.lark_id as string, {
                absPath: full,
                relPath: path.relative(args.config.root, full),
                lastEditedTime:
                  typeof frontmatter.last_edited_time === "string"
                    ? (frontmatter.last_edited_time as string)
                    : undefined,
              });
            }
          } catch {
            // skip malformed
          }
        }
      }
    }

    await walk(larkDir);
    return map;
  }

  async writeNew(_item: CloudItem, _targetDir: string, _config: LoadedConfig): Promise<{ relPath: string }> {
    throw new Error("lark platform: writeNew not yet implemented (see todo in listCloud).");
  }

  async writeUpdate(_item: CloudItem, _existing: LocalEntry, _config: LoadedConfig): Promise<{ relPath: string }> {
    // TODO: when wired, mirror Notion's `readExistingInonId` pattern
    // (see src/platforms/notion/syncer.ts) — read existing file's
    // `inon_id` first, pass it through to writeNew so identity is
    // preserved across syncs.
    throw new Error("lark platform: writeUpdate not yet implemented (see todo in listCloud).");
  }

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
