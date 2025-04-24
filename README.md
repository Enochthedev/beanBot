# Discord Bot Scaffold

A CLI-generated Discord bot in TypeScript with domain-based modular structure.

## Quickstart

```bash
pnpm install
pnpm run dev
```

## Add a new command
Add a file to `src/domains/{domain}/commands/`, then run:

```bash
pnpm run deploy
```

## Flags
- `--minimal`: Minimal bot (no services, middleware, or handler)
- `--with-prisma`: Add Prisma support (PostgreSQL)
- `--with-mongo`: Add MongoDB support

Made with ⚡ by [@wavedidwhat](https://x.com/wavedidwhat)
