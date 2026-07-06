/**
 * Generic sync dispatcher.
 *
 * 1. List cloud metadata (no body!).
 * 2. Load local disk → build UUID map.
 * 3. Diff cloud vs local via `engine.diff`.
 * 4. For each create/update, fetch body and write.
 * 5. Persist `last_sync_time` on success.
 */
import * as fs from "fs";
import * as path from "path";
import { diff } from "./engine.js";
import type { PlatformSyncer, SyncResult } from "./types.js";
import type { LoadedConfig } from "../config/loader.js";

/**
 * Resolve the per-platform base directory.
 *
 * - When `sync.pathTemplate` is the literal `${platform}`, every
 *   platform lands at `<root>/<platform>` (legacy behavior).
 * - When it's any other value, Lark honors it (e.g. `Wiki/lark` →
 *   `<root>/Wiki/lark`). Notion is unaffected to preserve existing
 *   workspaces.
 */
function resolvePlatformDir(config: LoadedConfig, platform: "notion" | "lark"): string {
  const tpl = config.config.sync?.pathTemplate ?? "${platform}";
  if (platform === "lark" && tpl !== "${platform}") {
    return path.join(config.root, tpl);
  }
  return path.join(config.root, platform);
}

export async function syncAll(
  syncer: PlatformSyncer,
  config: LoadedConfig,
  opts: { rootOverride?: string; dryRun?: boolean } = {},
): Promise<SyncResult> {
  const t0 = Date.now();
  const cloud = await syncer.listCloud({ config, rootOverride: opts.rootOverride });
  const local = await syncer.loadLocal({ config });

  const actions = diff({ cloud, local });

  const result: SyncResult = {
    scanned: cloud.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    durationMs: 0,
  };

  // Tracks allocator state across writes.
  const platformDir = resolvePlatformDir(config, syncer.platform);

  for (const action of actions) {
    try {
      if (action.kind === "skip") {
        result.skipped++;
        continue;
      }
      if (opts.dryRun) {
        if (action.kind === "create") result.created++;
        else if (action.kind === "update") result.updated++;
        continue;
      }
      if (action.kind === "create") {
        await syncer.writeNew(action.item, platformDir, config);
        result.created++;
      } else if (action.kind === "update") {
        const existing = local.get(action.item.uuid);
        if (!existing) {
          result.failed++;
          console.error(`  ✗ ${action.item.uuid}: local entry missing for update`);
          continue;
        }
        await syncer.writeUpdate(action.item, existing, config);
        result.updated++;
      }
    } catch (err) {
      result.failed++;
      console.error(
        `  ✗ ${action.kind === "skip" ? action.item.uuid : (action as any).item?.uuid ?? ""} (${action.kind}):`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  result.durationMs = Date.now() - t0;

  if (!opts.dryRun && result.failed === 0) {
    const finalized = syncer.finalize(config, new Date());
    fs.writeFileSync(config.configPath, (await import("yaml")).default.stringify(finalized.config));
  }

  return result;
}
