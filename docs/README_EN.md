<h1 align="center">iMon</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Google-OKF_v0.1-4285F4?logo=google&logoColor=white" alt="Google OKF" />
  <img src="https://img.shields.io/badge/Notion-Integration-000000?logo=notion&logoColor=white" alt="Notion Integration" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white" alt="Next.js" />
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

**iMon** is a door opened from the Moon—but coming home is not a single step.

It is composed of **three core modules** stitched into a single path back to yourself:

| Module | Responsibility | Lives in |
| --- | --- | --- |
| **ESCAPE** | Pull trapped content off the cloud, write it as OKF Markdown | `moon-escape/` (`bye-bye-notion`, etc.) |
| **MOON** | The local "surface" where pulled knowledge lives and gets edited | `moon-app/` |
| **SHOT** | Make local knowledge useful—retrieval, RAG, Agent API | `moon-shot/` |

**ESCAPE** is the act of leaving—breaking free from the orbits of Notion / Lark / Yuque. \
**MOON** is the landing—parking the knowledge on your own disk, editing in the browser. \
**SHOT** is the launch—turning dormant `.md` files into something agents and RAG pipelines can actually consume.

All three modules share one contract: **Google OKF (Open Knowledge Format)**. \
ESCAPE writes it. MOON edits it. SHOT consumes it.

Your knowledge, no longer subject to a monthly seat fee.

<br />

***

## The Three Modules

### 🚀 ESCAPE — Leave the Cloud

`moon-escape/` streams your cloud workspaces to local disk, writing them out as OKF-compliant Markdown. It itself splits into two layers:

- **`moon-escape/common/`** — Cross-platform shared utilities (path resolution, filename sanitization, conflict allocation, frontmatter I/O, error tolerance, counting). Platform-independent.
- **`bye-bye-<platform>/`** — One implementation per cloud platform:

| Platform | Directory | Status |
| --- | --- | --- |
| **Notion** | [`bye-bye-notion/`](../bye-bye-notion/) | ✅ Available |
| Lark (飞书) | [`bye-bye-lark/`](../bye-bye-lark/) | 🚧 Initialized |
| Yuque (语雀) | [`bye-bye-yuque/`](../bye-bye-yuque/) | 🚧 Initialized |

Notion is currently the only fully implemented platform—2025 Multi-Data Source, `block_id` inline page, `p-queue` rate limiting, and the Budgeted Path Map are all in place. Lark and Yuque will reuse `common/` when their implementations land.

> **The current repo's `moon-escape/`** hosts the root `bye-bye` package, so `start` / `dry-run` actually run `bye-bye-notion`.

### 🌕 MOON — Local Editor

[`moon-app/`](../moon-app/) is the local OKF Web editor that runs in your browser.

- File System Access API directory selector + IndexedDB handle persistence — pick once, restore automatically
- Three-pane layout: left file tree / middle Tiptap rich text / right PageProperties
- 11-field OKF panel (6 OKF + 5 Notion), unknown fields pass through without loss
- Relative-path double-link navigation (`Cmd/Ctrl + click`) + global search (`Cmd/Ctrl + K`, MiniSearch, Chinese 2-gram + English space tokenization)
- 5s debounce auto-save + `Cmd/Ctrl+S` for instant save
- File/folder CRUD with `-1` suffix auto-allocation against collisions

Requires a Chromium-based browser; other browsers will show an `unsupported` state on load.

### 🎯 SHOT — Knowledge Engine / Agent API

[`moon-shot/`](../moon-shot/) is the engine that re-launches local OKF knowledge—making it usable by Agents, RAG pipelines, and retrieval.

Roadmap capabilities:

- **Dense Vector Search (RAG)** — chunk local Markdown, retrieve via semantic embeddings
- **Sparse Full-Text Search** — MiniSearch keyword recall
- **Spaces Map & Dependency Graph** — treat relative-path Markdown double-links as graph edges
- **Agent API Services** — JSON endpoints for keyword/semantic queries, context-ring retrieval, stats, planet-map layouts, summarization

`moon-shot/okf/docs/` also hosts the **Google OKF specification** (`OKF.md` original + `OKF_CN.md` Chinese translation)—OKF is the contract threading all three modules together: ESCAPE writes it, MOON edits it, SHOT consumes it.

