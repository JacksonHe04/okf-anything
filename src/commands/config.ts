/**
 * `okfe config show|set|edit` — introspect and edit the workspace config.
 */
import * as fs from "fs";
import * as path from "path";
import YAML from "yaml";
import { loadConfig } from "../config/loader.js";

export function cmdConfig(argv: string[]): number {
  const sub = argv[0] ?? "show";
  const loaded = loadConfig();
  if (!loaded) {
    console.error("✗ no .okfe/config.yaml found. Run `okfe init` first.");
    return 1;
  }
  switch (sub) {
    case "show":
      console.log(`Workspace: ${loaded.root}`);
      console.log(`Config:    ${loaded.configPath}`);
      console.log("---");
      console.log(YAML.stringify(loaded.config));
      return 0;
    case "path":
      console.log(loaded.configPath);
      return 0;
    case "root":
      console.log(loaded.root);
      return 0;
    case "edit": {
      const editor = process.env.EDITOR ?? "nano";
      const child = require("child_process").spawn(editor, [loaded.configPath], { stdio: "inherit" });
      child.on("exit", (code: number | null) => process.exit(code ?? 1));
      return 0;
    }
    default:
      console.error(explainConfig());
      return 2;
  }
}

export function explainConfig(): string {
  return `Usage: okfe config <show|path|root|edit>

  show   Pretty-print the loaded config.
  path   Print the absolute path to config.yaml.
  root   Print the workspace root.
  edit   Open config in $EDITOR.`;
}
