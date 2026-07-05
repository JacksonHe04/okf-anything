/**
 * retrieve a page: 拿到 page 完整元数据
 * 注意: 响应不包含正文, 正文必须通过 block children 拉
 */
import type { Client } from "@notionhq/client";
import type { NotionLimiter } from "../../utils/limiter.js";

export interface PageMeta {
  id: string;
  title: string;
  url: string;
  createdTime: string;
  lastEditedTime: string;
  parentType: string;
  parentId: string | null;
  archived: boolean;
  inTrash: boolean;
  locked: boolean;
  icon: string | null;
  coverUrl: string | null;
  coverExpiry: string | null;
  properties: Record<string, unknown>;
}

export async function retrievePage(
  client: Client,
  limiter: NotionLimiter,
  pageId: string,
): Promise<PageMeta> {
  const page = (await limiter.run(
    () => client.pages.retrieve({ page_id: pageId }),
    `page:${pageId.slice(0, 8)}`,
  )) as unknown as Record<string, unknown>;

  const properties = (page.properties as Record<string, unknown>) ?? {};
  const title = extractTitle(properties);
  const parent = (page.parent as Record<string, unknown>) ?? {};
  const parentType = (parent.type as string) ?? "unknown";
  const parentId =
    parent.workspace === true
      ? null
      : ((parent.page_id as string) ??
          (parent.database_id as string) ??
          (parent.data_source_id as string) ??
          (parent.block_id as string) ??
          (parent.agent_id as string)) ??
        null;

  const icon = formatIcon(page.icon);
  const cover = formatCover(page.cover);

  return {
    id: page.id as string,
    title,
    url: (page.url as string) ?? "",
    createdTime: (page.created_time as string) ?? "",
    lastEditedTime: (page.last_edited_time as string) ?? "",
    parentType,
    parentId,
    archived: Boolean(page.is_archived ?? page.archived),
    inTrash: Boolean(page.in_trash),
    locked: Boolean(page.is_locked ?? page.locked),
    icon,
    coverUrl: cover?.url ?? null,
    coverExpiry: cover?.expiry ?? null,
    properties,
  };
}

function extractTitle(properties: Record<string, unknown>): string {
  for (const key of Object.keys(properties)) {
    const prop = properties[key] as Record<string, unknown> | undefined;
    if (prop?.type === "title") {
      const arr = prop.title as unknown[] | undefined;
      return richTextToPlain(arr);
    }
  }
  return "(untitled)";
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

function formatIcon(icon: unknown): string | null {
  if (!icon || typeof icon !== "object") return null;
  const i = icon as Record<string, unknown>;
  const type = i.type as string;
  if (type === "emoji") return (i.emoji as string) ?? null;
  if (type === "external") {
    const ext = i.external as Record<string, unknown> | undefined;
    return ext?.url ? `external:${ext.url}` : null;
  }
  if (type === "file") {
    const f = i.file as Record<string, unknown> | undefined;
    return f?.url ? `file:${f.url}` : null;
  }
  if (type === "icon") {
    const ic = i.icon as Record<string, unknown> | undefined;
    return ic?.name ? `icon:${ic.name}` : null;
  }
  if (type === "custom_emoji") {
    const ce = i.custom_emoji as Record<string, unknown> | undefined;
    return ce?.id ? `custom_emoji:${ce.id}` : null;
  }
  return null;
}

function formatCover(
  cover: unknown,
): { url: string; expiry: string | null } | null {
  if (!cover || typeof cover !== "object") return null;
  const c = cover as Record<string, unknown>;
  const type = c.type as string;
  if (type === "external") {
    const ext = c.external as Record<string, unknown> | undefined;
    return ext?.url ? { url: ext.url as string, expiry: null } : null;
  }
  if (type === "file") {
    const f = c.file as Record<string, unknown> | undefined;
    if (!f?.url) return null;
    return {
      url: f.url as string,
      expiry: (f.expiry_time as string) ?? null,
    };
  }
  return null;
}