***

## Project Structure

```
moon-escape/                            # root (pnpm workspace)
├── pnpm-workspace.yaml                 # packages: ['.', 'moon-app', 'moon-shot']
├── package.json                        # bye-bye root pkg: start / dry-run / typecheck / web
│
├── moon-escape/                        # ━━━ ESCAPE module ━━━
│   ├── common/                         #   cross-platform shared tools (platform-independent)
│   │   ├── paths.ts                    #     --export-dir / MOON_ESCAPE_EXPORT_DIR / ~/iNon/Wiki/
│   │   ├── sanitize.ts                 #     filename sanitization
│   │   ├── path-allocator.ts           #     conflict suffix allocation (X.md → X-1.md)
│   │   ├── frontmatter.ts              #     YAML frontmatter read/write
│   │   ├── safe-call.ts                #     try/catch error tolerance wrapper
│   │   └── count-md.ts                 #     recursive .md count
│   ├── bye-bye-notion/                 #   ✅ Notion puller (core)
│   │   ├── src/
│   │   │   ├── main.ts                 #     CLI → searchAll → Budgeted Path Map → stream recursion
│   │   │   ├── limiter.ts              #     p-queue 3 req/s + 429/5xx backoff retry
│   │   │   └── notion/                 #     Notion SDK wrappers
│   │   │       ├── client.ts           #       dotenv + @notionhq/client
│   │   │       ├── search.ts           #       full searchAll (page + data_source)
│   │   │       ├── page.ts             #       retrievePage metadata
│   │   │       ├── database.ts         #       2025 Model: data_source.retrieve + query
│   │   │       ├── blocks.ts           #       BFS block tree pull (maxDepth=20)
│   │   │       ├── ancestor.ts         #       block_id → page_id ancestor index
│   │   │       ├── budget.ts           #       Budgeted Path Map (top-down BFS)
│   │   │       └── markdown.ts         #       block tree → markdown (mention rewriting)
│   │   ├── scripts/                    #     one-off diagnostic/validation scripts
│   │   └── docs/                       #     migration design + Notion API field docs
│   ├── bye-bye-lark/                   #   🚧 Lark puller (to be implemented)
│   └── bye-bye-yuque/                  #   🚧 Yuque puller (to be implemented)
│
├── moon-app/                           # ━━━ MOON module ━━━
│   ├── src/
│   │   ├── app/page.tsx                #   three-pane layout (file tree / editor / PageProperties)
│   │   ├── components/                 #   editor (Tiptap) / file-tree / page-properties / search
│   │   ├── hooks/                      #   useDirectory / useFileTree / useAutoSave / useSearchIndex
│   │   └── lib/                        #   fs-access / frontmatter / markdown-serde / double-link / search-index / db
│   └── docs/                           #   design docs + TODOs
│
├── moon-shot/                          # ━━━ SHOT module ━━━
│   ├── src/                            #   knowledge engine + Agent API implementation
│   ├── okf/                            #   Google OKF spec & tooling
│   │   ├── docs/                       #     OKF.md original + OKF_CN.md Chinese translation
│   │   ├── scripts/                    #     OKF validation/conversion scripts
│   │   └── CLAUDE.md                   #     SHOT-side guidance
│   └── README.md                       #   module overview (Roadmap + Features)
│
├── docs/                               # project-level docs
│   ├── README_EN.md                    #   English README
│   ├── README_JA.md                    #   Japanese README
│   ├── README_ZH_TW.md                 #   Traditional Chinese README
│   └── superpowers/
│       ├── specs/                      #   Web editor v1/v2/v3 design specs
│       └── plans/                      #   corresponding implementation plans
│
├── AGENTS.md                           # → CLAUDE.md
└── CLAUDE.md                           # project guidance: Notion field mapping + pull strategy + 3 golden rules
```

***

## Data Flow

