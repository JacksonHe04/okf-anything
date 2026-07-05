/**
 * Filesystem path utilities shared across platforms.
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export function expandHome(p: string): string {
  if (!p) return p;
  if (p === "~") return os.homedir();
  if (p.startsWith("~/") || p.startsWith("~\\")) {
    return path.join(os.homedir(), p.slice(2));
  }
  return p;
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function parseFlagValue(argv: string[], flag: string): string | undefined {
  const idx = argv.indexOf(flag);
  if (idx === -1) return undefined;
  return argv[idx + 1];
}

export interface ResolvedPath {
  resolved: string;
  source: "flag" | "default";
  raw: string;
}

export interface ResolveDirOptions {
  argv: string[];
  flag?: string;
  defaultDir: string;
}

export function resolveDir(opts: ResolveDirOptions): ResolvedPath {
  const fromFlag = opts.flag ? parseFlagValue(opts.argv, opts.flag) : undefined;
  if (fromFlag) {
    const resolved = path.resolve(expandHome(fromFlag));
    ensureDir(resolved);
    return { resolved, source: "flag", raw: fromFlag };
  }
  const resolved = path.resolve(expandHome(opts.defaultDir));
  ensureDir(resolved);
  return { resolved, source: "default", raw: opts.defaultDir };
}
