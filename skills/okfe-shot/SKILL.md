---
name: okfe-shot
description: moonshot: local OKF Markdown query / mutate engine. Performs find / search / replace / ls, all respecting the workspace's gitignore-style ignore rules. Use whenever the user wants to look up, edit, or list markdown files in their workspace.
---

# okfe shot

The moonshot engine is what makes this workspace a Knowledge Base that an
AI Agent can drive. Always use `okfe shot`, never raw `grep` / `find` /
filesystem walks, so the agent respects:

- the `.okfe/config.yaml`'s `ignore` field
- the `.okfeignore` file at the workspace root
- OKF frontmatter semantics (matching by field, by UUID, by title, etc.)

## Subcommands

### `okfe shot ls`

Streams every `.md` file path under the workspace.

### `okfe shot find <field> [--eq <v>] [--contains] [--regex]`

Exact-lookup frontmatter field. Examples:

```
okfe shot find notion_id --eq 7c2e...
okfe shot find status
okfe shot find tag --contains docs --regex
```

### `okfe shot search <query> [--regex] [--ignore-case] [--files-only] [--limit N]`

Full-text search across bodies. Defaults to using the system `rg` binary
when available (faster); falls back to an in-process scan otherwise.

### `okfe shot replace [--field <k>] [--pattern <p>] [--to <v>] [--from <v>] [--match <v>] [--in-string] [--regex] [--apply]`

Batch edits. **By default, dry-run**: shows what would change without
writing. Pass `--apply` to commit changes to disk.

Two modes:

- Frontmatter: `--field <k> --from <v> --to <v>` rewrites the value (with
  `--in-string` it does substring replacement).
- Body: `--pattern <p> --to <v>` replaces substring; pass `--regex` for
  regex.

## Ignoring patterns

All subcommands honor the same ignore matcher as `okfe sync`. To
exempt a directory from search entirely (e.g., legacy dumps), add it to
the workspace `.okfeignore`.

## When to prefer

| Ask | Subcommand |
|---|---|
| "Find all Notion docs tagged `status: archived`" | `shot find status --eq archived` |
| "Where did I write about X?" | `shot search X --ignore-case` |
| "Rename the project from `PALM` to `Palm` everywhere in the frontmatter" | `shot replace --field title --from PALM --to Palm --in-string --apply` |
| "List every doc synced from Notion last week" | `shot find notion_id --regex .` |
