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

  /**
   * When `true`, the dispatcher treats every cloud item as newer than
   * the local copy and forces an `update` action — every doc gets
   * re-written every run. Use for platforms where (a) the local copy
   * is always considered canonical-ish and we just want to refresh
   * metadata / re-pull body when convenient, or (b) the cloud
   * `last_edited_time` is unreliable enough that timestamp diffing
   * produces excessive false-skip results.
   *
   * Lark opts in by default: every sync round re-emits the full
   * frontmatter + body so the on-disk file is always in lockstep
   * with what the CLI produces, at the cost of more lark-cli calls
   * per run. Notion does NOT opt in — its timestamps are reliable
   * enough to make incremental diffs worthwhile.
   */
  readonly fullResync?: boolean;

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
