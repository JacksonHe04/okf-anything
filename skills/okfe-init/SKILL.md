---
name: okfe-init
description: Bootstrap a okfe workspace (.okfe/config.yaml) at a directory. Use when the user wants to start using okfe in a folder, or asks where to put their Notion / Lark content.
---

# okfe init

When the user wants to set up an okfe workspace, run:

```
okfe init <dir>
```

Default `<dir>` is `~/iNon`. The command creates `<dir>/.okfe/config.yaml`
with safe defaults and prints next steps.

After init, suggest:

1. Edit the YAML to fill in `notion.token` / `lark.token` (or point the user
   at `NOTION_TOKEN` / `LARK_APP_ID`+`LARK_APP_SECRET` env vars).
2. Set `notion.state.default_root_id` to the UUID of the Notion page they
   want to mirror.
3. Run `okfe sync notion` to do the first sync.
4. Run `okfe shot ls` to confirm the workspace is browsable.

If the user already has a workspace and just wants to re-init, pass
`--force` to overwrite the YAML.
