// CLI smoke tests. Runs against the freshly built `dist/cli.js` so they
// exercise the same code path as the published package, just without
// going through npm.
//
// `pnpm test` runs `pnpm run build` first to ensure `dist/` is fresh.
//
// Each test isolates its workspace in a tempdir and tears it down on
// exit. None of these touch Notion / Lark.

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(here, "..");
const CLI = join(PKG_ROOT, "dist", "cli.js");

function run(args, { cwd, env } = {}) {
  return execFileSync("node", [CLI, ...args], {
    cwd: cwd ?? PKG_ROOT,
    env: { ...process.env, ...env },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function runOrThrow(args, opts) {
  try {
    return run(args, opts);
  } catch (err) {
    throw new Error(
      `cli ${args.join(" ")} failed: ${err.stderr?.toString() ?? err.message}`
    );
  }
}

function makeWorkspace() {
  const dir = mkdtempSync(join(tmpdir(), "okfa-test-"));
  return {
    dir,
    cleanup: () => {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    },
  };
}

test("dist/cli.js exists and is executable via node", () => {
  assert.ok(existsSync(CLI), `missing ${CLI}; run pnpm run build first`);
});

test("okfa (no args) prints usage to stdout", () => {
  const out = runOrThrow([]);
  assert.match(out, /okfa/);
  assert.match(out, /Usage:/);
});

test("okfa --help exits 0 and prints usage", () => {
  const out = runOrThrow(["--help"]);
  assert.match(out, /okfa/);
  assert.match(out, /init/);
  assert.match(out, /sync/);
  assert.match(out, /shot/);
});

test("okfa init <dir> creates <dir>/.okfa/config.yaml", () => {
  const ws = makeWorkspace();
  try {
    runOrThrow(["init", ws.dir]);
    const cfg = join(ws.dir, ".okfa", "config.yaml");
    assert.ok(existsSync(cfg), `expected ${cfg} to exist`);
    const body = readFileSync(cfg, "utf8");
    assert.match(body, /root:/);
  } finally {
    ws.cleanup();
  }
});

test("okfa config path prints absolute path under workspace root", () => {
  const ws = makeWorkspace();
  try {
    runOrThrow(["init", ws.dir]);
    const out = runOrThrow(["config", "path"], {
      cwd: ws.dir,
      env: { OKFA_ROOT: ws.dir },
    }).trim();
    assert.ok(out.startsWith("/"), `expected absolute path, got: ${out}`);
    assert.ok(out.endsWith("config.yaml"));
  } finally {
    ws.cleanup();
  }
});

test("okfa shot ls prints header even on empty workspace", () => {
  const ws = makeWorkspace();
  try {
    runOrThrow(["init", ws.dir]);
    // No exception is enough; we don't pin output text since shot ls
    // header format is allowed to evolve.
    runOrThrow(["shot", "ls"], {
      cwd: ws.dir,
      env: { OKFA_ROOT: ws.dir },
    });
  } finally {
    ws.cleanup();
  }
});

test("okfa rejects an unknown subcommand with non-zero exit", () => {
  let code = 0;
  try {
    run(["definitely-not-a-real-subcommand"]);
  } catch (err) {
    code = err.status ?? 1;
  }
  assert.notEqual(code, 0, "unknown subcommand should exit non-zero");
});