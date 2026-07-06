/**
 * `okfa sync <platform> [--root <spec>] [--dry-run]`
 *
 * Dispatch to the platform-specific syncer.
 *
 * For Lark, `--root` accepts:
 *   - a single space alias (`my_library`)
 *   - a numeric `space_id`
 *   - a comma-separated list of any of the above
 *   - a Lark URL containing one of the above
 *
 * For Notion, `--root` is still parsed as a UUID (existing behavior).
 */
import { loadConfig } from "../config/loader.js";
import { syncAll } from "../sync/dispatcher.js";
import { NotionSyncer } from "../platforms/notion/syncer.js";
import { LarkSyncer } from "../platforms/lark/syncer.js";
import { extractUuid } from "../platforms/notion/convert.js";
import { parseFlagValue } from "../utils/paths.js";

export async function cmdSync(argv: string[]): Promise<number> {
  const platform = argv[0];
  if (platform !== "notion" && platform !== "lark") {
    console.error(explainSync());
    return 2;
  }
  const flags = argv.slice(1);

  if (flags.includes("--help") || flags.includes("-h")) {
    console.log(explainSync());
    return 0;
  }

  const cfg = loadConfig();
  if (!cfg) {
    console.error("✗ no workspace found. Run `okfa init` first.");
    return 1;
  }
  const platformCfg = cfg.config[platform];
  let token = platformCfg?.token ?? process.env[platform === "notion" ? "NOTION_TOKEN" : "LARK_APP_SECRET"];
  if (platform === "lark") {
    token = platformCfg?.token ?? `${process.env.LARK_APP_ID ?? ""}:${process.env.LARK_APP_SECRET ?? ""}`;
  }

  if (!token || (platform === "notion" && !token.startsWith("ntn_") && token.length < 20)) {
    // For lark we no longer require appId/appSecret to be in config —
    // lark-cli owns auth. Only fail loudly for Notion where the PAT
    // is mandatory.
    if (platform === "notion") {
      console.error(
        `✗ missing or invalid ${platform} credentials. Set ${platform}.token in .okfa/config.yaml or env.`,
      );
      return 1;
    }
  }

  let syncer;
  if (platform === "notion") {
    syncer = new NotionSyncer(token ?? "");
  } else {
    // Lark auth is delegated to `lark-cli`; ignore token.
    syncer = new LarkSyncer();
  }

  const rootOverrideRaw = parseFlagValue(flags, "--root") ?? parseFlagValue(flags, "-r");
  const rootOverride = rootOverrideRaw
    ? platform === "notion"
      ? extractUuid(rootOverrideRaw)
      : parseLarkRootSpec(rootOverrideRaw)
    : undefined;
  const dryRun = flags.includes("--dry-run");

  const result = await syncAll(syncer, cfg, { rootOverride, dryRun });

  console.log("");
  console.log(
    `[${platform}] done in ${result.durationMs}ms — scanned=${result.scanned} created=${result.created} updated=${result.updated} skipped=${result.skipped} failed=${result.failed}${dryRun ? " (dry-run)" : ""}`,
  );

  return result.failed > 0 ? 1 : 0;
}

/**
 * Normalize a `--root` value for Lark. Accepts a single spec or a
 * comma-separated list. Each entry is trimmed; URLs are kept verbatim
 * (the syncer handles URL detection). Empty entries are dropped.
 */
function parseLarkRootSpec(raw: string): string {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(",");
}

export function explainSync(): string {
  return `Usage: okfa sync <notion|lark> [--root <spec>] [--dry-run]

  Incremental pull + update from the cloud workspace into <root>/<platform>/.

  --root <spec>   Override the configured root id for this run.
                  Notion: a single UUID.
                  Lark:   a single space spec (my_library | space_id | URL)
                          or a comma-separated list of any of those.
  --dry-run       Show what would happen without writing.`;
}
