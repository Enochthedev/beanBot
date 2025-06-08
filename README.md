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

See `docs/nft_mint_bot.md` for a deeper explanation of the mint bot and how to
extend it. Environment variables can be configured using the included
`.env.example` file.

## Command Restrictions & Info
Commands can be limited to specific channels using `/restrict-command`. Admins
can view the commands available in the current channel with `/info`.

## Moderation Features
- `/report` – members can report misbehaving users. The report is logged and the user is timed out for 10 minutes.
- `/ban-user` – admins can ban a user; the bot also DM's the banned user.
- `/set-modlog` – configure which channel receives moderation logs.
- `/welcome-channel` – choose the channel used for automatic join greetings.

## Extra Web3 Commands
- `/connect-wallet` – start wallet verification
- `/confirm-wallet` – confirm wallet by signature
- `/get-balance` – fetch ETH balance for an address
- `/mint-fast` – call the Rust mint bot
- `/coin-snipe` – attempt to snipe a new token

Made with ⚡ by [@wavedidwhat](https://x.com/wavedidwhat)

## Network Configuration
Set the following environment variables to enable multi-provider failover and WebSocket streaming:

```
PRIMARY_RPC_URL=https://mainnet.infura.io/v3/your_key
SECONDARY_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your_key
TERTIARY_RPC_URL=https://rpc.ankr.com/eth
WEBSOCKET_RPC_URL=wss://mainnet.infura.io/ws/v3/your_key
```

The bot will automatically switch providers on failure and stream new blocks when a WebSocket URL is provided.

## Available Commands
The bot exposes several Discord slash commands:

- `/connect-wallet` - Link a wallet by signing a message
- `/wallet-info` - View your connected wallet
- `/subscription-info` - Check subscription status
- `/projects` - List active mint projects
- `/mint` - Queue a mint request
- `/mint-status` - View your last mint status
- `/cancel-mint` - Cancel a queued request
- `/settings` - View bot settings
