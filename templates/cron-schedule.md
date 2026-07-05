# okfe scheduled sync — Claude Code prompt template

This file is the canonical recipe for scheduling a recurring platform
sync with Claude Code. Use it as a template — every place marked `<…>`
must be filled in by Claude based on context the user supplied.

---

## Notion

> Create a recurring scheduled task that runs every day at **03:30 local
> time**. Task ID: `okfe-daily-sync-notion`. Description: "Daily Notion
> sync into the local workspace." The prompt the task should run
> each time is the following self-contained message — the spawned session
> has no prior context, so spell everything out:
>
> ---
> Sync the user's Notion workspace into their local workspace.
>
> 1. Confirm `okf-everything` is installed: `which okfe || pnpm add -g @inon-ai/okf-everything`.
> 2. Confirm a workspace exists: `okfe config root` (exit non-zero → run
>    `okfe init` first).
> 3. Run `okfe sync notion` from the workspace root.
> 4. Report the diff counts (scanned / created / updated / skipped /
>    failed). If failed > 0, list per-file errors.
> 5. Do not edit any cloud-side resources.
>
> If the user has not provided a Notion token yet, prompt them to add
> `notion.token` to `.okfe/config.yaml` (or set `NOTION_TOKEN` in env)
> and stop.

## Lark

> Identical structure, except substitute:
>
> 1. Subcommand `okfe sync lark` instead of `notion`.
> 2. Token: `lark.token` in config (`appId:appSecret`) or
>    `LARK_APP_ID` + `LARK_APP_SECRET` env.
> 3. Acknowledge that v1 Lark returns a no-op until the wiki walker is
>    shipped; surface the warning, do not treat it as a failure.

---

## Both platforms (combined daily)

> Create a recurring scheduled task that runs every day at **03:30 local
> time**. Task ID: `okfe-daily-sync-all`. Description: "Daily Notion +
> Lark sync into the local workspace." Per-run prompt:
>
> ---
> Run the user's daily okfe sync.
>
> 1. `okfe config root` (warm-up; resolve workspace).
> 2. `okfe sync notion` and capture its diff counts.
> 3. `okfe sync lark` and capture its diff counts.
> 4. Emit a unified summary; if both have failed=0, end with `OK`.
>    Otherwise list which platform failed and the first 3 errors.
>
> Never call the upstream platforms' APIs directly. Always go through
> `okfe sync` so the CLI can keep UUID ↔ path idempotency intact.
