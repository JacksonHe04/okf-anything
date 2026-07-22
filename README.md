# okf-anything — `@inon-ai/okf-anything`

> **okf-anything** — a local-first, agent-friendly escape hatch from
> Notion / Lark. Built on Google's [OKF (Open Knowledge Format)](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing).
>
> One CLI: `okfa`. NPM package: `@inon-ai/okf-anything`.

🌐 **Read this README in another language:** [English](README.md) ·
[简体中文](docs/README_ZH_CN.md) ·
[繁體中文](docs/README_ZH_TW.md) ·
[日本語](docs/README_JA.md)

## What it does

okf-anything pulls and incrementally **syncs** your Notion and Lark
content into a local **OKF (Open Knowledge Format)** Markdown
workspace that you own, version, and let your AI Agent (e.g. Claude
Code) search with surgical precision.

```
            ┌────────────────────┐
            │   Notion / Lark    │
            └─────────┬──────────┘
                      │  okfa sync
                      ▼
   ┌───────────────────────────────────┐
   │  ~/iNon  (your workspace)         │
   │  ├── .okfa/config.yaml            │
   │  ├── notion/   ← synced Notion    │
   │  ├── lark/     ← synced Lark      │
   │  └── projects/<your code>         │
   └───────────────────────────────────┘
                      ▲
                      │  okfa shot
                      │  (find · search · replace · ls)
                      │
            ┌────────────────────┐
            │  Claude Code / etc │
            └────────────────────┘
```

## Why

- **Own your data** — your notes, your machine, your git, your rules.
- **Agent-friendly** — every doc gets an OKF YAML frontmatter. Fields
  are addressable; `okfa shot find --field status --eq active` is the
  trivial way to ask "what's open?"
- **Idempotent sync** — `notion_id` in frontmatter is the durable key.
  Move your files around freely, the next sync still hits the right
  ones, no re-fetch.
- **Same workspace, mixed content** — keep your code, your PDFs, your
  Notion docs, your docs-of-docs all in the same tree, organized by
  *your* projects.
- **No RAG detours** — `okfa shot` is grep + YAML fields under
  the hood. Predictable, debuggable, no embeddings to babysit.

## Install

```bash
npm install -g @inon-ai/okf-anything
# or
pnpm add -g @inon-ai/okf-anything
```

After install, `okfa --help` is available. To use the bundled Claude
Code Skills, copy `skills/okfa-*` into `~/.claude/skills/` (or wherever
your Claude Code Skills live):

```bash
cp -r skills/okfa-* ~/.claude/skills/
```

## Quickstart

```bash
okfa init                          # bootstrap ~/iNon/.okfa/config.yaml
okfa config edit                  # fill in tokens, set default_root_id
okfa sync notion --root <uuid>    # first full pull
okfa shot ls                       # see what landed
okfa shot find type --eq "Notion Page"
```

Repeat `okfa sync notion` whenever you want — the second run is
near-instant: only `last_edited_time` mutations are pulled.

## Commands

| Command                | Purpose                                                     |
|------------------------|-------------------------------------------------------------|
| `okfa init [<dir>]`   | Bootstrap a workspace.                                      |
| `okfa config <sub>`   | `show` / `path` / `root` / `edit`.                          |
| `okfa sync notion`    | Incremental sync from Notion (UUID + `last_edited_time`).   |
| `okfa sync lark`      | Sync visible Lark Wiki, Drive, Minutes, and supported assets. |
| `okfa shot ls`        | List all `.md` files in the workspace.                      |
| `okfa shot find`      | Frontmatter field lookup.                                   |
| `okfa shot search`    | Full-text grep across bodies (`rg` when available).         |
| `okfa shot replace`   | Batch frontmatter / body edits. Dry-run by default.         |

Run any command with `--help` for details.

### `okfa shot` examples

```bash
# Find every Notion doc tagged status: archived
okfa shot find status --eq archived

# "Where did I write about X?"
okfa shot search X --ignore-case

# Rename the project from PALM to Palm everywhere in frontmatter
okfa shot replace --field title --from PALM --to Palm --in-string --apply

# List every doc synced from Notion last week
okfa shot find notion_id --regex .
```

### Scheduled sync

okf-anything ships a prompt template at `templates/cron-schedule.md`
that Claude Code can paste into any scheduler (Claude Code scheduled
tasks, cron, GitHub Actions, …) to run `okfa sync {notion,lark}` on a
recurring cadence. The UUID frontmatter ensures repeat runs are
incremental — re-running won't re-fetch already-pulled docs even if the
user has reorganized them locally.

## How sync works