```
                ┌────────────────────────────────────┐
                │  Notion · Lark · Yuque (the cloud) │
                └──────────────┬─────────────────────┘
                               │
                ┌──────────────▼─────────────────────┐
   🚀 ESCAPE   │  bye-bye-notion / bye-bye-lark / … │
   moon-escape │  searchAll → blocks → OKF markdown  │
                └──────────────┬─────────────────────┘
                               │  ~/iNon/Wiki/*.md  (YAML frontmatter + parent-child dirs)
                               │
                ┌──────────────▼─────────────────────┐
   🌕 MOON     │  moon-app (Tiptap + FS Access API) │
   moon-app    │  three panes / 11-field props / search│
                └──────────────┬─────────────────────┘
                               │  same local .md files
                               │
                ┌──────────────▼─────────────────────┐
   🎯 SHOT     │  moon-shot (RAG + MiniSearch + …) │
   moon-shot   │  vector search / keyword recall /   │
                │  Agent API                          │
                └────────────────────────────────────┘
```

All three modules share the same OKF contract: ESCAPE writes, MOON edits, SHOT reads. Edit once, propagate everywhere.

***

## Features

### 🚀 ESCAPE (`moon-escape/`, currently Notion-oriented)

- **Streaming pull with ID idempotency** — pull and write incrementally; no data lost on network failure/crash; rerun skips already exported subtrees by `notion_id`
- **Full Notion 2025 model support** — Database containers + multi-data sources, `block_id` parent pages, and flattened custom properties all mapped to OKF YAML
- **Budgeted Path Map** — even if a child page isn't pulled yet, parent pages can write correct relative paths in `## Children` lists during rendering
- **Rate limiting + backoff** — `p-queue` 3 req/s + `Retry-After` parsing + 5xx exponential backoff + jitter
- **Cross-platform reuse layer** — `moon-escape/common/` factors path resolution, sanitization, and frontmatter into a platform-independent layer, ready for Lark / Yuque

### 🌕 MOON (`moon-app/`)

- **File System Access API directory selector + IndexedDB handle persistence** — pick once, auto-restore; reauth button if permission expires
- **Three-pane layout** — left file tree / middle Tiptap rich text / right PageProperties
- **PageProperties panel** — `js-yaml` parses the 11 OKF fields (6 OKF + 5 Notion); unknown fields pass through without loss
- **Markdown relative-path double-link navigation** — Cmd/Ctrl + click; `getFileHandleByPath` resolves cross-level paths outside the editor
- **Global Search (MiniSearch + Cmd/Ctrl+K)** — Chinese 2-gram + English space tokenization, recursive subdirectory scan
- **5s debounce auto-save + status indicator** — mutex prevents concurrent writes; Cmd/Ctrl+S saves immediately
- **File/Folder CRUD** — context menu for create/rename/delete; `-1` suffix auto-allocation

### 🎯 SHOT (`moon-shot/`, Roadmap)

- **Dense Vector Search (RAG)** — chunk local Markdown, semantic-embedding retrieval
- **Sparse Full-Text Search** — MiniSearch keyword recall
- **Spaces Map & Dependency Graph** — relative-path Markdown double-links as graph edges
- **Agent API Services** — JSON endpoints for keyword/semantic queries, context-ring retrieval, stats, planet-map layouts, summarization

***

## Quick Start

### 0. Installation

```bash
pnpm install
```

Copy `.env.example` and paste your TOKEN.

### 1. Preview the Pull Plan (dry-run, no disk writes) — ESCAPE

```bash
pnpm dry-run --root <page-uuid> [--root <page-uuid>...]
```

Reads from Notion only, prints the subtree as a Markdown list to stdout without writing any files. `<page-uuid>` accepts 32hex / 8-4-4-4-12 / notion.so URL formats.

### 2. Actually Pull (streaming write to disk) — ESCAPE

```bash
pnpm start --root <page-uuid>
```

Writes to disk immediately upon scanning each page/database; any successfully scanned content remains in the export directory if it crashes. Rerunning will skip the already exported subtree based on `notion_id`—to force re-exporting a specific subtree, simply delete its corresponding `.md` file or directory.

Available scripts (after a single `pnpm install`):

