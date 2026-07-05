/**
 * Recursive walk honoring an ignore matcher.
 */
import * as fs from "fs";
import * as path from "path";
import type { IgnoreMatcher } from "../ignore/matcher.js";

export interface WalkEntry {
  absPath: string;
  relPath: string;
  isDir: boolean;
  isFile: boolean;
}

export interface WalkOptions {
  root: string;
  matcher: IgnoreMatcher;
  /** include only .md files in the leaf enumeration; directories still walked */
  mdOnly?: boolean;
}

export async function* walk(opts: WalkOptions): AsyncIterableIterator<WalkEntry> {
  const root = path.resolve(opts.root);
  yield* walkInner(root, root, opts);
}

async function* walkInner(
  root: string,
  dir: string,
  opts: WalkOptions,
): AsyncIterableIterator<WalkEntry> {
  if (opts.matcher.ignores(dir)) return;

  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  // Sort: directories last but both alphabetically (deterministic output)
  entries.sort((a, b) => {
    if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(root, abs);
    if (opts.matcher.ignores(abs)) continue;

    const isDir = entry.isDirectory();
    const isFile = entry.isFile();
    if (opts.mdOnly && isFile && !entry.name.endsWith(".md")) continue;

    yield { absPath: abs, relPath: rel, isDir, isFile };

    if (isDir) {
      yield* walkInner(root, abs, opts);
    }
  }
}
