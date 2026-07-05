#!/usr/bin/env node
// Reverse of dev-link.mjs: removes the okfe-dev symlink installed by
// `pnpm dev:link`. Reads .dev-link.json to find where the link was
// placed. Safe to run even if no link exists.

import { existsSync, lstatSync, readFileSync, unlinkSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));
const pkgDir = join(here, "..");
const statePath = join(pkgDir, ".dev-link.json");

let target;
try {
  const state = JSON.parse(readFileSync(statePath, "utf8"));
  target = state.target;
} catch {
  console.error("[dev-unlink] no .dev-link.json found; nothing to remove");
  process.exit(0);
}

const link = join(target, "okfe-dev");
let existed = false;
try {
  lstatSync(link);
  existed = true;
} catch {
  // already gone
}

if (existed) {
  try {
    unlinkSync(link);
    console.log(`[dev-unlink] removed ${link}`);
  } catch (err) {
    console.error(`[dev-unlink] failed to remove ${link}: ${err.message}`);
    process.exit(1);
  }
} else {
  console.log(`[dev-unlink] no link at ${link}; nothing to do`);
}