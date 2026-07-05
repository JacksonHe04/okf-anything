/**
 * `okfa init` — bootstrap a workspace.
 *
 * Creates `<dir>/.okfa/config.yaml` with sane defaults, prints next steps.
 * If `dir` is omitted, defaults to `~/iNon`.
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import YAML from "yaml";
import { DEFAULT_CONFIG } from "../config/schema.js";
import { writeConfig } from "../config/loader.js";

export function cmdInit(argv: string[]): number {
  const dir = argv[0] ?? path.join(os.homedir(), "iNon");
  const absRoot = path.resolve(dir);
  fs.mkdirSync(absRoot, { recursive: true });

  const cfg = { ...DEFAULT_CONFIG, root: absRoot };
  const configPath = writeConfig(absRoot, cfg);
  console.log(`✔ initialized workspace at ${absRoot}`);
  console.log(`  config: ${configPath}`);
  console.log("");
  console.log("Next:");
  console.log(`  1. Edit ${configPath} and set notion.state.default_root_id / lark.* as needed.`);
  console.log(`  2. Run: okfa sync notion --root <uuid>`);
  return 0;
}

export function explainInit(): string {
  return `Usage: okfa init [<dir>]

Bootstrap a workspace. Creates <dir>/.okfa/config.yaml.
Default <dir>: ~/iNon`;
}

export function _yaml(str: string): string {
  return YAML.stringify(str);
}
