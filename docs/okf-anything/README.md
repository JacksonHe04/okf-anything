# okf-anything

> **MO**(on) + **O**(pen-source) + **K**(nowledge) + **F**ormat —
> a local-first, agent-friendly escape hatch from Notion / Lark.

okf-anything pulls and incrementally **syncs** your Notion (and Lark, in
follow-up) content into a local **OKF (Open Knowledge Format)** Markdown
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
   │  ├── .okfa/config.yaml           │
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
- **No RAG detours** — moonshot's `shot` is grep + YAML fields under
  the hood. Predictable, debuggable, no embeddings to babysit.

## Install

```bash
npm install -g @inon-ai/okf-anything
# or
pnpm add -g @inon-ai/okf-anything
```

After install, `okfa --help` is available. To use bundled Claude Code
Skills, drop `okf-anything/skills/*` into `~/.claude/skills/` (or wherever your
Claude Code Skills live).

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
| `okfa sync lark`      | Same for Lark / Feishu (v1 is a stub — see status below).    |
| `okfa shot ls`        | List all `.md` files in the workspace.                      |
| `okfa shot find`      | Frontmatter field lookup.                                   |
| `okfa shot search`    | Full-text grep across bodies (`rg` when available).         |
| `okfa shot replace`   | Batch frontmatter / body edits. Dry-run by default.         |

Run any command with `--help` for details.

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

## Status

| Surface     | Status             |
|-------------|--------------------|
| Notion pull | ✅ Working.        |
| Notion sync | ✅ Working.        |
| Lark pull   | 🚧 v1 stub.       |
| Lark sync   | 🚧 v1 stub.       |
| moonshot    | ✅ Working.        |

Lark's wiki walker is intentionally left as a follow-up so we can ship
the CLI / Skill surface immediately; the local `lark/` subdirectory is
fully readable by `okfa shot *` and `okfa sync lark` already honors
`--dry-run` semantics.

## Architecture

```
okf-anything/
├── bin/okfa                    # entry shim
├── src/
│   ├── cli.ts                   # commander-style top-level dispatch
│   ├── commands/                # per-subcommand handlers
│   ├── config/                  # .okfa/config.yaml load / save / schema
│   ├── ignore/                  # gitignore-style matcher
│   ├── okf/                     # (reserved for shared OKF helpers)
│   ├── shot/                    # moonshot: ls / find / search / replace
│   ├── sync/                    # generic engine (UUID + timestamp)
│   ├── platforms/
│   │   ├── notion/              # page / database / search / blocks / ...
│   │   └── lark/                # api stub
│   └── utils/                   # paths / sanitize / walk / frontmatter
├── skills/                      # Claude Code Skills (drop into ~/.claude/skills)
├── templates/cron-schedule.md   # recipe for scheduled syncs
└── docs/
```

## Development

```bash
cd okf-anything # only if developing locally; not needed for users
npm install
npm run typecheck
npm run build
node bin/okfa --help
```

## License

MIT.
