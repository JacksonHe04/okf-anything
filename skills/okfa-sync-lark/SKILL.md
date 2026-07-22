---
name: okfa-sync-lark
description: Sync Lark / Feishu docs into the local OKF workspace as Markdown. Uses the `lark-cli` binary under the hood (auth, scope, API marshalling). Idempotent via `lark_id`; produces OKF frontmatter with `inon_id`, `lark_id`, `lark_obj_token`, `lark_obj_type`, `lark_space_id`, `lark_parent_type`, `lark_parent_id`, and `tags`.
---

# okfa sync lark

Incremental pull + update from Lark/Feishu docs into the local OKF
Markdown workspace. Backs onto the `lark-cli` binary — auth, scopes,
API marshalling, and pagination all live there. okfa just orchestrates
the calls and renders OKF frontmatter.

## How to invoke

```
okfa sync lark [--root <spec>] [--dry-run]
```

- `--root <spec>` (optional) overrides the configured root for this
  run. Accepts:
  - `my_library` — your personal document library
  - a numeric `space_id` — a single wiki space
  - a comma-separated list of any of the above
  - a Lark URL containing a space / node id

  Defaults to `lark.state.default_root_id` in
  `<root>/.okfa/config.yaml`. If unset, falls back to `my_library`.

- `--dry-run` — list the cloud tree without writing.

Output lands in `<root>/Wiki/lark/wiki/<knowledge-base>/...` for team Wiki,
`personal/<owner>/...` for the personal library and standalone Drive objects,
and `minutes/` for Minutes. Binary/structured snapshots land beside their OKF
file in `<name>.assets/`. Personal content is grouped by person, never by
technical object type.

The default run pulls every visible Wiki space, every paginated Drive Search
result, and all searchable Minutes. Duplicate Wiki/Drive hits are merged by
their underlying object token.

Content handling is type-aware:

- `docx`: Markdown body via `docs +fetch`
- `doc`: Markdown export
- `bitable`: searchable table Markdown plus `.base` snapshot
- `sheet`: `.xlsx` snapshot
- `slides`: `.pptx` snapshot
- `mindnote`: Markdown node tree
- `file`: original bytes

## Auth

`okfa sync lark` does NOT read `lark.token` or `LARK_APP_ID` /
`LARK_APP_SECRET` directly. Auth is delegated to `lark-cli`:

```
lark-cli auth login          # interactive device-flow login
lark-cli auth status         # confirm user identity
```

If the user is not logged in, `okfa sync lark` exits immediately with
an actionable error.

## One-shot migration

If you have pre-2026-07 Lark docs in your workspace, run:

```
okfa lark migrate-frontmatter          # dry-run; shows every file
okfa lark migrate-frontmatter --apply  # write to disk
```

This rewrites legacy fields:

- `lark_node_token` → `lark_id`
- `lark_parent_node_token` → `lark_parent_id`
- back-fills `lark_parent_type: "wiki"`

Other keys (`lark_obj_token`, `lark_obj_type`, `lark_space_id`,
`tags`, `inon_id`) are preserved. The migration is idempotent.

## Field reference

Each Lark doc emitted by the syncer carries:

```yaml
type: Lark Document         # or Lark Minute
source: lark
title: <node title>
resource: <feishu.cn URL>
inon_id: <CLI-minted UUID; preserved across updates>
created_time: <RFC3339>
last_edited_time: <RFC3339>
lark_id: <node_token or minute token>
lark_obj_token: <docx/file token>
lark_obj_type: doc | docx | sheet | bitable | slides | mindnote | file | minutes
lark_space_id: <wiki space id>      # null for minutes
lark_parent_type: wiki | minutes
lark_parent_id: <parent node_token> # null for roots
tags: [Lark, lark-<space-slug>]
```

## When to use

- The user wants to pull content from Lark/Feishu.
- The user asks "sync my library" / "pull my personal wiki" / "fetch
  this Lark doc by URL".
- New Lark content appears between scheduled syncs and the user wants
  the workspace current.

## When NOT to use

- The user is on a machine without `lark-cli` installed. Install it
  first (`npx @larksuite/cli install`).
- The user wants to **edit** Lark content. okfa is read-only — never
  call write APIs against Lark from this tool.
