<h1 align="center">MOON ESCAPE</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Google-OKF_v0.1-4285F4?logo=google&logoColor=white" alt="Google OKF" />
  <img src="https://img.shields.io/badge/Notion-Integration-000000?logo=notion&logoColor=white" alt="Notion Integration" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm&logoColor=white" alt="pnpm workspaces" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT" />
</p>

<p align="center">
  <a href="../README.md">简体中文</a> | English | <a href="README_JA.md">日本語</a> | <a href="README_ZH_TW.md">繁體中文</a>
</p>

<br>

> *They told us to aim for the Moon.*
> *We did. We put everything up there—*
> *our notes, our thoughts, our years of work—*
> *on someone else's servers, in someone else's client, behind someone else's paywall.*
>
> *Now the servers are slow. The seats cost more.*
> *And we're still up there, floating,*
> *wondering how to come home.*

<br />

***

Once upon a time, **Moonshot** was an exciting word.

John F. Kennedy said in 1962, "We choose to go to the Moon, not because it is easy, but because it is hard." \
Later, this word was borrowed by Internet companies. \
Every SaaS product launch was a Moonshot. \
Every cloud note tool was your "first step to the future."

So we moved our notes up there. Moved our documents up there. Moved our knowledge up there. \
Notion, Lark, Yuque—they caught us, gave us beautiful interfaces, smooth experiences, and monthly-billed seats.

Then one day, you wanted to get your things back.

Only to find out: **it's easy to go up, but hard to come down.**

***

**MOON ESCAPE** is a door—opened right from the Moon.

It streams your entire workspace from Notion / Lark / Yuque to your local machine, \
writing it as Markdown conforming to **Google OKF (Open Knowledge Format)**, \
preserving every parent-child relationship, database row, and custom property. \
Then you can open, edit, and search directly in your browser—no account needed, no client required.

Your knowledge, no longer subject to a monthly seat fee.

<br />

***

## Platform Integration

| Platform | Directory | Status | Notes |
| --- | --- | --- | --- |
| **Notion** | [`bye-bye-notion/`](../bye-bye-notion/) | ✅ Available | The only fully implemented platform; 2025 Multi-Data Source, block_id inline page, p-queue rate limiting, budgeted path map are all in place |
| Lark (飞书) | [`bye-bye-lark/`](../bye-bye-lark/) | 🚧 Initialized | Directory created, code to be implemented |
| Yuque (语雀) | [`bye-bye-yuque/`](../bye-bye-yuque/) | 🚧 Initialized | Directory created, code to be implemented |

The three platforms share the root directory's [`moon-escape/common/`](../moon-escape/common/) — path resolution, filename sanitization, conflict allocation, frontmatter reading/writing are all platform-independent, leaving reuse space for Lark / Yuque.

***

## Project Structure

