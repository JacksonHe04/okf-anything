/**
 * `mookf shot <sub> ...`
 *
 * Subcommands:
 *   find     --field <k> [--eq <v>] [--contains] [--regex]
 *   search   <query> [--regex] [--ignore-case] [--files-only] [--limit N]
 *   ls       List markdown files in workspace.
 *   replace  --field <k> --to <v> [--match <v>] [--in-string] [--apply]
 */
import { loadConfig } from "../config/loader.js";
import { find } from "../shot/find.js";
import { search } from "../shot/search.js";
import { replaceBody, replaceFrontmatter } from "../shot/replace.js";
import { ls } from "../shot/ls.js";

export async function cmdShot(argv: string[]): Promise<number> {
  const sub = argv[0];
  const rest = argv.slice(1);

  if (!sub || sub === "--help" || sub === "-h") {
    console.log(explainShot());
    return 0;
  }

  const cfg = loadConfig();
  if (!cfg) {
    console.error("✗ no workspace found. Run `mookf init` first.");
    return 1;
  }

  switch (sub) {
    case "ls":
      return runLs(cfg);
    case "find":
      return runFind(cfg, rest);
    case "search":
      return runSearch(cfg, rest);
    case "replace":
      return runReplace(cfg, rest);
    default:
      console.error(`unknown subcommand: ${sub}`);
      console.error(explainShot());
      return 2;
  }
}

async function runLs(cfg: NonNullable<Awaited<ReturnType<typeof loadConfig>>>): Promise<number> {
  const files = await ls(cfg);
  for (const f of files) console.log(f);
  return 0;
}

import { parseFlagValue } from "../utils/paths.js";

type LoadedCfg = NonNullable<Awaited<ReturnType<typeof loadConfig>>>;

async function runFind(
  cfg: LoadedCfg,
  argv: string[],
): Promise<number> {
  const field = argv[0];
  const eq = parseFlagValue(argv, "--eq");
  const value = parseFlagValue(argv, "--value") ?? eq;
  const contains = argv.includes("--contains");
  const regex = argv.includes("--regex");

  if (!field) {
    console.error("Usage: mookf shot find <field> [--eq <v>] [--contains] [--regex]");
    return 2;
  }

  const results = await find(cfg, { field, value, contains, regex });
  for (const r of results) {
    console.log(`${r.relPath}\t${r.matchedField}=${JSON.stringify(r.matchedValue)}`);
  }
  console.error(`(${results.length} matches)`);
  return 0;
}

async function runSearch(
  cfg: LoadedCfg,
  argv: string[],
): Promise<number> {
  const query = argv[0];
  if (!query) {
    console.error("Usage: mookf shot search <query> [--regex] [--ignore-case] [--files-only] [--limit N]");
    return 2;
  }
  const limit = parseFlagValue(argv, "--limit");
  const opts = {
    query,
    regex: argv.includes("--regex"),
    caseInsensitive: argv.includes("--ignore-case") || argv.includes("-i"),
    filesOnly: argv.includes("--files-only"),
    limit: limit ? Number(limit) : undefined,
  };
  const hits = await search(cfg, opts);
  for (const h of hits) {
    if (h.line) console.log(`${h.relPath}:${h.line}:${h.text ?? ""}`);
    else console.log(h.relPath);
  }
  console.error(`(${hits.length} hits)`);
  return 0;
}

async function runReplace(
  cfg: LoadedCfg,
  argv: string[],
): Promise<number> {
  const field = parseFlagValue(argv, "--field");
  const pattern = parseFlagValue(argv, "--pattern");
  const replacement = parseFlagValue(argv, "--to") ?? "";
  const fromValue = parseFlagValue(argv, "--from");
  const toValue = parseFlagValue(argv, "--to");
  const matchValue = parseFlagValue(argv, "--match");
  const apply = argv.includes("--apply");

  if (field) {
    if (!toValue && !fromValue) {
      console.error("Usage: mookf shot replace --field <k> [--from <v>] --to <v> [--match <v>] [--in-string] [--apply]");
      return 2;
    }
    const report = await replaceFrontmatter(
      cfg,
      { field, fromValue, toValue: toValue ?? "", match: matchValue, inString: argv.includes("--in-string") },
      apply,
    );
    console.log(`inspected=${report.inspected} modified=${report.modified} skipped=${report.skipped}${apply ? "" : " (dry-run; pass --apply to write)"}`);
    return 0;
  }
  if (!pattern) {
    console.error("Usage: mookf shot replace --pattern <p> --to <v> [--regex] [--apply]");
    return 2;
  }
  const report = await replaceBody(
    cfg,
    { pattern, replacement, regex: argv.includes("--regex") },
    apply,
  );
  console.log(`inspected=${report.inspected} modified=${report.modified} skipped=${report.skipped}${apply ? "" : " (dry-run; pass --apply to write)"}`);
  return 0;
}

export function explainShot(): string {
  return `Usage: mookf shot <ls|find|search|replace> [...]

  ls                        List all .md files in the workspace.
  find <field> [--eq <v>]   Match files by frontmatter field value.
       [--contains]         Substring match.
       [--regex]            Treat value as a regex.

  search <query>            Full-text grep across .md bodies.
       [--regex]            Treat query as a regex.
       [--ignore-case/-i]   Case-insensitive search.
       [--files-only]       Print file paths only.
       [--limit N]          Cap results.

  replace                   Batch in-place edits on the workspace.
       --field <k>          Target a frontmatter field.
       --from <v>           Optional current value (existence-only filter).
       --to <v>             New value.
       --match <v>          Only touch files whose field equals this.
       --in-string          Replace substrings instead of whole values.
       --pattern <p>        (body mode) Substring / regex to replace.
       --regex              Treat the pattern as a regex.
       --apply              Write to disk. Without it, dry-run.`;
}
