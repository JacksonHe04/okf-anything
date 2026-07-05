/**
 * File mtime / birthtime helpers for local (non-cloud) documents.
 *
 * OKF distinguishes `created_time` (when the file first appeared on
 * disk) from `last_edited_time` (last modification). For cloud-synced
 * docs the source-of-truth is the cloud; for local files we have to
 * ask the filesystem.
 *
 * macOS APFS does not preserve a reliable birthtime separate from
 * mtime in many cases — `stat.birthtime` is often identical to
 * `mtime`. Linux ext4 has `birthtime`; tmpfs / many network FSes do
 * not. We resolve the ambiguity by:
 *   - last_edited_time = mtime (always reliable)
 *   - created_time     = birthtime when it differs from mtime;
 *                        otherwise fall back to mtime (the only
 *                        signal we have).
 *
 * The helper returns ISO-8601 strings, matching what Notion / Lark
 * syncers emit and what frontmatter stores.
 */
import { promises as fs } from "fs";

export interface FileTimes {
  /** ISO timestamp; birthtime when available, else mtime. */
  created_time: string;
  /** ISO timestamp; always mtime. */
  last_edited_time: string;
}

export async function getFileTimes(absPath: string): Promise<FileTimes> {
  const st = await fs.stat(absPath);
  const mtimeMs = st.mtimeMs;
  const birthMs = st.birthtimeMs;

  // birthtime is "unreliable" if it equals mtime — that's the APFS
  // default for newly-created files where no other signal is kept.
  // Use mtime as the floor in that case; the document is still treated
  // as freshly created at last-edit time, which is the only truth
  // available.
  const createdMs =
    Number.isFinite(birthMs) && birthMs > 0 && birthMs !== mtimeMs
      ? birthMs
      : mtimeMs;

  return {
    created_time: new Date(createdMs).toISOString(),
    last_edited_time: new Date(mtimeMs).toISOString(),
  };
}