```
moon-escape/
├── pnpm-workspace.yaml        # pnpm workspaces config (packages: ['.', 'web'])
├── moon-escape/common/                # Cross-platform shared tools (platform independent)
│   ├── paths.ts               # Resolve --export-dir / MOON_ESCAPE_EXPORT_DIR / ~/iNon/Wiki/
│   ├── sanitize.ts            # Filename sanitization (replace invalid characters)
│   ├── path-allocator.ts      # Conflict suffix allocation (X.md → X-1.md → X-2.md)
│   ├── frontmatter.ts         # YAML frontmatter read/write
│   ├── safe-call.ts           # try/catch error tolerance wrapper
│   └── count-md.ts            # Recursively count .md files
│
├── bye-bye-notion/            # Notion pull implementation (Core)
│   ├── src/
│   │   ├── main.ts            # Main flow: CLI → searchAll → Budgeted Path Map → stream recursion
│   │   ├── limiter.ts         # p-queue 3 req/s + 429/5xx backoff retry
│   │   └── notion/            # Notion SDK wrapper
│   │       ├── client.ts      # dotenv + @notionhq/client (v2026-03-11)
│   │       ├── search.ts      # Full searchAll (page + data_source)
│   │       ├── page.ts        # retrievePage metadata
│   │       ├── database.ts    # 2025 Model: data_source.retrieve + query
│   │       ├── blocks.ts      # BFS block tree pull (maxDepth=20)
│   │       ├── ancestor.ts    # block_id → page_id ancestor index (inline page restoration)
│   │       ├── budget.ts      # Budgeted Path Map (top-down BFS solving final localPath)
│   │       └── markdown.ts    # block tree → markdown (includes mention rewriting)
│   ├── scripts/               # One-off diagnostic/validation scripts (dry-run, validate, verify-*)
│   └── docs/                  # Migration design + Notion API field docs
│
├── bye-bye-lark/              # Lark pull (To be implemented)
├── bye-bye-yuque/             # Yuque pull (To be implemented)
│
├── web/                       # Local OKF Web Editor
│   ├── src/
│   │   ├── app/page.tsx       # Three-pane layout (File tree / Editor / PageProperties)
│   │   ├── components/        # editor (Tiptap) / file-tree / page-properties / search
│   │   ├── hooks/             # useDirectory / useFileTree / useAutoSave / useSearchIndex
│   │   └── lib/               # fs-access / frontmatter / markdown-serde / double-link / search-index / db
│   └── docs/                  # Design docs + TODOs
│
├── okf/docs/                  # Google OKF Specification (OKF.md original + OKF_CN.md Chinese translation)
├── docs/                      # Project documentation
│   ├── README_EN.md           # English README (More detailed user perspective)
│   └── superpowers/
│       ├── specs/             # Web Editor v1/v2/v3 design specifications
│       └── plans/             # Corresponding implementation plans
│
├── AGENTS.md                  # → CLAUDE.md
└── CLAUDE.md                  # Project Guidelines: Notion field mapping + pull strategy + 3 golden rules
```

***

## Features

### Puller (bye-bye-notion)

- **Streaming pull with ID idempotency** — Pull and write incrementally, no data lost on network failure/crash; skips already exported subtrees by `notion_id` on rerun.
- **Full support for Notion 2025 model** — Database containers + multi-data sources, `block_id` parent pages, and flattened custom properties are all mapped to OKF YAML.
- **Budgeted Path Map** — Even if a child page is not pulled yet, parent pages can write correct relative paths in `## Children` lists during rendering.
- **Rate limiting + Backoff** — `p-queue` 3 req/s + `Retry-After` parsing + 5xx exponential backoff + jitter.
- **Output conforms to OKF v0.1** — YAML frontmatter + parent-child directory structure, directly renderable on GitHub, readable by any LLM Agent.

### Web Editor (web/)

- **File System Access API directory selector + IndexedDB handle persistence** — Select once, restore automatically on subsequent loads; reauth button provided if permission expires.
- **Three-pane layout** — Left file tree / Middle Tiptap rich text / Right PageProperties.
- **PageProperties Panel** — `js-yaml` parses the 11 OKF fields (6 OKF + 5 Notion), unknown fields are passed through without loss.
- **Markdown relative path double-link navigation** — Cmd/Ctrl + click, resolves cross-level paths outside the editor using `getFileHandleByPath`.
- **Global Search (MiniSearch + Cmd/Ctrl+K)** — Chinese 2-gram + English space tokenization, recursively scans subdirectories.
- **5s debounce auto-save + status indicator** — Mutex lock prevents concurrent writes, Cmd/Ctrl+S saves immediately.
- **File/Folder CRUD** — Context menu for creating, renaming, and deleting; `-1` suffix auto-allocation to prevent collisions.

***

## Quick Start

### 0. Installation

```bash
pnpm install
```

Copy `.env.example` and paste your TOKEN.

### 1. Preview Pull Plan First (Dry-run, no disk writes)

```bash
pnpm dry-run --root <page-uuid> [--root <page-uuid>...]
```

Reads from Notion only, prints the subtree as a markdown list to stdout without writing any files. `<page-uuid>` accepts 32hex / 8-4-4-4-12 / notion.so URL formats.

### 2. Actual Pull (Streaming write to disk)

```bash
pnpm start --root <page-uuid>
```

