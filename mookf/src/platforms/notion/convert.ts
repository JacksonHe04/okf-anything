/**
 * Convert Notion API shapes into OKF frontmatter + markdown body
 * suitable for the local wiki.
 *
 * Field mapping (decision #10):
 *   - All "core" Notion fields are written with semantic English keys so
 *     shot / find can grep across files easily.
 *   - Page properties (other than `title`) are flattened into
 *     `notion.properties` to avoid name collisions.
 */
import YAML from "yaml";

export interface NotionOkfFields {
  type: "Notion Page" | "Notion Database";
  title: string;
  resource: string;
  timestamp: string;
  notion_id: string;
  created_time: string;
  last_edited_time: string;
  notion_parent_type: string;
  notion_parent_id: string | null;
  properties?: Record<string, unknown>;
}

export function buildNotionPageFrontmatter(args: {
  id: string;
  title: string;
  url: string;
  createdTime: string;
  lastEditedTime: string;
  parentType: string;
  parentId: string | null;
  properties: Record<string, unknown>;
}): NotionOkfFields {
  const fm: NotionOkfFields = {
    type: "Notion Page",
    title: args.title || "untitled",
    resource: args.url,
    timestamp: args.lastEditedTime,
    notion_id: args.id,
    created_time: args.createdTime,
    last_edited_time: args.lastEditedTime,
    notion_parent_type: args.parentType,
    notion_parent_id: args.parentId,
  };
  const flat = flattenProperties(args.properties);
  if (Object.keys(flat).length > 0) fm.properties = flat;
  return fm;
}

export function buildNotionDatabaseFrontmatter(args: {
  id: string;
  title: string;
  url: string;
  createdTime: string;
  lastEditedTime: string;
  parentType: string;
  parentId: string | null;
}): NotionOkfFields {
  return {
    type: "Notion Database",
    title: args.title || "untitled",
    resource: args.url,
    timestamp: args.lastEditedTime,
    notion_id: args.id,
    created_time: args.createdTime,
    last_edited_time: args.lastEditedTime,
    notion_parent_type: args.parentType,
    notion_parent_id: args.parentId,
  };
}

/** Notion's `properties` is rich and typed; flatten to key → primitive. */
export function flattenProperties(
  properties: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, prop] of Object.entries(properties)) {
    if (!prop || typeof prop !== "object") continue;
    const p = prop as Record<string, unknown>;
    if (p.type === "title") continue;
    let val: unknown = null;
    switch (p.type) {
      case "checkbox":
        val = p.checkbox;
        break;
      case "number":
        val = p.number;
        break;
      case "select":
        val = (p.select as Record<string, unknown> | undefined)?.name ?? null;
        break;
      case "multi_select":
        val = Array.isArray(p.multi_select)
          ? (p.multi_select as unknown[]).map((s: any) => s?.name).filter(Boolean)
          : [];
        break;
      case "status":
        val = (p.status as Record<string, unknown> | undefined)?.name ?? null;
        break;
      case "date":
        if (p.date) {
          const d = p.date as Record<string, unknown>;
          val = d.end ? `${d.start} ~ ${d.end}` : d.start ?? null;
        }
        break;
      case "rich_text":
        val = Array.isArray(p.rich_text)
          ? (p.rich_text as unknown[])
              .map((r: any) => r?.plain_text ?? "")
              .join("")
          : "";
        break;
      case "url":
        val = p.url;
        break;
      case "email":
        val = p.email;
        break;
      case "phone_number":
        val = p.phone_number;
        break;
      case "people":
        val = Array.isArray(p.people)
          ? (p.people as unknown[]).map((pe: any) => pe?.name || pe?.id)
          : [];
        break;
      case "relation":
        val = Array.isArray(p.relation)
          ? (p.relation as unknown[]).map((r: any) => r?.id)
          : [];
        break;
      case "files":
        val = Array.isArray(p.files)
          ? (p.files as unknown[]).map(
              (f: any) => f?.name || f?.file?.url || f?.external?.url,
            )
          : [];
        break;
      case "formula": {
        const f = p.formula as Record<string, unknown> | undefined;
        if (f) val = f.string ?? f.number ?? f.boolean ?? f.date ?? null;
        break;
      }
      default:
        break;
    }
    if (val === null || val === undefined || val === "") continue;
    if (Array.isArray(val) && val.length === 0) continue;
    out[key] = val;
  }
  return out;
}

/** Parse a UUID out of free text (Notion URL, compact form, dashed form). */
export function extractUuid(input: string): string {
  const s = input.trim();
  const compact = s.replace(/-/g, "");
  if (/^[0-9a-fA-F]{32}$/.test(compact)) {
    return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
  }
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s)) {
    return s;
  }
  throw new Error(`Cannot extract UUID from: ${input}`);
}

export function frontmatterToYaml(fm: NotionOkfFields): string {
  return YAML.stringify(fm).trimEnd();
}