| Command | Action |
| --- | --- |
| `pnpm start` | Start Notion streaming pull (ESCAPE) |
| `pnpm dry-run` | Read-only preview, no disk writes |
| `pnpm typecheck` | `tsc --noEmit` (covers src + bye-bye-notion/src + scripts) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm web` | Start Web Editor (`moon-app`'s `next dev`, i.e. MOON) |
| `pnpm web:build` | Build Web Editor production bundle |

Sub-package commands can also be run directly by going into `moon-app/` and running `pnpm dev` / `pnpm test`, or into `moon-shot/` for its own commands—pnpm workspaces will hoist dependencies automatically.

### 3. Customize Export Directory (ESCAPE)

By default, contents are written to `~/iNon/Wiki/` (created automatically on first run). To change the path:

```bash
# Command line flag
pnpm start --root <id> --export-dir /path/to/wiki

# Or environment variable (suitable for shell alias / CI)
MOON_ESCAPE_EXPORT_DIR=/path/to/wiki pnpm start --root <id>

# The ~ in the path will be automatically expanded to $HOME
pnpm start --root <id> --export-dir '~/Documents/wiki'
```

Resolution precedence: `--export-dir` flag → `MOON_ESCAPE_EXPORT_DIR` environment variable → `~/iNon/Wiki/` default.

> Rerunning `pnpm start` after moving will automatically reuse files based on `notion_id` (no rewrite).

### 4. Edit in the Browser — MOON

```bash
pnpm web
# Open http://localhost:3000/
```

Select `~/iNon/Wiki/` directory → Grant read/write permissions → Left file tree → Middle Tiptap rich text → Right PageProperties (11 fields card) → `Cmd/Ctrl+S` saves immediately / auto-saves after 5 seconds / `Cmd/Ctrl+K` opens global search.

Requires a Chromium-based browser (File System Access API); other browsers will report an `unsupported` status upon loading.

### 5. Expose Local Knowledge to Agents — SHOT

SHOT is currently on the Roadmap; once `moon-shot/src/` lands:

```bash
pnpm --filter moon-shot dev   # boot the knowledge engine / Agent API
```

***

## Further Reading

### Design & Specifications

- **OKF Specification** — [`moon-shot/okf/docs/OKF_CN.md`](../moon-shot/okf/docs/OKF_CN.md) (Chinese translation, sourced from Google Cloud Blog 2026-06). The contract threading ESCAPE / MOON / SHOT together.
- **Notion Field Mapping** — [`bye-bye-notion/docs/`](../bye-bye-notion/docs/) (PAGE / DATABASE / PAGE_PROPERTIES / NOTION_PAT)
- **SHOT Module Notes** — [`moon-shot/README.md`](../moon-shot/README.md)

### References

- OKF (Open Knowledge Format, Google Cloud, 2026-06): <https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing>
- OKF Example Bundle: <https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf>
- Notion PAT: <https://developers.notion.com/guides/get-started/personal-access-tokens>
- File System Access API: <https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API>

***

## Code Check & Testing

```bash
# Root TypeScript check (covers src + bye-bye-notion/src + bye-bye-notion/scripts)
pnpm typecheck

# MOON editor unit tests (vitest + happy-dom + fake-indexeddb)
pnpm --filter moon-app test

# SHOT module commands (added as the Roadmap lands)
pnpm --filter moon-shot test

# One-off diagnostics (ESCAPE / Notion side, tsx is in devDeps)
pnpm exec tsx bye-bye-notion/scripts/validate.ts             # Compares 4 root subtrees vs local .md
pnpm exec tsx bye-bye-notion/scripts/verify-ids.ts           # Verifies notion_id for each .md
pnpm exec tsx bye-bye-notion/scripts/verify-ancestor-index.mts  # Verifies inline page restoration
```

***

## Package Management (pnpm workspaces)

The project uses **pnpm workspaces** to manage the monorepo:

- Root `pnpm-workspace.yaml` declares `packages: ['.', 'moon-app', 'moon-shot']`
- Three modules are independent packages: ESCAPE in the root package, MOON in `moon-app/`, SHOT in `moon-shot/`
- Shared root `pnpm-lock.yaml`, deduplicating dependencies and speeding up installation
- Sub-package commands can be run uniformly using `pnpm --filter <pkg> <cmd>` or directly inside the sub-package directory
- `.pnpm-store/` (if using global store) has been excluded in `.gitignore`

***

<br />

*We chose to go to the Moon.*
*Now we choose to leave.*
*Not with fanfare. Just quietly,*
*with our notes tucked under one arm,*
*walking back down.*