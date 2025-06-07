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

## Rust Mint Bot
The repository contains a Rust crate located at `src/modules/nft_mint_bot` used for
fast NFT minting. Build it with:

```bash
cargo build --release -p nft_mint_bot
```

After building, the `/mint-fast` Discord command will execute the compiled binary
to perform a mint.

## Extra Web3 Commands
- `/connect-wallet` – demo wallet connection
- `/get-balance` – fetch ETH balance for an address
- `/mint-fast` – call the Rust mint bot

Made with ⚡ by [@wavedidwhat](https://x.com/wavedidwhat)
