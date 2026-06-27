/**
 * 导出目录解析
 *
 * 优先级: 命令行 --export-dir > 环境变量 BYE_BYE_EXPORT_DIR > 默认 ~/iNon/Wiki
 *
 * 约定:
 *   - 默认值展开 `~` 到 $HOME
 *   - 不存在则尝试创建 (recursive)
 *   - 给调用方一个清晰的 resolved 路径
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export const DEFAULT_EXPORT_DIR = "~/iNon/Wiki";

export interface ResolveOptions {
  /** 命令行 raw argv (不含 node / script) */
  argv: string[];
  /** 环境变量键, 默认 BYE_BYE_EXPORT_DIR */
  envKey?: string;
  /** 默认导出目录, 默认 ~/iNon/Wiki */
  defaultDir?: string;
}

export interface ResolvedExportDir {
  /** 经过 ~ 展开、绝对化的最终目录 */
  resolved: string;
  /** 来源: "flag" | "env" | "default" */
  source: "flag" | "env" | "default";
  /** 原始传入字符串, 默认值时是未展开的形式 */
  raw: string;
}

export function parseFlagValue(
  argv: string[],
  flag: string,
): string | undefined {
  const idx = argv.indexOf(flag);
  if (idx === -1) return undefined;
  return argv[idx + 1];
}

export function expandHome(p: string): string {
  if (!p) return p;
  if (p === "~") return os.homedir();
  if (p.startsWith("~/") || p.startsWith("~\\")) {
    return path.join(os.homedir(), p.slice(2));
  }
  return p;
}

export function resolveExportDir(opts: ResolveOptions): ResolvedExportDir {
  const envKey = opts.envKey ?? "BYE_BYE_EXPORT_DIR";
  const defaultDir = opts.defaultDir ?? DEFAULT_EXPORT_DIR;

  const fromFlag = parseFlagValue(opts.argv, "--export-dir");
  if (fromFlag) {
    const resolved = path.resolve(expandHome(fromFlag));
    ensureDir(resolved);
    return { resolved, source: "flag", raw: fromFlag };
  }

  const fromEnv = process.env[envKey];
  if (fromEnv) {
    const resolved = path.resolve(expandHome(fromEnv));
    ensureDir(resolved);
    return { resolved, source: "env", raw: fromEnv };
  }

  const resolved = path.resolve(expandHome(defaultDir));
  ensureDir(resolved);
  return { resolved, source: "default", raw: defaultDir };
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * 帮助文本里展示的 --export-dir 用法
 */
export const EXPORT_DIR_HELP = `--export-dir <path>   Override export directory (default: ${DEFAULT_EXPORT_DIR})`;