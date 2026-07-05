/**
 * gitignore-style ignore matcher.
 *
 * - Patterns follow the npm `ignore` package syntax (a superset of gitignore).
 * - Sources, in priority order (later ones appended):
 *     1. config.yaml `ignore:` list
 *     2. <root>/.okfeignore
 * - All paths are matched relative to `root` and forward-slashed.
 */
import * as fs from "fs";
import * as path from "path";
import * as ignoreModule from "ignore";
import type { Ignore } from "ignore";

/**
 * `ignore` package exposes both `ignore()` and a default export, depending
 * on the bundler. This helper handles both shapes.
 */
function makeIgnore(): Ignore {
  const mod = ignoreModule as unknown as {
    ignore?: () => Ignore;
    default?: () => Ignore;
  };
  if (typeof mod.ignore === "function") return mod.ignore();
  if (typeof mod.default === "function") return mod.default();
  throw new Error("ignore: module has no callable export");
}
import type { OkfEverythingConfig } from "../config/schema.js";

const OKFE_IGNORE_FILENAME = ".okfeignore";

export class IgnoreMatcher {
  private readonly ig: Ignore;
  private readonly root: string;

  constructor(root: string, rawPatterns: string[]) {
    this.root = path.resolve(root);
    this.ig = makeIgnore();
    for (const p of rawPatterns) this.ig.add(p);
  }

  /** True if `absPath` (a file or directory) should be ignored. */
  ignores(absPath: string): boolean {
    const rel = toPosix(path.relative(this.root, absPath));
    if (!rel || rel === ".") return false;
    if (rel.startsWith("..")) return false;
    if (this.ig.ignores(rel)) return true;
    // For directories, also test with trailing slash so patterns like
    // `node_modules/` match correctly.
    if (this.ig.ignores(rel + "/")) return true;
    return false;
  }

  /** Filter a list of paths. Filters out any descendant of an ignored ancestor. */
  filter<T extends { absPath: string; isDir: boolean }>(items: T[]): T[] {
    return items.filter((it) => {
      let cur = it.absPath;
      while (cur.startsWith(this.root)) {
        if (cur !== this.root && this.ignores(cur)) return false;
        const parent = path.dirname(cur);
        if (parent === cur) break;
        cur = parent;
      }
      return true;
    });
  }

  /** Build the matcher from a loaded okfe config (also reads .okfeignore). */
  static fromConfig(root: string, cfg: OkfEverythingConfig): IgnoreMatcher {
    const patterns: string[] = [...cfg.ignore];
    const dotIgnore = path.join(root, OKFE_IGNORE_FILENAME);
    if (fs.existsSync(dotIgnore)) {
      patterns.push(...readIgnoreFile(dotIgnore));
    }
    return new IgnoreMatcher(root, patterns);
  }
}

function readIgnoreFile(p: string): string[] {
  return fs
    .readFileSync(p, "utf8")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*#/, "").trim())
    .filter((line) => line.length > 0);
}

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}
