# mookf design notes

Long-form, single-source-of-truth for the design choices that don't fit
into a README.

## Why a CLI

Two reasons:

1. **Installable artifact**. `npm i -g @mookf/cli` is a familiar
   distribution path; the user doesn't pull a git repo with a bunch of
   adjacent dashboards they don't want.
2. **Process boundary**. Skill → CLI separates "what to do" from "how
   to do it." The CLI is testable in isolation; the Skill is just a
   prompt that calls into the CLI.

## Why a single Workspace

The user wanted their documentation to coexist with source code in the
same project trees. Two consequences:

1. Identifiers must be **stable across relocation** — hence the
   `notion_id` / `lark_id` frontmatter keys.
2. The engine must tolerate a workspace with non-doc files (code, PDF,
   images) — hence the explicit `ignore` matcher, plus the convention
   that `mookf sync` only ever writes into `<root>/<platform>/`.

## Why gitignore-style ignore

Mature, de-facto, supported by an industry-grade matcher
(`ignore` on npm). We piggy-back rather than reinvent.

## Why no RAG yet

Per the user's directive (2026-07-05): "暂不需要做 RAG, 而是用最新的 OKF
的方式去实现类似 OpenViking 的效果."

- YAML field addressability is enough for ~all known queries.
- `mokf shot find --field <k>` is O(N) but with cheap frontmatter
  reads, even at 100k docs this completes in seconds on a laptop.
- Adding an inverted index later is incremental: `shot search` can
  transparently switch to an `rg`-style pre-built index when present.

## Why UUID id, not path

A path-based id would break the user's ability to reorganize the
workspace. A UUID id in frontmatter stays with the doc across moves
and survives an out-of-band `git mv`.

## Why stream writes (backwards compatibility)

The legacy `bye-bye-notion` already implemented partial-write resilience:
write a doc the moment it's complete rather than batch at the end. We
preserve this so a Ctrl-C mid-run still leaves the user with a
consistent tree up to that point.

## Status of Lark

`lark/` is a stub on purpose: the user wants to ship the CLI surface
*now* and fill in the Lark API walker in a follow-up. Important
guarantees already in place:

- `mookf sync lark` runs without throwing on missing config.
- `mookf shot *` reads `lark_id`-keyed frontmatter happily.
- The TODO surface is documented in `skills/mookf-sync-lark/SKILL.md`
  so the next engineer can find it.
