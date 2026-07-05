/**
 * shot walk — single-pass walk over the workspace, honoring ignore rules
 * and yielding per-file results. Streams, so it scales to huge trees.
 */
import * as fs from "fs";
import * as path from "path";
import YAML from "yaml";
import { walk, type WalkEntry } from "../utils/walk.js";
import { IgnoreMatcher } from "../ignore/matcher.js";
import type { LoadedConfig } from "../config/loader.js";

export interface ShotFile {
  absPath: string;
  relPath: string;
  frontmatter: Record<string, unknown> | null;
}

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---/;

function parseFrontmatterLite(
  content: string,
): { frontmatter: Record<string, unknown> | null } {
  const m = content.match(FRONTMATTER_RE);
  if (!m) return { frontmatter: null };
  try {
    const parsed = YAML.parse(m[1]);
    return { frontmatter: parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null };
  } catch {
    return { frontmatter: null };
  }
}

export async function* iterMdFiles(
  cfg: LoadedConfig,
): AsyncIterableIterator<ShotFile> {
  const matcher = IgnoreMatcher.fromConfig(cfg.root, cfg.config);
  for await (const entry of walk({ root: cfg.root, matcher, mdOnly: true })) {
    if (!entry.isFile) continue;
    try {
      const raw = await fs.promises.readFile(entry.absPath, "utf8");
      const { frontmatter } = parseFrontmatterLite(raw);
      yield {
        absPath: entry.absPath,
        relPath: entry.relPath,
        frontmatter,
      };
    } catch {
      // ignore unreadable
    }
  }
}

export async function readAllMd(cfg: LoadedConfig): Promise<ShotFile[]> {
  const out: ShotFile[] = [];
  for await (const f of iterMdFiles(cfg)) out.push(f);
  return out;
}

export type { WalkEntry };
export { path };
