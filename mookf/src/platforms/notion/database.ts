/**
 * database / data_source 操作:
 * - list all data_sources via search
 * - retrieve data_source schema
 * - query rows (page 形态)
 */
import type { Client } from "@notionhq/client";
import type { NotionLimiter } from "../../utils/limiter.js";

export interface DatabaseMeta {
  id: string; // data_source id
  databaseId: string; // 外层 database container id (新模型下与 id 相同)
  title: string;
  description: string;
  url: string;
  createdTime: string;
  lastEditedTime: string;
  parentType: string;
  parentId: string | null;
  archived: boolean;
  schema: Record<string, unknown>;
}

export async function retrieveDataSource(
  client: Client,
  limiter: NotionLimiter,
  dataSourceId: string,
): Promise<DatabaseMeta> {
  const ds = (await limiter.run(
    () => client.dataSources.retrieve({ data_source_id: dataSourceId }),
    `ds:${dataSourceId.slice(0, 8)}`,
  )) as unknown as Record<string, unknown>;

  const title = richTextToPlain(ds.title);
  const description = richTextToPlain(ds.description);
  const parent = (ds.parent as Record<string, unknown>) ?? {};
  const databaseParent =
    (ds.database_parent as Record<string, unknown>) ?? {};
  const effectiveParent = Object.keys(databaseParent).length
    ? databaseParent
    : parent;

  const parentType = (effectiveParent.type as string) ?? "unknown";
  const parentId =
    effectiveParent.workspace === true
      ? null
      : ((effectiveParent.page_id as string) ??
          (effectiveParent.database_id as string) ??
          (effectiveParent.block_id as string) ??
          (effectiveParent.agent_id as string)) ??
        null;

  const outerDbId = (parent.database_id as string) ?? (ds.id as string);

  return {
    id: ds.id as string,
    databaseId: outerDbId,
    title: title || "(untitled)",
    description,
    url: (ds.url as string) ?? "",
    createdTime: (ds.created_time as string) ?? "",
    lastEditedTime: (ds.last_edited_time as string) ?? "",
    parentType,
    parentId,
    archived: Boolean(ds.archived ?? ds.is_archived),
    schema: (ds.properties as Record<string, unknown>) ?? {},
  };
}

export interface RowHit {
  id: string;
  lastEditedTime: string;
  archived: boolean;
}

export async function queryAllRows(
  client: Client,
  limiter: NotionLimiter,
  dataSourceId: string,
): Promise<RowHit[]> {
  const results: RowHit[] = [];
  let cursor: string | undefined;

  while (true) {
    const res = (await limiter.run(
      () =>
        client.dataSources.query({
          data_source_id: dataSourceId,
          page_size: 100,
          start_cursor: cursor,
        }),
      `query:${dataSourceId.slice(0, 8)}`,
    )) as unknown as { results: unknown[]; has_more: boolean; next_cursor: string | null };
    for (const r of res.results) {
      if (!r || typeof r !== "object") continue;
      const row = r as Record<string, unknown>;
      results.push({
        id: row.id as string,
        lastEditedTime: (row.last_edited_time as string) ?? "",
        archived: Boolean(row.archived ?? row.in_trash),
      });
    }
    if (!res.has_more || !res.next_cursor) break;
    cursor = res.next_cursor;
  }
  return results;
}

function richTextToPlain(arr: unknown): string {
  if (!Array.isArray(arr)) return "";
  return arr
    .map((seg) => {
      if (seg && typeof seg === "object") {
        const s = seg as Record<string, unknown>;
        if (typeof s.plain_text === "string") return s.plain_text;
        const t = s.text as Record<string, unknown> | undefined;
        if (t && typeof t.content === "string") return t.content;
      }
      return "";
    })
    .join("");
}