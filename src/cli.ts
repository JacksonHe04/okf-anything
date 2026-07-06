#!/usr/bin/env node
/**
 * okfa CLI entrypoint.
 *
 * Subcommands:
 *   init                                bootstrap a workspace
 *   config <show|path|root|edit>       introspect / edit the loaded config
 *   sync <notion|lark> [--root ...]     pull + update from a cloud platform
 *   shot <ls|find|search|replace> ...   shot: query the local workspace
 */
import { cmdInit, explainInit } from "./commands/init.js";
import { cmdConfig, explainConfig } from "./commands/config.js";
import { cmdSync, explainSync } from "./commands/sync.js";
import { cmdShot, explainShot } from "./commands/shot.js";
import { cmdLarkMigrate, explainLarkMigrate } from "./commands/lark-migrate.js";

const argv = process.argv.slice(2);

if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
  console.log(topHelp());
  process.exit(0);
}

const [sub, ...rest] = argv;

async function main(): Promise<number> {
  try {
    switch (sub) {
      case "init":
        return cmdInit(rest);
      case "config":
        return cmdConfig(rest);
      case "sync":
        return await cmdSync(rest);
      case "shot":
        return await cmdShot(rest);
      case "lark":
        return await cmdLark(rest);
      case "version":
      case "-v":
      case "--version":
        console.log("okfa 0.1.0");
        return 0;
      case "help":
        console.log(topHelp());
        return 0;
      default:
        console.error(`unknown command: ${sub}`);
        console.error(topHelp());
        return 2;
    }
  } catch (err) {
    console.error("✗ fatal:", err instanceof Error ? err.message : err);
    return 1;
  }
}

/** `okfa lark <subcommand>` dispatcher. */
async function cmdLark(argv: string[]): Promise<number> {
  const sub = argv[0];
  const rest = argv.slice(1);
  if (!sub || sub === "--help" || sub === "-h") {
    console.log(explainLark());
    return 0;
  }
  switch (sub) {
    case "migrate-frontmatter":
      return cmdLarkMigrate(rest);
    default:
      console.error(`unknown lark subcommand: ${sub}`);
      console.error(explainLark());
      return 2;
  }
}

function explainLark(): string {
  return `Usage: okfa lark <subcommand>

Subcommands:
  migrate-frontmatter [--apply]   One-shot rewrite of legacy Lark
                                  frontmatter to the canonical field
                                  names (lark_id, lark_parent_id,
                                  lark_parent_type). Dry-run by default.

${explainLarkMigrate()}`;
}

main().then(
  (code) => {
    // Force-flush stdout before exiting so output isn't dropped when
    // re-imported from a bin shim.
    if (process.stdout.write("")) {
      process.exit(code);
    } else {
      process.stdout.once("drain", () => process.exit(code));
    }
  },
  (err) => {
    console.error("✗ fatal:", err instanceof Error ? err.message : err);
    process.exit(1);
  },
);

function topHelp(): string {
  return `okfa — escape Notion / Lark, sync into local OKF Markdown.

${explainInit()}

${explainConfig()}

${explainSync()}

${explainShot()}

Flags anywhere: --help / -h for the subcommand help.`;
}