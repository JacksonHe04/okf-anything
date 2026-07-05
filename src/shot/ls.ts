/**
 * shot ls — list markdown files in the workspace.
 */
import * as path from "path";
import { iterMdFiles } from "./walk.js";
import type { LoadedConfig } from "../config/loader.js";

export async function ls(cfg: LoadedConfig): Promise<string[]> {
  const out: string[] = [];
  for await (const f of iterMdFiles(cfg)) {
    out.push(path.join(f.absPath));
  }
  return out;
}
