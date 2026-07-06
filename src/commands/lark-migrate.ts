/**
 * `okfa lark migrate-frontmatter [--apply]`
 *
 * One-shot migration that rewrites pre-2026-07 Lark frontmatter to
 * the canonical field names (lark_id, lark_parent_id, lark_parent_type).
 *
 * Default is dry-run: lists every file that *would* be changed.
 * Pass --apply to write back to disk.
 */
import * as fs from "fs";
import * as path from "path";
import { loadConfig } from "../config/loader.js";
import { IgnoreMatcher } from "../ignore/matcher.js";
import { migrateLarkFileContent } from "../platforms/lark/migrate.js";

export async function cmdLarkMigrate(argv: string[]): Promise<number> {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(explainLarkMigrate());
    return 0;
  }
  const apply = argv.includes("--apply");
  const cfg = loadConfig();
  if (!cfg) {
    console.error("✗ no workspace found. Run `okfa init` first.");
    return 1;
  }

  const matcher = IgnoreMatcher.fromConfig(cfg.root, cfg.config);
  const candidateDirs = [
    path.join(cfg.root, "Wiki", "lark"),
    path.join(cfg.root, "lark"),
  ];

  let scanned = 0;
  let changed = 0;
  let skipped = 0;
  const changedPaths: string[] = [];

  for (const base of candidateDirs) {
    if (!fs.existsSync(base)) continue;
    await walk(base, cfg.root, matcher, async (abs, rel, content) => {
      scanned++;
      const result = migrateLarkFileContent(abs, content, { apply });
      if (result.skipped) {
        skipped++;
        return;
      }
      changed++;
      changedPaths.push(rel);
      if (apply && result.newContent) {
        fs.writeFileSync(abs, result.newContent, "utf8");
      }
    });
  }

  if (apply) {
    console.log(
      `\n[lark migrate-frontmatter] scanned=${scanned} changed=${changed} skipped=${skipped} (applied)\n`,
    );
    for (const p of changedPaths) console.log(`  rewrite ${p}`);
  } else {
    console.log(
      `\n[lark migrate-frontmatter] scanned=${scanned} would-rewrite=${changed} skipped=${skipped} (dry-run; pass --apply to write)\n`,
    );
    for (const p of changedPaths) console.log(`  would-rewrite ${p}`);
  }
  return 0;
}

async function walk(
  base: string,
  root: string,
  matcher: IgnoreMatcher,
  onFile: (abs: string, rel: string, content: string) => Promise<void>,
): Promise<void> {
  async function recurse(dir: string): Promise<void> {
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (matcher.ignores(full)) continue;
      if (e.isDirectory()) await recurse(full);
      else if (e.isFile() && e.name.endsWith(".md")) {
        try {
          const content = await fs.promises.readFile(full, "utf8");
          await onFile(full, path.relative(root, full), content);
        } catch {
          // skip malformed
        }
      }
    }
  }
  await recurse(base);
}

export function explainLarkMigrate(): string {
  return `Usage: okfa lark migrate-frontmatter [--apply]

  One-shot migration: rewrites legacy Lark frontmatter to the canonical
  field names used by okfa >= 2026-07.

  - lark_node_token        → lark_id
  - lark_parent_node_token → lark_parent_id
  - (back-fill)            → lark_parent_type: "wiki"

  Preserves every other key (lark_obj_token, lark_obj_type,
  lark_space_id, tags, inon_id, ...).

  Default is dry-run. Pass --apply to write to disk.

  Idempotent: files already carrying lark_id are skipped.`;
}