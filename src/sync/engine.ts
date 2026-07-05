/**
 * okfe sync engine.
 *
 * Goals (per the 2026-07-05 rebrand decision #2 & #9):
 *   - UUID-anchored: each cloud doc has a stable UUID written into
 *     frontmatter; location in the local tree is irrelevant.
 *   - Time-anchored: cloud `last_edited_time` newer than local → update.
 *   - Destructive ops are NOT propagated: if a cloud doc is deleted, the
 *     local copy is left untouched.
 *
 * The engine streams metadata only (no body fetching) for the "diff"
 * phase, then performs body fetches + writes only for the set that
 * actually needs a write.
 */

export interface CloudItem {
  /** UUID used as idempotency key. */
  uuid: string;
  /** Cloud-side timestamp (ISO). */
  lastEditedTime: string;
  /** Title for logging + path allocator. */
  title: string;
  /** Resource URL. */
  url: string;
  /** Creation timestamp. */
  createdTime: string;
  /** Parent reference (cloud-side type + id). */
  parent: { type: string; id: string | null };
  /** Platform-specific extra (e.g. Notion properties). */
  extras?: Record<string, unknown>;
}

export type SyncAction =
  | { kind: "skip", reason: "local-newer-or-equal", item: CloudItem }
  | { kind: "create", item: CloudItem }
  | { kind: "update", item: CloudItem };

export interface DiffInputs {
  cloud: CloudItem[];
  /** Map of UUID → { path, last_edited_time }. */
  local: Map<string, LocalEntry>;
}

export interface LocalEntry {
  absPath: string;
  relPath: string;
  lastEditedTime?: string;
}

export function diff(inputs: DiffInputs): SyncAction[] {
  const out: SyncAction[] = [];

  for (const item of inputs.cloud) {
    const localEntry = inputs.local.get(item.uuid);
    const cloudMs = Date.parse(item.lastEditedTime);

    if (!localEntry) {
      out.push({ kind: "create", item });
      continue;
    }

    if (localEntry.lastEditedTime) {
      const localMs = Date.parse(localEntry.lastEditedTime);
      if (!Number.isNaN(localMs) && !Number.isNaN(cloudMs) && cloudMs <= localMs) {
        out.push({ kind: "skip", reason: "local-newer-or-equal", item });
        continue;
      }
    }

    out.push({ kind: "update", item });
  }

  return out;
}
