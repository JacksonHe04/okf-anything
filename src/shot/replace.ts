/**
 * shot replace — batch in-place replacement across frontmatter fields
 * or markdown bodies.
 *
 * Bodies: substring / regex.
 * Frontmatter: by exact key (string / array).
 *
 * Dry-run by default; pass --apply to actually write.
 *
 * `inon_id` invariant: on any --apply write, every file ends up with an
 * `inon_id` in its frontmatter. Backfill is idempotent — existing
 * `inon_id` is preserved; missing values are minted via
 * `utils/id.ts`. Dry-run never writes, so it never mints.
 */
import * as fs from "fs";
import { iterMdFiles, type ShotFile } from "./walk.js";
import { ensureInonId, mintInonId } from "../utils/id.js";
import { parseFrontmatter, writeFrontmatterBody } from "../utils/frontmatter.js";
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
  const re = opts.regex ? new RegExp(opts.pattern, "g") : null;
  const rep: ReplaceReport = { modified: 0, inspected: 0, skipped: 0 };

  for await (const f of iterMdFiles(cfg)) {
    rep.inspected++;
    const raw = await fs.promises.readFile(f.absPath, "utf8");
    const { frontmatter: existingFm, body: parsedBody } = parseFrontmatter(raw);

    const bodyChanged = re
      ? parsedBody.replace(re, opts.replacement)
      : parsedBody.split(opts.pattern).join(opts.replacement);
    if (parsedBody === bodyChanged) {
      rep.skipped++;
      continue;
    }
    if (!apply) {
      rep.modified++;
      continue;
    }

    // Apply path. Pick the frontmatter to write:
    //   - existing → keep + ensureInonId (preserves any other fields)
    //   - none    → mint a minimal frontmatter so the file carries its
    //               `inon_id`. This is required by the workspace
    //               invariant ("every doc must have an inon_id").
    const fm: Record<string, unknown> = existingFm ?? { inon_id: mintInonId() };
    if (existingFm) ensureInonId(existingFm);
    const rebuilt = writeFrontmatterBody(fm, bodyChanged);
    await fs.promises.writeFile(f.absPath, rebuilt, "utf8");
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
    // Backfill `inon_id` (or preserve existing) before write.
    ensureInonId(f.frontmatter);

    const raw = await fs.promises.readFile(f.absPath, "utf8");
    const { body: parsedBody } = parseFrontmatter(raw);
    const rebuilt = writeFrontmatterBody(f.frontmatter, parsedBody);
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