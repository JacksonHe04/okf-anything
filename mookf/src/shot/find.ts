/**
 * shot find — exact-match frontmatter field lookup.
 *
 * Example:
 *   mookf shot find --field status --value active
 *   mookf shot find notion_id --eq <uuid>
 *   mookf shot find tag  # existence-only
 */
import type { LoadedConfig } from "../config/loader.js";
import { readAllMd, type ShotFile } from "./walk.js";

export interface FindQuery {
  field: string;
  value?: string;
  /** When true, treat `value` as a substring match. */
  contains?: boolean;
  /** When true, treat `value` as a regex. */
  regex?: boolean;
}

export interface FindResult {
  relPath: string;
  absPath: string;
  matchedField: string;
  matchedValue: unknown;
}

export async function find(
  cfg: LoadedConfig,
  query: FindQuery,
): Promise<FindResult[]> {
  const results: FindResult[] = [];
  const files = await readAllMd(cfg);
  for (const f of files) {
    if (!f.frontmatter) continue;
    const v = f.frontmatter[query.field];
    if (v === undefined || v === null) continue;
    if (query.value === undefined) {
      results.push({
        relPath: f.relPath,
        absPath: f.absPath,
        matchedField: query.field,
        matchedValue: v,
      });
      continue;
    }
    if (matches(v, query.value, query)) {
      results.push({
        relPath: f.relPath,
        absPath: f.absPath,
        matchedField: query.field,
        matchedValue: v,
      });
    }
  }
  return results;
}

function matches(haystack: unknown, needle: string, q: FindQuery): boolean {
  let hayStr: string;
  if (Array.isArray(haystack)) {
    return haystack.some((item) => matches(item, needle, q));
  } else if (typeof haystack === "object") {
    hayStr = JSON.stringify(haystack);
  } else {
    hayStr = String(haystack);
  }
  if (q.regex) {
    try {
      return new RegExp(needle, "i").test(hayStr);
    } catch {
      return false;
    }
  }
  if (q.contains) {
    return hayStr.toLowerCase().includes(needle.toLowerCase());
  }
  return hayStr === needle;
}
