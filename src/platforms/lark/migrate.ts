/**
 * One-shot frontmatter migrator for Lark docs.
 *
 * Pre-2026-07 Lark docs in ~/iNon/Wiki/lark used:
 *   lark_node_token        <-- primary idempotency key
 *   lark_parent_node_token <-- parent reference
 *
 * After the v1 lark-syncer ships we standardize on:
 *   lark_id          (= lark_node_token)
 *   lark_parent_id   (= lark_parent_node_token)
 *   lark_parent_type (= "wiki"  | "minutes" | "drive"; back-fill "wiki")
 *
 * Behavior:
 *   - Idempotent: docs already carrying `lark_id` are skipped.
 *   - Preserves every other key (lark_obj_token, lark_obj_type,
 *     lark_space_id, tags, inon_id, etc.).
 *   - Back-fills missing OKF-required fields (`last_edited_time`,
 *     `created_time`, `timestamp`, `author`, `source`, `resource`)
 *     with empty / placeholder values so the migrated file still
 *     passes `ensureOkfShape` invariants.
 *   - `apply=false` returns the rewritten content without touching
 *     disk; the caller is responsible for logging / writing.
 */
import { parseFrontmatter } from "../../utils/frontmatter.js";
import YAML from "yaml";

export interface MigrateResult {
  /** Absolute path of the inspected file. */
  absPath: string;
  /** True if the file already had `lark_id` (no work needed). */
  skipped: boolean;
  /** True if the rewrite happened (i.e. legacy fields were present). */
  changed: boolean;
  /** New content (when `changed=true` and `apply=true`). */
  newContent?: string;
}

export function migrateLarkFileContent(
  absPath: string,
  content: string,
  opts: { apply: boolean },
): MigrateResult {
  const { frontmatter } = parseFrontmatter(content);
  if (!frontmatter || typeof frontmatter !== "object") {
    return { absPath, skipped: true, changed: false };
  }

  const fm = frontmatter as Record<string, unknown>;

  // Two reasons we'd skip:
  //   1. Already has `lark_id` (migrated) AND all OKF-required fields
  //      present (no work to do).
  //   2. Has neither `lark_id` nor `lark_node_token` (not a Lark doc).
  const hasNewId = typeof fm.lark_id === "string" && fm.lark_id.length > 0;
  const hasLegacy = typeof fm.lark_node_token === "string" && (fm.lark_node_token as string).length > 0;
  if (hasNewId && isOkfComplete(fm)) {
    return { absPath, skipped: true, changed: false };
  }
  if (!hasNewId && !hasLegacy) {
    return { absPath, skipped: true, changed: false };
  }

  // Build the rewritten frontmatter.
  const next: Record<string, unknown> = { ...fm };
  if (hasLegacy) {
    next.lark_id = fm.lark_node_token;
    if (typeof fm.lark_parent_node_token === "string" && fm.lark_parent_node_token) {
      next.lark_parent_id = fm.lark_parent_node_token;
    }
    delete next.lark_node_token;
    delete next.lark_parent_node_token;
  }
  // Always back-fill parent type; "wiki" is the v1 surface.
  next.lark_parent_type = "wiki";

  // Back-fill OKF-required fields the pre-migration file may lack.
  // We don't have the timestamps locally, so leave them empty —
  // the syncer's next run will populate them via `+node-get`.
  if (typeof next.source !== "string") next.source = "lark";
  if (typeof next.type !== "string") next.type = "Lark Document";
  if (typeof next.timestamp !== "string") next.timestamp = "";
  if (typeof next.created_time !== "string") next.created_time = "";
  if (typeof next.last_edited_time !== "string") next.last_edited_time = "";
  if (typeof next.author !== "string") next.author = "";
  if (typeof next.resource !== "string") next.resource = "";

  if (!opts.apply) {
    return { absPath, skipped: false, changed: true };
  }

  // Re-serialize: parse the original to find the body offset, then
  // splice the rewritten YAML frontmatter back in.
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    return { absPath, skipped: true, changed: false };
  }
  const body = content.slice(fmMatch[0].length).replace(/^\s*\n/, "");
  const fmYaml = YAML.stringify(next).trimEnd();
  const newContent = `---\n${fmYaml}\n---\n${body.startsWith("\n") ? body : "\n" + body}`;
  return { absPath, skipped: false, changed: true, newContent };
}

/** All OKF-required fields the syncer relies on are present and non-empty. */
function isOkfComplete(fm: Record<string, unknown>): boolean {
  return (
    typeof fm.source === "string" &&
    typeof fm.type === "string" &&
    typeof fm.last_edited_time === "string" &&
    typeof fm.created_time === "string" &&
    typeof fm.author === "string" &&
    typeof fm.resource === "string"
  );
}