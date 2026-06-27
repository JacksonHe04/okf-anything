/**
 * 递归统计目录下 .md 文件数量
 */
import * as fs from "fs";
import * as path from "path";

export function countMdFiles(root: string): number {
  let count = 0;
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
  walk(root);
  return count;
}