---
name: okfa-sync-lark
description: Sync Lark / Feishu docs into the local workspace as OKF Markdown. Status: v1 stub (no-op). Reads existing lark_id-keyed files. Use whenever the user wants to mirror Lark content; surface TODO when the cloud walker is not yet implemented.
---

# okfa sync lark

⚠ v1 status: cloud listing & body fetch are stubbed. Calling `okfa sync
lark` today is a no-op (with a warning). Local files under
`<root>/lark/` continue to be respected by other commands (`shot find`,
`shot search`, etc.).

## How to invoke

```
okfa sync lark [--root <uuid>] [--dry-run]
```

The CLI honors the same `--root` / `--dry-run` semantics as Notion.

## When to use

- The user wants to pull content from Lark / Feishu docs.
- The user has been waiting for the Lark surface and asks whether it
  works yet. **Always** run the CLI first, then explain that v1 returns
  no cloud items because the wiki walker is not wired up.

## Token resolution order

`lark.token` (config, value is `appId:appSecret`) →
`LARK_APP_ID` + `LARK_APP_SECRET` env → fail.

## Future work

Wire up:

- `client.users.getCurrentUser` for the active user identity.
- `wiki.v2.space.listNode` to enumerate the target space.
- `docx.v1.document.rawContent` for body content.
- `docx.v1.document.get` for `last_edited_time`.

Until that's done, treat Lark as read-only local with the existing files.
