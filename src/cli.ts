#!/usr/bin/env node
/**
 * okfa CLI entrypoint.
 *
 * Subcommands:
 *   init                                bootstrap a workspace
 *   config <show|path|root|edit>       introspect / edit the loaded config
 *   sync <notion|lark> [--root ...]     pull + update from a cloud platform
 *   shot <ls|find|search|replace> ...   moonshot: query the local workspace
 */
import { cmdInit, explainInit } from "./commands/init.js";
import { cmdConfig, explainConfig } from "./commands/config.js";
import { cmdSync, explainSync } from "./commands/sync.js";
import { cmdShot, explainShot } from "./commands/shot.js";

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