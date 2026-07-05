/**
 * shot search — full-text grep across .md bodies.
 *
 * For very large workspaces this delegates to the system `rg` / `grep`
 * binary when available (much faster), falling back to a streaming
 * in-process scan otherwise.
 */
import { spawn } from "child_process";
import { IgnoreMatcher } from "../ignore/matcher.js";
import type { LoadedConfig } from "../config/loader.js";
import { iterMdFiles, type ShotFile } from "./walk.js";

export interface SearchOptions {
  query: string;
  caseInsensitive?: boolean;
  regex?: boolean;
  /** Only print file paths, not matched lines. */
  filesOnly?: boolean;
  /** Limit results. */
  limit?: number;
}

export interface SearchHit {
  relPath: string;
  absPath: string;
  /** line number (1-based), when available */
  line?: number;
  /** matched line content */
  text?: string;
}

function which(name: string): string | null {
  const paths = (process.env.PATH ?? "").split(":");
  for (const p of paths) {
    const candidate = `${p}/${name}`;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("fs").accessSync(candidate, require("fs").constants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

export async function search(
  cfg: LoadedConfig,
  opts: SearchOptions,
): Promise<SearchHit[]> {
  if (which("rg")) {
    return searchWithRipgrep(cfg.root, opts);
  }
  return searchInProcess(cfg, opts);
}

function searchWithRipgrep(root: string, opts: SearchOptions): Promise<SearchHit[]> {
  return new Promise((resolve, reject) => {
    const args = [
      "--line-number",
      "--hidden",
      "--glob", "!.git",
      "--glob", "!.mookf",
      opts.caseInsensitive ? "-i" : "",
      opts.regex ? "" : "-F",
      "--", opts.query, root,
    ].filter(Boolean) as string[];
    const proc = spawn("rg", args);
    const hits: SearchHit[] = [];
    let buf = "";
    proc.stdout.on("data", (d) => (buf += d.toString()));
    proc.on("close", () => {
      const lines = buf.split("\n").filter(Boolean);
      for (const line of lines) {
        const m = line.match(/^(.+?):(\d+):(.*)$/);
        if (!m) {
          hits.push({ relPath: line, absPath: line });
          continue;
        }
        hits.push({
          absPath: m[1],
          relPath: m[1].slice(root.length + 1),
          line: Number(m[2]),
          text: m[3],
        });
      }
      resolve(hits);
    });
    proc.on("error", reject);
  });
}

async function searchInProcess(
  cfg: LoadedConfig,
  opts: SearchOptions,
): Promise<SearchHit[]> {
  const out: SearchHit[] = [];
  let re: RegExp;
  try {
    const flags = opts.caseInsensitive ? "gi" : "g";
    re = new RegExp(opts.query, flags);
  } catch {
    throw new Error(`Invalid regex: ${opts.query}`);
  }
  for await (const f of iterMdFiles(cfg)) {
    if (opts.limit && out.length >= opts.limit) break;
    const body = await readBody(f);
    const lines = body.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(re)) {
        out.push({
          relPath: f.relPath,
          absPath: f.absPath,
          line: i + 1,
          text: line,
        });
        if (opts.limit && out.length >= opts.limit) break;
      }
    }
  }
  return out;
}

async function readBody(f: ShotFile): Promise<string> {
  const { readFile } = await import("fs/promises");
  const raw = await readFile(f.absPath, "utf8");
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\n?/);
  return m ? raw.slice(m[0].length) : raw;
}
