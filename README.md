# okf-everything — `@inon-ai/okf-everything`

> **okf-everything** = **MO**(on) + **O**(pen-source) + **K**(nowledge) + **F**ormat.
> Local-first escape hatch from Notion / Lark. One CLI: `okfe`.

This repo is the source tree for the `@inon-ai/okf-everything` npm package and the
accompanying Claude Code Skills. The product lives at the repo root.

## Quickstart

```bash
pnpm install
pnpm build
node dist/okfe --help
```

Or in development (without building):

```bash
pnpm install
pnpm start -- --help
```

## Layout

```
okf-everything/
├── src/                                ← CLI source (TS)
│   ├── cli.ts
│   ├── commands/{init,config,sync,shot}.ts
│   ├── config/                         ← .okfe/config.yaml loader + zod schema
│   ├── ignore/                         ← gitignore-style matcher
│   ├── shot/                           ← moonshot: ls / find / search / replace
│   ├── sync/                           ← generic engine (UUID + last_edited_time)
│   ├── platforms/{notion,lark}/        ← per-platform adapters
│   └── utils/                          ← shared helpers
├── bin/okfe                           ← executable shim
├── skills/                             ← Claude Code Skills
├── templates/cron-schedule.md          ← recipe for scheduled syncs
├── docs/                               ← design + decision records
├── CLAUDE.md / AGENTS.md               ← project instructions
└── README.md                           ← this file
```

`dist/` is the build output (gitignored). After `pnpm build`, run via
`node dist/okfe ...` or install via `pnpm pack` to publish to npm.

## For users

Read [`docs/okf-everything/README.md`](docs/okf-everything/README.md) — that is the user
manual. Project-internal context lives in [`CLAUDE.md`](CLAUDE.md).
Design / decision artifacts (private to you) live in `.agents/docs/`.

## License

MIT.