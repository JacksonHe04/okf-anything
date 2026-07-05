#!/usr/bin/env node
// Symlink `bin/okfe-dev` into a directory on the user's PATH so that
// `okfe-dev` can be invoked from any shell, in any directory, and
// always runs the latest code in this repo.
//
// Priority for the install target:
//   1. $OKFE_DEV_BIN_DIR (override)
//   2. ~/.local/bin      (user-level, no sudo)
//   3. $(npm prefix -g)/bin (fallback if ~/.local/bin is not writable)
//
// On uninstall (dev:unlink) we just remove the symlink from wherever
// dev:link put it; we don't touch the package itself.

import { existsSync, lstatSync, mkdirSync, readlinkSync, symlinkSync, unlinkSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { homedir } from "os";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));
const pkgDir = join(here, "..");
const shimSrc = join(pkgDir, "bin", "okfe-dev");
const statePath = join(pkgDir, ".dev-link.json");

function npmGlobalBin() {
  try {
    const prefix = execFileSync("npm", ["prefix", "-g"], { encoding: "utf8" }).trim();
    return join(prefix, "bin");
  } catch {
    return null;
  }
}

function pickTarget() {
  if (process.env.OKFE_DEV_BIN_DIR) return process.env.OKFE_DEV_BIN_DIR;
  const local = join(homedir(), ".local", "bin");
  if (existsSync(local) || tryMkdir(local)) return local;
  const fallback = npmGlobalBin();
  if (fallback) return fallback;
  throw new Error(
    "no writable bin directory found; set OKFE_DEV_BIN_DIR to override"
  );
}

function tryMkdir(p) {
  try {
    mkdirSync(p, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

function recordState(target) {
  writeFileSync(statePath, JSON.stringify({ target }, null, 2));
}

const target = pickTarget();
tryMkdir(target);

const link = join(target, "okfe-dev");
if (existsSync(link) || (() => { try { lstatSync(link); return true; } catch { return false; } })()) {
  try {
    unlinkSync(link);
  } catch (err) {
    console.error(`[dev-link] cannot remove existing entry at ${link}: ${err.message}`);
    process.exit(1);
  }
}

try {
  symlinkSync(shimSrc, link);
} catch (err) {
  console.error(`[dev-link] symlink failed: ${err.message}`);
  console.error(`[dev-link] try: sudo mkdir -p ${target} && sudo chown $USER ${target}`);
  process.exit(1);
}

recordState(target);

console.log(`[dev-link] linked ${shimSrc} → ${link}`);
console.log(`[dev-link] run from anywhere: okfe-dev --help`);
console.log(`[dev-link] uninstall with: pnpm dev:unlink`);