/**
 * Locate and load the `<root>/.okfa/config.yaml` for the current workspace.
 *
 * Search order:
 *   1. explicit --config flag
 *   2. walking up from cwd until a `.okfa/config.yaml` is found
 *   3. fallback to `~/iNon/.okfa/config.yaml` if it exists
 *
 * If `process.env.OKFA_CONFIG` is set, that path wins.
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import YAML from "yaml";
import { OkfAnythingConfigSchema, DEFAULT_CONFIG, type OkfAnythingConfig } from "./schema.js";

export interface LoadedConfig {
  config: OkfAnythingConfig;
  /** Absolute path to the workspace root (where `.okfa/` lives). */
  root: string;
  /** Absolute path to the YAML file. */
  configPath: string;
  /** True if no user config existed and defaults were emitted. */
  isFresh: boolean;
}

export interface LocateOptions {
  /** cwd to begin upward search from. Default: process.cwd() */
  cwd?: string;
  /** Override config path explicitly. */
  configPath?: string;
}

const CONFIG_FILENAME = "config.yaml";
const CONFIG_DIRNAME = ".okfa";
const HOME_DEFAULT = path.join(os.homedir(), "iNon");

function expandHome(p: string): string {
  if (!p) return p;
  if (p === "~") return os.homedir();
  if (p.startsWith("~/") || p.startsWith("~\\")) {
    return path.join(os.homedir(), p.slice(2));
  }
  return p;
}

export function locateConfigPath(opts: LocateOptions = {}): string | null {
  const override = process.env.OKFA_CONFIG ?? opts.configPath;
  if (override) {
    return path.resolve(expandHome(override));
  }

  const cwd = opts.cwd ?? process.cwd();
  let dir = path.resolve(cwd);
  const { root } = path.parse(dir);
  while (true) {
    const candidate = path.join(dir, CONFIG_DIRNAME, CONFIG_FILENAME);
    if (fs.existsSync(candidate)) return candidate;
    if (dir === root || dir === path.dirname(dir)) break;
    dir = path.dirname(dir);
  }

  const homeCandidate = path.join(HOME_DEFAULT, CONFIG_DIRNAME, CONFIG_FILENAME);
  return fs.existsSync(homeCandidate) ? homeCandidate : null;
}

export function loadConfig(opts: LocateOptions = {}): LoadedConfig | null {
  const configPath = locateConfigPath(opts);
  if (!configPath) return null;

  const raw = fs.readFileSync(configPath, "utf8");
  const parsed = YAML.parse(raw) ?? {};
  const validated = OkfAnythingConfigSchema.parse({
    ...DEFAULT_CONFIG,
    ...parsed,
  });

  return {
    config: validated,
    root: path.dirname(path.dirname(configPath)),
    configPath,
    isFresh: false,
  };
}

export function writeConfig(
  root: string,
  config: OkfAnythingConfig,
): string {
  const dir = path.join(root, CONFIG_DIRNAME);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, CONFIG_FILENAME);
  fs.writeFileSync(filePath, YAML.stringify(config), "utf8");
  return filePath;
}

export function ensureConfig(root: string): LoadedConfig {
  const configPath = path.join(root, CONFIG_DIRNAME, CONFIG_FILENAME);
  if (!fs.existsSync(configPath)) {
    writeConfig(root, { ...DEFAULT_CONFIG, root });
  }
  const loaded = loadConfig({ configPath })!;
  loaded.isFresh = true;
  return loaded;
}