Every pulled Notion page writes an OKF YAML frontmatter block with at
least:

```yaml
---
type: "Notion Page"
title: "..."
resource: https://www.notion.so/...
notion_id: 7c2e...      # the durable key
created_time: 2025-...
last_edited_time: 2026-07-05T12:00:00.000Z
notion_parent_type: page_id
notion_parent_id: ...
---
```

`sync` keeps a per-platform `last_sync_time` and, on each run:

1. Lists all visible pages reachable from the configured root.
2. Loads the local UUID registry by scanning frontmatter.
3. For each cloud item whose `last_edited_time` is newer than (or
   absent from) local, fetches blocks and writes.
4. Never deletes local files when a cloud doc is deleted.

### Pull / sync / retry strategy

- **Streaming writes**: each doc is on disk the moment it is rendered;
  Ctrl-C partway leaves a consistent tree.
- **UUID idempotency**: re-running sync skips nodes whose
  `notion_id` / `lark_id` already exists in the workspace, regardless
  of where they live in the directory tree.
- **Conflict resolver**: duplicate basenames under the same parent
  directory gain `-1`, `-2`, … suffixes (case-insensitive).
- **Forbidden operations**: never delete local files just because the
  cloud side deleted them; never call Notion / Lark write APIs.

### Field mapping (Notion → OKF)

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

Field mapping for Lark is symmetric (`lark_id`, `lark_parent_type`, …).

## Status

| Surface     | Status             |
|-------------|--------------------|
| Notion pull | ✅ Working.        |
| Notion sync | ✅ Working.        |
| Lark pull   | ✅ Wiki, Drive, Minutes, Docx, Base, Sheet, Slides, Mindnote, files. |
| Lark sync   | ✅ Full refresh with token-based idempotency. |
| shot        | ✅ Working.        |

Lark sync combines the Wiki tree with paginated Drive Search and deduplicates
them by underlying object token. Team Wiki content is grouped by knowledge
base, while personal/standalone Drive content is grouped by owner. Searchable content is rendered to Markdown;
formats that cannot be represented faithfully as Markdown are preserved as
sidecar snapshots next to their OKF metadata file.

## Repository layout

This repo is the source tree for `@inon-ai/okf-anything`. There is no
sub-package — the CLI source lives at the repo root.

```
okf-anything/                      ← repo root (= @inon-ai/okf-anything)
├── src/                           ← CLI source (TypeScript)
│   ├── cli.ts                     ← top-level dispatcher
│   ├── commands/                  ← per-subcommand handlers
│   │   ├── init.ts                ← `okfa init`
│   │   ├── config.ts              ← `okfa config show|path|root|edit`
│   │   ├── sync.ts                ← `okfa sync notion|lark`
│   │   └── shot.ts                ← `okfa shot ls|find|search|replace`
│   ├── config/                    ← `.okfa/config.yaml` loader + zod schema
│   ├── ignore/                    ← gitignore-style matcher (`.okfaignore`)
│   ├── okf/                       ← (reserved for shared OKF helpers)
│   ├── shot/                      ← shot: ls / find / search / replace
│   ├── sync/                      ← generic engine (UUID + last_edited_time)
│   ├── platforms/
│   │   ├── notion/                ← page / database / search / blocks / …
│   │   └── lark/                  ← API stub
│   └── utils/                     ← paths / sanitize / walk / frontmatter
├── bin/okfa                       ← executable shim
├── skills/                        ← Claude Code Skills
│   ├── okfa-init/SKILL.md
│   ├── okfa-sync-notion/SKILL.md
│   ├── okfa-sync-lark/SKILL.md
│   └── okfa-shot/SKILL.md
├── templates/cron-schedule.md     ← recipe for scheduled syncs
├── docs/                          ← multilingual READMEs (this file is EN)
│   ├── README_EN.md               ← source-of-truth EN copy
│   ├── README_ZH_CN.md            ← 简体中文
│   ├── README_ZH_TW.md            ← 繁體中文
│   └── README_JA.md               ← 日本語
├── CLAUDE.md                      ← agent instructions (for Claude Code)
├── AGENTS.md                      ← symlink to CLAUDE.md
└── README.md                      ← this file
```

## Development

```bash
pnpm install
pnpm typecheck
pnpm build
node dist/okfa --help
```

Or run from source without building:

```bash
pnpm start -- --help
```

To update the bundled Skills after editing the markdown, no rebuild is
required — they are read at runtime by Claude Code.

## References

- Google OKF: https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing
- Notion Personal Access Tokens: https://developers.notion.com/guides/get-started/personal-access-tokens

## License

MIT.
