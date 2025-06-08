# Discord Bot Scaffold

A CLI-generated Discord bot in TypeScript with domain-based modular structure.

For a high level setup walkthrough and command reference targeted at server owners and moderators see [docs/client_guide.md](docs/client_guide.md).


## Quickstart

```bash
pnpm install
pnpm exec prisma generate
pnpm run dev
```

## Prerequisites
Running the full test suite requires several runtimes:

- **Node.js** with `pnpm` available in your `PATH`
- **Rust** (`cargo` command)
- **Python 3** with `pytest`

## Add a new command
Add a file to `src/domains/{domain}/commands/`, then run:

```bash
pnpm run deploy
```

## Flags
- `--minimal`: Minimal bot (no services, middleware, or handler)
- `--with-prisma`: Add Prisma support (PostgreSQL)
- `--with-mongo`: Add MongoDB support

## Prisma Client
Generate the Prisma client after editing `prisma/schema.prisma`:

```bash
pnpm exec prisma generate
```

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
`.env.example` file. For deployment steps consult `docs/deployment.md`.
Advanced gas settings, Flashbots integration and batch minting are documented in
[`docs/advanced_minting.md`](docs/advanced_minting.md).

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

Additional options:
- `GAS_MULTIPLIER` adjusts gas fees for replacement transactions (default `1.2`). Increase this value if replacement transactions are frequently underpriced.
- `MINT_MAX_RETRIES` sets how many times the bot will attempt a failed mint before giving up (default `2`).
- `USE_FLASHBOTS` routes transactions through Flashbots for private bundle submission. Enable when you want MEV protection or to bypass the public mempool.
- `DETECTION_SCORE_THRESHOLD` defines the minimum score required before a detection opportunity is emitted (default `1`).
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

## Monitoring
When `ENABLE_PERFORMANCE_MONITORING` is `true`, a Prometheus metrics endpoint is
exposed at `/metrics` on the port defined by `METRICS_PORT` (default `9090`).



## Running Tests
The test suite relies on dev dependencies such as `ts-node`.

Generate the Prisma client first:

```bash
pnpm exec prisma generate
```

The `scripts/run-tests.sh` script will run `pnpm install` (or `npm ci`) when
`node_modules` is missing, generate the Prisma client, and then execute the
TypeScript, Rust and Python tests.
If `cargo` or `pytest` are not available they are skipped gracefully:

```bash
pnpm run test
```


## Queue Limits
The mint queue will hold at most `MAX_QUEUE_SIZE` requests per priority
(defaults to `1000`). When a queue is full, calls to `add()` return `false`
and emit an `error` event.
Detection opportunities are emitted when a project's score meets `DETECTION_SCORE_THRESHOLD` (default `1`).
