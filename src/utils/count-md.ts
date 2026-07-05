/**
 * Recursively count .md files under `root`.
 */
import * as fs from "fs";
import * as path from "path";

export function countMdFiles(root: string): number {
  let count = 0;
  walk(root);
  return count;

  function walk(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile() && e.name.endsWith(".md")) count++;
    }
  }
}
