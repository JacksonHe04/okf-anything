/**
 * OKF frontmatter shape contract.
 *
 * Every `.md` in the workspace that the CLI has written or normalized
 * MUST carry the full required field set below. The set is
 * source-agnostic — every key is meaningful regardless of whether the
 * document originated as a Notion page, a Lark doc, or a hand-written
 * file in the workspace.
 *
 * Source-specific extras (`notion_id`, `lark_id`, `properties`, …) live
 * alongside the required set when present; they are not part of the
 * OKF core invariant.
 */
import { ensureInonId } from "./id.js";

/**
 * `type` discriminates the document's intended shape inside the OKF
 * workspace. Three manual slots + the cloud platform slots:
 *
 *   - "Handwriting" : a free-form prose / personal note authored in
 *                     the workspace directly.
 *   - "Dev"         : a developer-facing artifact (README, design
 *                     doc, ADRs, …). Used for files inside a code
 *                     repo or any technical reference.
 *   - "Notion Page" / "Notion Database" : produced by the Notion
 *                                          syncer; carries notion_id.
 *   - "Lark Document"                    : produced by the Lark
 *                                          syncer; carries lark_id.
 */
export type OkfType =
  | "Handwriting"
  | "Dev"
  | "Notion Page"
  | "Notion Database"
  | "Lark Document";

/** Where the document's authoritative content lives. */
export type OkfSource = "local" | "notion" | "lark";

/**
 * Required frontmatter keys. The CLI guarantees every one of these is
 * present on every file it touches.
 */
export const REQUIRED_OKF_FIELDS = [
  "type",
  "source",
  "title",
  "created_time",
  "last_edited_time",
  "resource",
  "author",
  "inon_id",
] as const;

export type RequiredOkfField = (typeof REQUIRED_OKF_FIELDS)[number];

/**
 * Detect the author for a local document. Try:
 *   1. git config user.name (most accurate for repo-resident files)
 *   2. process.env.OKFA_AUTHOR override
 *   3. process.env.USER / USERNAME (POSIX / Windows fallback)
 *   4. "unknown" (so we never write null/undefined)
 *
 * Synchronous because we want this callable from inside tight
 * frontmatter-write loops without blocking on fs.
 */
export function resolveAuthor(): string {
  // Lazy import: child_process.execSync is only needed here.
  // We deliberately do NOT throw on failure — fall through.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execSync } = require("child_process") as typeof import("child_process");
    const out = execSync("git config --get user.name", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (out) return out;
  } catch {
    // not a git repo, or no user.name set — fall through
  }
  if (process.env.OKFA_AUTHOR && process.env.OKFA_AUTHOR.trim()) {
    return process.env.OKFA_AUTHOR.trim();
  }
  if (process.env.USER && process.env.USER.trim()) return process.env.USER.trim();
  if (process.env.USERNAME && process.env.USERNAME.trim())
    return process.env.USERNAME.trim();
  return "unknown";
}

/**
 * Given a partial / non-conformant frontmatter object, fill in every
 * missing required field. Mutates and returns the same object.
 *
 * Caller supplies:
 *   - `defaults` for fields that cannot be inferred from the
 *     frontmatter alone (notably `created_time` / `last_edited_time`
 *     which need filesystem stat, and `author` which the helper
 *     above resolves).
 *   - Optional `forceType` / `forceSource` to override existing values
 *     when the caller knows better (e.g. `okfa new --type Dev`).
 *
 * Behavior:
 *   - Existing valid values are preserved (never overwritten).
 *   - Missing fields are filled with defaults when provided, else
 *     sentinel values:
 *       - `type`        → "Handwriting"
 *       - `source`      → "local"
 *       - `title`       → ""  (caller is responsible for setting this
 *                              from filename; we refuse to invent)
 *       - `created_time` / `last_edited_time` → ""
 *       - `resource`    → ""  (caller sets relative path for local;
 *                              URL for cloud)
 *       - `author`      → resolveAuthor()
 *
 * `inon_id` is always ensured last so the chokepoint's
 * `ensureInonId` call is the single source of mint.
 */
export interface OkfShapeDefaults {
  type?: OkfType;
  source?: OkfSource;
  title?: string;
  created_time?: string;
  last_edited_time?: string;
  resource?: string;
  author?: string;
}

export function ensureOkfShape(
  fm: Record<string, unknown>,
  defaults: OkfShapeDefaults = {},
): Record<string, unknown> {
  if (typeof fm.type !== "string" || fm.type === "") {
    fm.type = defaults.type ?? "Handwriting";
  }
  if (typeof fm.source !== "string" || fm.source === "") {
    fm.source = defaults.source ?? "local";
  }
  if (typeof fm.title !== "string") {
    fm.title = defaults.title ?? "";
  }
  if (typeof fm.created_time !== "string" || fm.created_time === "") {
    fm.created_time = defaults.created_time ?? "";
  }
  if (typeof fm.last_edited_time !== "string" || fm.last_edited_time === "") {
    fm.last_edited_time = defaults.last_edited_time ?? "";
  }
  if (typeof fm.resource !== "string") {
    fm.resource = defaults.resource ?? "";
  }
  if (typeof fm.author !== "string" || fm.author === "") {
    fm.author = defaults.author ?? resolveAuthor();
  }
  // inon_id last — let ensureInonId's idempotent semantics do its job.
  ensureInonId(fm);
  return fm;
}