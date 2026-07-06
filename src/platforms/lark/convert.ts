/**
 * Convert Lark shapes into OKF frontmatter.
 *
 * Field-name convention (post-2026-07 lark migration):
 *
 *   lark_id            <-- primary idempotency key (= node_token / minute token)
 *   lark_obj_token     <-- the underlying docx/sheet/file token
 *   lark_obj_type      <-- "docx" | "sheet" | "bitable" | "mindnote" | "file" | "minutes"
 *   lark_space_id      <-- wiki space id; null for minutes
 *   lark_parent_type   <-- "wiki" | "minutes" | "drive"
 *   lark_parent_id     <-- parent node_token; null for roots / minutes
 *   inon_id            <-- CLI-minted, populated by `writeFrontmatterBody`
 *
 * `tags: [Lark, lark/<space-name-slug>]` is preserved (existing 108
 * docs in ~/iNon/Wiki/lark rely on it).
 */
import type { WikiNode, MinuteItem } from "./client.js";

export type LarkOkfFields = Record<string, unknown> & {
  type: "Lark Document" | "Lark Minute";
  source: "lark";
  title: string;
  resource: string;
  timestamp: string;
  created_time: string;
  last_edited_time: string;
  lark_id: string;
  lark_obj_token: string;
  lark_obj_type: string;
  lark_space_id: string | null;
  lark_parent_type: string;
  lark_parent_id: string | null;
  tags: string[];
  /** Populated by `writeFrontmatterBody`; declared optional for typing. */
  inon_id?: string;
  /** Optional minutes-only fields. */
  lark_duration_ms?: string;
  lark_note_id?: string;
  lark_keywords?: string;
};

/** Build a Lark resource URL — best-effort; falls back to feishu.cn. */
export function buildLarkResourceUrl(args: {
  objType: string;
  objToken: string;
  nodeToken?: string;
}): string {
  // Wiki node URLs are the canonical "share" surface; obj_tokens are
  // the underlying doc, which is the same doc viewed differently.
  const t = args.nodeToken ?? args.objToken;
  const path = args.objType === "docx" ? "docx" : "wiki";
  return `https://feishu.cn/${path}/${t}`;
}

/**
 * A space-name slug for the `tags` array and on-disk directory.
 *
 * When a human-readable space name is available (from `+space-list`),
 * prefer a normalized form of it (e.g. "Season X: Escape Plan" →
 * "season-x-escape-plan"). Otherwise fall back to `lark-<id-prefix>`.
 *
 * This keeps the on-disk tree stable when the user has previously
 * named the directory themselves (existing docs under
 * `Wiki/lark/season-x-escape-plan/` etc.).
 */
export function spaceSlug(spaceId: string | null | undefined, spaceName?: string | null): string {
  if (spaceName) {
    return normalizeSlug(spaceName);
  }
  if (!spaceId) return "unscoped";
  return `lark-${spaceId.slice(0, 6)}`;
}

/**
 * Lower-case, kebab-cased slug from a free-form label. Spaces, dots,
 * colons and slashes are folded to "-"; CJK characters pass through
 * unmolested (the filesystem accepts them).
 */
function normalizeSlug(label: string): string {
  const cleaned = label
    .trim()
    .replace(/[\s·/\\:?*"<>|]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned.toLowerCase() || "unscoped";
}

/**
 * Build frontmatter for a wiki node (docx / sheet / bitable / ...).
 *
 * `meta` should be the full record from `+node-get` (or merged
 * `+node-list` + `+node-get`) so we can pick up edit timestamps.
 *
 * `spaceName` is best-effort; when provided, the on-disk dir +
 * `tags` entry use the human name instead of the space_id prefix,
 * matching how the 108 pre-existing files in ~/iNon/Wiki/lark
 * were originally named.
 */
export function buildWikiNodeFrontmatter(args: {
  node: WikiNode;
  url?: string;
  spaceName?: string | null;
}): LarkOkfFields {
  const n = args.node;
  const editTime = n.obj_edit_time ?? "";
  const createTime = n.obj_create_time ?? n.node_create_time ?? editTime;
  const slug = spaceSlug(n.space_id, args.spaceName);
  return {
    type: "Lark Document",
    source: "lark",
    title: n.title || "untitled",
    resource: args.url ?? buildLarkResourceUrl({
      objType: n.obj_type ?? "docx",
      objToken: n.obj_token ?? n.node_token,
      nodeToken: n.node_token,
    }),
    timestamp: unixToIso(editTime) || unixToIso(createTime),
    created_time: unixToIso(createTime),
    last_edited_time: unixToIso(editTime),
    lark_id: n.node_token,
    lark_obj_token: n.obj_token ?? n.node_token,
    lark_obj_type: n.obj_type ?? "docx",
    lark_space_id: n.space_id ?? null,
    lark_parent_type: "wiki",
    lark_parent_id: n.parent_node_token || null,
    tags: ["Lark", `lark/${slug}`],
  };
}

/**
 * Build frontmatter for a minute hit.
 *
 * We don't get `obj_edit_time` from `+search`; treat `display_info`
 * parsing as the only source of truth and fall back to the search
 * URL's token for `lark_id`.
 */
export function buildMinuteFrontmatter(args: {
  item: MinuteItem;
  resource: string;
}): LarkOkfFields {
  return {
    type: "Lark Minute",
    source: "lark",
    title: args.item.title || "untitled",
    resource: args.resource,
    timestamp: "", // unknown without `+detail`; intentionally blank
    created_time: "",
    last_edited_time: "",
    lark_id: args.item.token,
    lark_obj_token: args.item.token,
    lark_obj_type: "minutes",
    lark_space_id: null,
    lark_parent_type: "minutes",
    lark_parent_id: null,
    tags: ["Lark", "lark/minutes"],
  };
}

/** Convert unix-seconds string to RFC3339 UTC. Empty string → empty. */
export function unixToIso(unixSeconds: string | number | undefined): string {
  if (unixSeconds === undefined || unixSeconds === null || unixSeconds === "") return "";
  const sec = typeof unixSeconds === "string" ? Number(unixSeconds) : unixSeconds;
  if (!Number.isFinite(sec) || sec <= 0) return "";
  return new Date(sec * 1000).toISOString();
}

/** Extract the human title from `display_info` (first newline-delimited line). */
export function extractMinuteTitle(displayInfo: string): string {
  if (!displayInfo) return "untitled";
  const firstLine = displayInfo.split("\n")[0] ?? "";
  // Strip HTML entities lark-cli inserts (e.g. `<b>关键词:</b>`).
  const cleaned = firstLine
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
  return cleaned || "untitled";
}