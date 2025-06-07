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
