/**
 * Lark Open Platform API wrapper for docs / wiki.
 *
 * Lark's docs surface lives under multiple sub-APIs (docx, wiki, sheet, ...).
 * okf-anything v1 keeps the surface narrow: pull docs & wiki nodes referenced by id,
 * with `last_edited_time`-anchored incremental sync.
 *
 * Auth: tenant_access_token obtained via app_id + app_secret.
 */
export interface LarkContext {
  baseUrl: string;
  appId: string;
  appSecret: string;
}

export interface LarkDoc {
  /** Lark object token = our UUID anchor. */
  token: string;
  title: string;
  url: string;
  createdTime: string;
  lastEditedTime: string;
  parentType: string;
  parentId: string | null;
  /** Lark raw payload (kept opaque for future fields). */
  raw: Record<string, unknown>;
}
