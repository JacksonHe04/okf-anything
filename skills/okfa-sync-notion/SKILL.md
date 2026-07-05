---
name: okfa-sync-notion
description: Sync Notion pages / databases into the local workspace as OKF Markdown. Honors idempotent UUID + last_edited_time semantics. Use whenever the user wants to pull Notion content, refresh an existing mirror, or schedule a recurring sync.
---

# okfa sync notion

This Skill is the canonical way Claude should drive Notion ↔ local sync.
Never touch the Notion API directly — always go through the CLI.

## When to use

- The user asks to pull content from Notion.
- The user asks for a "sync update" / "refresh from Notion".
- The user wants to set up a daily / hourly recurring Notion sync.
- The user moves files around inside their workspace and wants the next
  sync to pick up only the changes — confirm UUID idempotency by reading
  frontmatter.

## How to invoke

```
okfa sync notion [--root <uuid>] [--dry-run]
```

- `--root <uuid>` overrides `notion.state.default_root_id` for this run.
- `--dry-run` lists the diff without writing files.
- Default: incremental (only docs whose `last_edited_time` moved forward).

After the command exits, summarize:

```
scanned   = N
created   = N  (no local copy yet)
updated   = N  (cloud newer than local)
skipped   = N  (unchanged)
failed    = N
```

If `failed > 0`, surface the per-failure messages.

## UUID & idempotency

Each cloud page writes a `notion_id` field into OKF frontmatter. The sync
uses that UUID as the idempotency key, which means:

- The user can freely reorganize local files into other projects.
- Re-running sync will still update the right file even if its path moved.
- We never delete local files when the cloud side deletes.

## Scheduling

To schedule a daily Notion sync, follow the
[`templates/cron-schedule.md`](../../templates/cron-schedule.md) recipe.
Short version for Claude:

> Create a recurring scheduled task in the user's app that runs daily at
> 03:30 local. The task prompt must be self-contained: it should call
> `okfa sync notion` and report scanned/created/updated/skipped/failed.

For Notion, the user must have already granted their Personal Access
Token read access to the pages they want mirrored.

## Token resolution order

`notion.token` (config) → `NOTION_TOKEN` env → fail.
