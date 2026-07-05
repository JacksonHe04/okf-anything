/**
 * search API: 列出所有 shared with integration 的 page / data_source
 *
 * 注意: 不传 query = 返回所有可见对象; 传 filter: {property: "object", value: "page" | "data_source"}
 */
import type { Client } from "@notionhq/client";
import type { NotionLimiter } from "../../utils/limiter.js";

export interface SearchHit {
  id: string;
  object: "page" | "data_source" | "database";
  title: string;
  url: string;
  lastEditedTime: string;
  parentType: string;
  parentId: string | null;
  archived: boolean;
}

export async function searchAll(
  client: Client,
  limiter: NotionLimiter,
  object: "page" | "data_source",
): Promise<SearchHit[]> {
  const results: SearchHit[] = [];
  let cursor: string | undefined;

  while (true) {
    const res = await limiter.run(
      () =>
        client.search({
          filter: { property: "object", value: object },
          page_size: 100,
          start_cursor: cursor,
        }),
      `search:${object}`,
    );
    for (const r of res.results as unknown as Array<Record<string, unknown>>) {
      const hit = parseSearchHit(r);
      if (hit) results.push(hit);
    }
    if (!res.has_more || !res.next_cursor) break;
    cursor = res.next_cursor;
    if (res.request_status?.type === "incomplete") {
      console.warn(
        `  ⚠ search(${object}) incomplete: ${res.request_status.incomplete_reason}`,
      );
    }
  }
  return results;
}

function parseSearchHit(raw: unknown): SearchHit | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const object = r.object as string;
  const id = r.id as string;
  if (!id) return null;

  const url = (r.url as string) ?? "";
  const lastEditedTime =
    (r.last_edited_time as string) ?? new Date(0).toISOString();
  const archived = (r.archived as boolean) ?? false;

  const parent = (r.parent as Record<string, unknown>) ?? {};
  const parentType = (parent.type as string) ?? "unknown";
  const parentId =
    (parent.workspace === true
      ? null
      : (parent.page_id as string) ??
        (parent.database_id as string) ??
        (parent.data_source_id as string) ??
        (parent.block_id as string) ??
        (parent.agent_id as string)) ?? null;

  let title = "(untitled)";
  if (object === "page") {
    title = extractPageTitle(r.properties);
  } else if (object === "data_source" || object === "database") {
    title = extractRichTextPlain(r.title) || "(untitled)";
  }

  return {
    id,
    object: object as SearchHit["object"],
    title,
    url,
    lastEditedTime,
    parentType,
    parentId,
    archived,
  };
}

function extractPageTitle(properties: unknown): string {
  if (!properties || typeof properties !== "object") return "(untitled)";
  const map = properties as Record<string, Record<string, unknown>>;
  for (const key of Object.keys(map)) {
    const prop = map[key];
    if (prop && prop.type === "title") {
      const arr = prop.title as unknown[] | undefined;
      const text = extractRichTextPlain(arr);
      if (text) return text;
    }
  }
  return "(untitled)";
}

function extractRichTextPlain(arr: unknown): string {
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