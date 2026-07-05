/**
 * shot replace — batch in-place replacement across frontmatter fields
 * or markdown bodies.
 *
 * Bodies: substring / regex.
 * Frontmatter: by exact key (string / array).
 *
 * Dry-run by default; pass --apply to actually write.
 */
import * as fs from "fs";
import YAML from "yaml";
import { iterMdFiles, type ShotFile } from "./walk.js";
import type { LoadedConfig } from "../config/loader.js";

export interface ReplaceBodyOptions {
  pattern: string;
  replacement: string;
  regex?: boolean;
}

export interface ReplaceFrontmatterOptions {
  field: string;
  fromValue?: string;
  toValue: string;
  /** If true, replace each occurrence inside the string value. */
  inString?: boolean;
  /** If set, only files whose `field` matches this value are touched. */
  match?: string;
}

export interface ReplaceReport {
  modified: number;
  inspected: number;
  skipped: number;
}

export async function replaceBody(
  cfg: LoadedConfig,
  opts: ReplaceBodyOptions,
  apply: boolean,
): Promise<ReplaceReport> {
  const re = opts.regex
    ? new RegExp(opts.pattern, "g")
    : null;
  const rep: ReplaceReport = { modified: 0, inspected: 0, skipped: 0 };

  for await (const f of iterMdFiles(cfg)) {
    rep.inspected++;
    const raw = await fs.promises.readFile(f.absPath, "utf8");
    const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\n?/);
    let body = fmMatch ? raw.slice(fmMatch[0].length) : raw;
    const bodyChanged = re
      ? body.replace(re, opts.replacement)
      : body.split(opts.pattern).join(opts.replacement);
    if (body === bodyChanged) {
      rep.skipped++;
      continue;
    }
    if (!apply) {
      rep.modified++;
      continue;
    }
    const fm = fmMatch ? raw.slice(fmMatch[0].length - (fmMatch[0].endsWith("\n") ? 1 : 0), fmMatch[0].length - (fmMatch[0].endsWith("\n") ? 0 : 0)) : "";
    const patched = (fmMatch ? fmMatch[0] : "") + (bodyChanged.startsWith("\n") ? bodyChanged.slice(1) : "\n" + bodyChanged);
    await fs.promises.writeFile(f.absPath, patched, "utf8");
    rep.modified++;
  }
  return rep;
}

export async function replaceFrontmatter(
  cfg: LoadedConfig,
  opts: ReplaceFrontmatterOptions,
  apply: boolean,
): Promise<ReplaceReport> {
  const rep: ReplaceReport = { modified: 0, inspected: 0, skipped: 0 };

  for await (const f of iterMdFiles(cfg)) {
    rep.inspected++;
    if (!f.frontmatter) continue;
    const cur = f.frontmatter[opts.field];
    if (cur === undefined) continue;
    if (opts.match !== undefined) {
      if (Array.isArray(cur)) {
        if (!cur.includes(opts.match)) continue;
      } else if (String(cur) !== opts.match) {
        continue;
      }
    }

    let next: unknown;
    if (Array.isArray(cur)) {
      next = cur.map((v) => transform(v, opts));
    } else {
      next = transform(cur, opts);
    }
    if (JSON.stringify(next) === JSON.stringify(cur)) {
      rep.skipped++;
      continue;
    }
    if (!apply) {
      rep.modified++;
      continue;
    }
    f.frontmatter[opts.field] = next;
    const raw = await fs.promises.readFile(f.absPath, "utf8");
    const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---/);
    const newFm = YAML.stringify(f.frontmatter).trimEnd();
    let rebuilt: string;
    if (fmMatch) {
      rebuilt = `---\n${newFm}\n---\n` + raw.slice(fmMatch[0].length);
    } else {
      rebuilt = `---\n${newFm}\n---\n` + raw;
    }
    await fs.promises.writeFile(f.absPath, rebuilt, "utf8");
    rep.modified++;
  }
  return rep;
}

function transform(v: unknown, opts: ReplaceFrontmatterOptions): unknown {
  if (typeof v === "string") {
    if (opts.inString) return v.split(opts.fromValue ?? "").join(opts.toValue);
    return opts.toValue;
  }
  return v;
}