Writes to disk immediately upon scanning each page/database; any successfully scanned content remains in the export directory if it crashes. Rerunning will skip the already exported subtree based on `notion_id`—to force re-exporting a specific subtree, simply delete its corresponding `.md` file or directory.

Available scripts (after a single `pnpm install`):

| Command | Action |
| --- | --- |
| `pnpm start` | Start Notion streaming pull |
| `pnpm dry-run` | Read-only preview, no disk writes |
| `pnpm typecheck` | `tsc --noEmit` (covers src + bye-bye-notion/src + bye-bye-notion/scripts) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm web` | Start Web Editor (`next dev`) |
| `pnpm web:build` | Build Web Editor production bundle |

Sub-package commands can also be run directly by going into `web/` and running `pnpm dev` / `pnpm test`, pnpm workspaces will automatically hoist dependencies.

### 3. Customize Export Directory

By default, contents are written to `~/iNon/Wiki/` (created automatically on first run). To change the path:

```bash
# Command line flag
pnpm start --root <id> --export-dir /path/to/wiki

# Or environment variable (suitable for shell alias / CI)
MOON_ESCAPE_EXPORT_DIR=/path/to/wiki pnpm start --root <id>

# The ~ in the path will be automatically expanded to $HOME
pnpm start --root <id> --export-dir '~/Documents/wiki'
```

Resolution precedence: `--export-dir` flag → `MOON_ESCAPE_ESCAPE_DIR` environment variable → `~/iNon/Wiki/` default value.

> Rerunning `pnpm start` after moving will automatically reuse files based on `notion_id` (won't rewrite existing files).

### 4. Edit in Browser

```bash
pnpm web
# Open http://localhost:3000/
```

Select `~/iNon/Wiki/` directory → Grant read/write permissions → Left file tree → Middle Tiptap rich text → Right PageProperties (11 fields card) → `Cmd/Ctrl+S` to save immediately / auto-saves after 5 seconds / `Cmd/Ctrl+K` for global search.

Requires a Chromium-based browser (File System Access API); other browsers will report an `unsupported` status upon loading.

***

## Further Reading

### Design and Specifications

- **OKF Specification** —— [`okf/docs/OKF_CN.md`](../okf/docs/OKF_CN.md) (Chinese translation, sourced from Google Cloud Blog 2026-06)
- **Notion Field Mapping** —— [`bye-bye-notion/docs/`](../bye-bye-notion/docs/) (PAGE / DATABASE / PAGE_PROPERTIES / NOTION_PAT)

### References

- OKF (Open Knowledge Format, Google Cloud, 2026-06): <https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing>
- OKF Example Bundle: <https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf>
- Notion PAT: <https://developers.notion.com/guides/get-started/personal-access-tokens>
- File System Access API: <https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API>

***

## Code Check & Testing

```bash
# Root directory TypeScript check (covers src + bye-bye-notion/src + bye-bye-notion/scripts)
pnpm typecheck

# Web Editor unit tests (vitest + happy-dom + fake-indexeddb)
pnpm --filter web test

# One-off diagnostics (Notion side, tsx is already in devDeps)
pnpm exec tsx bye-bye-notion/scripts/validate.ts          # Compares 4 root subtrees vs local .md
pnpm exec tsx bye-bye-notion/scripts/verify-ids.ts        # Verifies notion_id for each .md file
pnpm exec tsx bye-bye-notion/scripts/verify-ancestor-index.mts  # Verifies inline page restoration
```

***

## Package Management (pnpm workspaces)

The project uses **pnpm workspaces** to manage the monorepo:

- The root `pnpm-workspace.yaml` declares `packages: ['.', 'web']`
- Shares the root `pnpm-lock.yaml`, deduplicating dependencies and speeding up installation
- Sub-package commands can be run uniformly using `pnpm --filter <pkg> <cmd>` or directly inside the sub-package directory
- `.pnpm-store/` (if using global store) has been excluded in `.gitignore`

***

<br />

*We chose to go to the Moon.*\
*Now we choose to leave.*\
*Not with fanfare. Just quietly,*\
*with our notes tucked under one arm,*\
*walking back down.*
