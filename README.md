# mookr

> Local-first escape hatch from Notion / Lark.
> One CLI: `mookf`. Lives at `mookf/`.

This repo is the workspace for the mookf project. The CLI source,
Claude Code Skills, and templates all live under
[`mookf/`](mookf/). Read [`mookf/README.md`](mookf/README.md) first.

## Quickstart

```bash
cd mookf
pnpm install
pnpm build
pnpm start -- --help
```

## Layout

```
mookr/
├── mookf/                  # the @mookf/cli package + skills + templates
├── docs/                   # decision records + design notes (root-level)
├── native/                 # raw user input archive (read-only)
└── CLAUDE.md / AGENTS.md   # project instructions
```

## License

MIT.
