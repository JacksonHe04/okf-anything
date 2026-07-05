/**
 * Schema of `<root>/.okfe/config.yaml`
 *
 * Top-level fields are kept flat so users can grep/edit by hand without
 * learning a deeply nested structure.
 */
import { z } from "zod";

export const PlatformIdSchema = z.enum(["notion", "lark"]);
export type PlatformId = z.infer<typeof PlatformIdSchema>;

export const IgnoreRuleSchema = z.object({
  /** Glob pattern (gitignore syntax). */
  pattern: z.string().min(1),
  /** If true, only applies inside a sub-tree (relative to where it is declared). */
  scopedToRoot: z.boolean().optional().default(false),
});

/** Per-platform sync state. */
export const PlatformStateSchema = z.object({
  /** ISO timestamp of the last successful incremental sync. */
  last_sync_time: z.string().optional(),
  /** Optional default Notion / Lark top-level page id (UUID) used when no flag is passed. */
  default_root_id: z.string().optional(),
});
export type PlatformState = z.infer<typeof PlatformStateSchema>;

export const PlatformConfigSchema = z.object({
  /** API token. Read from env at runtime if absent. */
  token: z.string().optional(),
  /** Per-platform sync state. */
  state: PlatformStateSchema.optional().default({}),
  /** Per-platform extra flags (free-form). */
  options: z.record(z.string(), z.unknown()).optional().default({}),
});
export type PlatformConfig = z.infer<typeof PlatformConfigSchema>;

export const ShotConfigSchema = z.object({
  /** Glob patterns shot should never descend into. */
  ignore: z.array(z.string()).optional().default([]),
  /** Max frontmatter file size to parse before falling back to raw grep. */
  maxFrontmatterBytes: z.number().int().positive().optional().default(1_048_576),
});

export const SyncConfigSchema = z.object({
  /** Default path templates. `${platform}` will be replaced with "notion" / "lark". */
  pathTemplate: z.string().optional().default("${platform}"),
  /** Override default Notion / Lark top-level page id (UUID) used when no flag is passed. */
  defaultRootId: z.string().optional(),
});

export const OkfEverythingConfigSchema = z.object({
  schema_version: z.literal(1).default(1),
  root: z.string().optional(),
  notion: PlatformConfigSchema.optional(),
  lark: PlatformConfigSchema.optional(),
  ignore: z.array(z.string()).optional().default([]),
  shot: ShotConfigSchema.optional().default({}),
  sync: SyncConfigSchema.optional().default({}),
});
export type OkfEverythingConfig = z.infer<typeof OkfEverythingConfigSchema>;

export const DEFAULT_CONFIG: OkfEverythingConfig = {
  schema_version: 1,
  ignore: [],
  shot: { ignore: [], maxFrontmatterBytes: 1_048_576 },
  sync: { pathTemplate: "${platform}" },
};
