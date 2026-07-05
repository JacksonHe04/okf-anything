/**
 * `okfe sync <platform> [--root <uuid>] [--dry-run]`
 *
 * Dispatch to the platform-specific syncer.
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
    console.error("✗ no workspace found. Run `okfe init` first.");
    return 1;
  }
  const platformCfg = cfg.config[platform];
  let token = platformCfg?.token ?? process.env[platform === "notion" ? "NOTION_TOKEN" : "LARK_APP_SECRET"];
  if (platform === "lark") {
    token = platformCfg?.token ?? `${process.env.LARK_APP_ID ?? ""}:${process.env.LARK_APP_SECRET ?? ""}`;
  }

  if (!token || (platform === "notion" && !token.startsWith("ntn_") && token.length < 20)) {
    console.error(
      `✗ missing or invalid ${platform} credentials. Set ${platform}.token in .okfe/config.yaml or env.`,
    );
    return 1;
  }

  let syncer;
  if (platform === "notion") {
    syncer = new NotionSyncer(token);
  } else {
    const [appId, appSecret] = String(token).split(":");
    syncer = new LarkSyncer({
      baseUrl: "https://open.feishu.cn",
      appId: appId ?? "",
      appSecret: appSecret ?? "",
    });
  }

  const rootOverrideRaw = parseFlagValue(flags, "--root") ?? parseFlagValue(flags, "-r");
  const rootOverride = rootOverrideRaw ? extractUuid(rootOverrideRaw) : undefined;
  const dryRun = flags.includes("--dry-run");

  const result = await syncAll(syncer, cfg, { rootOverride, dryRun });

  console.log("");
  console.log(
    `[${platform}] done in ${result.durationMs}ms — scanned=${result.scanned} created=${result.created} updated=${result.updated} skipped=${result.skipped} failed=${result.failed}${dryRun ? " (dry-run)" : ""}`,
  );

  return result.failed > 0 ? 1 : 0;
}

export function explainSync(): string {
  return `Usage: okfe sync <notion|lark> [--root <uuid>] [--dry-run]

  Incremental pull + update from the cloud workspace into <root>/<platform>/.

  --root <uuid>   Override the configured root page id for this run.
  --dry-run       Show what would happen without writing.`;
}
