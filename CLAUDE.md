# mookf

> **MO** + **O** + **K** + **F**ormat. The original product intent — escape
> centralized cloud knowledge bases — has not changed. What changed in the
> 2026-07 rebrand: name, scope, and architecture.

## What mookf is

mookf pulls and incrementally syncs **Notion** (and **Lark / Feishu**,
stub for v1) into a local **OKF (Open Knowledge Format)** Markdown
workspace. By default the workspace lives at `~/iNon`. You can change it
in `.mookf/config.yaml`.

Compared to the old `iMon` line:

- No web page, no app, no editor UI in scope. mookf is just a CLI
  (`mookf`) and Claude Code Skills.
- Sync and pull are **the same operation**; pull is just sync with an
  empty local.
- Three UUID spaces coexist on disk: `notion_id`, `lark_id`, plus the
  user's own project-internal ids. Together they are the idempotency key
  for incremental sync.
- The user can freely reorganize local files; sync follows UUIDs, not
  paths.

## Repo layout

```
mookr/                            ← repo root (this file lives here)
├── mookf/                        ← the CLI source (npm package @mookf/cli)
│   ├── bin/mookf
│   ├── src/{cli.ts, commands/, config/, ignore/, okf/, shot/, sync/, utils/, platforms/{notion,lark}}
│   ├── skills/{mookf-init, mookf-sync-notion, mookf-sync-lark, mookf-shot}/SKILL.md
│   └── templates/cron-schedule.md
├── docs/                         ← design / decision records (root-level)
└── bye-bye-*/                    ← legacy (absorbed by mookf/, slated for removal)
```

## Field mapping (Notion → OKF)

| Notion             | OKF YAML              |
|--------------------|-----------------------|
| `id`               | `notion_id`           |
| `title`            | `title`               |
| `url`              | `resource`            |
| `createdTime`      | `created_time`        |
| `lastEditedTime`   | `last_edited_time` (and also `timestamp`) |
| `parent.type`      | `notion_parent_type`  |
| `parent.id`        | `notion_parent_id`    |
| properties (except `title`) | flattened into `properties` |

Field mapping for Lark is symmetric (`lark_id`, `lark_parent_type`, etc.).

## Pull / sync / retry strategy

- **Streaming writes**: each doc is on disk the moment it is rendered;
  Ctrl-C partway leaves a consistent tree.
- **UUID idempotency**: re-running sync skips nodes whose
  `notion_id`/`lark_id` already exists in the workspace.
- **Conflict resolver**: duplicate basenames under the same parent dir
  gain `-1`, `-2`, ... suffixes.
- **Forbidden operations**: never delete local files just because the
  cloud side deleted them; never call Notion / Lark write APIs.

## References

- Google OKF: see `mookf/docs/design.md`.
- Notion PAT: https://developers.notion.com/guides/get-started/personal-access-tokens

## Rules

- Do not delete `<root>/notion/` or `<root>/lark/` directories without
  the user's explicit consent.
- Do not call write APIs against Notion or Lark. The CLI only reads.
- Do not commit personal information (tokens, Notion UUIDs of private
  docs).
- Commit style: see `.agents/skills/git-commit/SKILL.md` (when present).
- Plans / decisions / reports produced during development go in `docs/`.
- For development, the canonical entry is `mookf/`. Use
  `cd mookf && pnpm install && pnpm run build` to refresh `dist/`.
