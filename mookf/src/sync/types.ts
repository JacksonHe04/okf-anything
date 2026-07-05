/**
 * Sync engine plugin contract: each platform implements this so the
 * generic dispatcher in `syncAll()` can drive it.
 */
import type { LoadedConfig } from "../config/loader.js";
import type { CloudItem, LocalEntry } from "./engine.js";

export interface SyncResult {
  scanned: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  durationMs: number;
}

export interface PlatformSyncer {
  readonly platform: "notion" | "lark";

  /** Read all cloud docs reachable from the configured root, metadata-only. */
  listCloud(args: { config: LoadedConfig; rootOverride?: string }): Promise<CloudItem[]>;

  /** Read local disk → map of UUID → local entry. Honors ignore matcher. */
  loadLocal(args: { config: LoadedConfig }): Promise<Map<string, LocalEntry>>;

  /** Fetch body + write a new local doc. */
  writeNew(item: CloudItem, targetDir: string, config: LoadedConfig): Promise<{ relPath: string }>;

  /** Fetch body + update an existing local doc in place. */
  writeUpdate(
    item: CloudItem,
    existing: LocalEntry,
    config: LoadedConfig,
  ): Promise<{ relPath: string }>;

  /** Reset the per-platform sync state (last_sync_time) after a successful run. */
  finalize(config: LoadedConfig, when: Date): LoadedConfig;
}
