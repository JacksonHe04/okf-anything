// Flatten dist/src/* up to dist/* so the bin shim at dist/okfe (and
// dist/bin/okfe if present) can resolve dist/cli.js directly.
//
// Also re-exec the bin shim into dist/ when it's only at the repo root
// bin/, so the npm tarball works whether the package is published
// from the repo root (no sub-dir) or from a sub-dir.

import { existsSync, mkdirSync, copyFileSync, chmodSync, renameSync, readdirSync, rmdirSync } from "fs";
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
    if (existsSync(dst)) continue;
    renameSync(src, dst);
    console.log(`moved dist/src/${entry} → dist/${entry}`);
  }
  try {
    rmdirSync(distSrc);
  } catch {
    /* ignore */
  }
}