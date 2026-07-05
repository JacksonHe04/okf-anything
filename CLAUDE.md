# okf-anything

> **MO** + **O** + **K** + **F**ormat. The original product intent — escape
> centralized cloud knowledge bases — has not changed. What changed in the
> 2026-07 rebrand: name, scope, and architecture.

## What okf-anything is

okf-anything pulls and incrementally syncs **Notion** (and **Lark / Feishu**,
stub for v1) into a local **OKF (Open Knowledge Format)** Markdown
workspace. By default the workspace lives at `~/iNon`. You can change it
in `.okfa/config.yaml`.

Compared to the old `iMon` line:

- No web page, no app, no editor UI in scope. okf-anything is just a CLI
  (`okfa`) and Claude Code Skills.
- Sync and pull are **the same operation**; pull is just sync with an
  empty local.
- Three UUID spaces coexist on disk: `notion_id`, `lark_id`, plus the
  user's own project-internal ids. Together they are the idempotency key
  for incremental sync.
- The user can freely reorganize local files; sync follows UUIDs, not
  paths.

## Repo layout

```
okf-anything/                            ← repo root (this file lives here)
├── src/                          ← CLI source (TS)
│   ├── cli.ts                    ← entry
│   ├── commands/{init,config,sync,shot}.ts
│   ├── config/                   ← .okfa/config.yaml loader + zod schema
│   ├── ignore/                   ← gitignore-style matcher
│   ├── shot/                     ← moonshot: ls / find / search / replace
│   ├── sync/                     ← generic engine (UUID + last_edited_time)
│   ├── platforms/{notion,lark}/  ← per-platform adapters
│   └── utils/                    ← shared helpers
├── bin/okfa                     ← executable shim
├── skills/{okfa-init, okfa-sync-notion, okfa-sync-lark, okfa-shot}/SKILL.md
├── templates/cron-schedule.md    ← recipe for scheduled syncs
├── docs/                         ← design / decision records
└── dist/                         ← build output (gitignored)
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

- Design notes: `docs/okf-anything/design.md` (also mirrored under
  `.agents/docs/`).
- Notion PAT: https://developers.notion.com/guides/get-started/personal-access-tokens

## Rules

- Do not delete `<root>/notion/` or `<root>/lark/` directories without
  the user's explicit consent.
- Do not call write APIs against Notion or Lark. The CLI only reads.
- Do not commit personal information (tokens, Notion UUIDs of private
  docs).
- Commit style: see `.agents/skills/git-commit/SKILL.md` (when present).
- Plans / decisions / reports produced during development go in
  `.agents/docs/` (NOT in `docs/` — design artifacts are kept private
  to your own machine).
- For development, the canonical entry is the repo root. Use
  `pnpm install && pnpm run build` to refresh `dist/`.