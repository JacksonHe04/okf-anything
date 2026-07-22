// Flatten dist/src/* up to dist/* so the bin shim at dist/okfa (and
// dist/bin/okfa if present) can resolve dist/cli.js directly.
//
// Also re-exec the bin shim into dist/ when it's only at the repo root
// bin/, so the npm tarball works whether the package is published
// from the repo root (no sub-dir) or from a sub-dir.

import { existsSync, mkdirSync, copyFileSync, chmodSync, cpSync, readdirSync, rmSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const srcBin = join(root, "bin");
const dstBin = join(root, "dist");
const distSrc = join(root, "dist", "src");

mkdirSync(dstBin, { recursive: true });
for (const entry of readdirSync(srcBin)) {
  const src = join(srcBin, entry);
  const dst = join(dstBin, entry);
  copyFileSync(src, dst);
  chmodSync(dst, 0o755);
  console.log(`copied bin/${entry} → dist/${entry}`);
}

if (existsSync(distSrc)) {
  for (const entry of readdirSync(distSrc)) {
    const src = join(distSrc, entry);
    const dst = join(root, "dist", entry);
    // `tsc` emits into dist/src on every build. Copy with overwrite so an
    // incremental build cannot silently keep stale dist/platforms or
    // dist/commands from a previous run.
    cpSync(src, dst, { recursive: true, force: true });
    rmSync(src, { recursive: true, force: true });
    console.log(`synced dist/src/${entry} → dist/${entry}`);
  }
  rmSync(distSrc, { recursive: true, force: true });
}
