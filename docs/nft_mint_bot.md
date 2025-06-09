# NFT Mint Bot Developer Guide

This document explains how the Rust based NFT mint bot works and how to extend it.

## Overview
The mint bot is located in `src/modules/nft_mint_bot`. It is a standalone Rust
crate built for speed and concurrency so multiple users can trigger mints via the
Discord command `/mint-fast`.

The command spawns the compiled binary and passes a recipient address. The Rust
code then interacts with your configured contract and performs the mint.

## Building
```bash
# From the repository root
cargo build --release -p nft_mint_bot
```
The resulting binary will be at
`src/modules/nft_mint_bot/target/release/nft_mint_bot` and used by the Discord
command.

## Environment
The bot requires the following variables (see `.env.example`):
- `PRIMARY_RPC_URL` – main WebSocket JSON-RPC endpoint
- `SECONDARY_RPC_URL` / `TERTIARY_RPC_URL` – optional failover endpoints
- `PRIVATE_KEY` – private key used to sign transactions
- `CONTRACT_ADDRESS` – address of the mint contract
- `USE_FLASHBOTS` – when set to `true`, the bot submits transactions through the
  Flashbots relay at `https://relay.flashbots.net` instead of directly to
  `RPC_URL`

- `MINT_BOT_METRICS_PORT` – (optional) port for the Prometheus metrics endpoint

- `GAS_MULTIPLIER` – multiplier applied to gas fees when the TypeScript queue
  submits a transaction.
- `MINT_MAX_RETRIES` – maximum retries for failed mints.
- `USE_FLASHBOTS` – set to `true` to send transactions privately via Flashbots.
- `DETECTION_SCORE_THRESHOLD` – minimum score before an opportunity triggers
  queue processing.

- `MINT_GAS_LIMIT` – **optional** override for the gas limit used when minting

### Tuning Gas Limits
If your contract has complex logic or you notice `out of gas` errors, increase
`MINT_GAS_LIMIT`. Leaving it blank will automatically estimate the gas limit
using your RPC provider.
- `GAS_MULTIPLIER` – multiplier applied to provider fee data when sending transactions


## Adding Logic
Open `src/modules/nft_mint_bot/src/main.rs` and implement your minting logic.
A simple example using `ethers` is included. Feel free to expand it with more
contract calls or gas optimisations.

## Concurrency
Multiple users may trigger `/mint-fast` concurrently. Because the bot spawns a
new process per command, each mint runs isolated and will not block other
commands. Keep your Rust code efficient to maintain fast response times.

## Metrics
The bot exposes Prometheus metrics when `MINT_BOT_METRICS_PORT` is set. The
endpoint is available at `http://localhost:<port>/metrics` and records:

- `tx_latency_seconds` – time from transaction submission to receipt
- `tx_gas_spent` – gas used for the mint
- `tx_errors_total` – number of failed mint attempts

Example:

```bash
cargo run -p nft_mint_bot -- 0xabc...
# In another terminal
curl http://localhost:${MINT_BOT_METRICS_PORT:-9101}/metrics
```

## Related Commands
- `/mint-fast` – triggers the mint bot
- `/restrict-command` – limit a command to a channel
- `/info` – list commands available in the current channel

## Additional Commands

- `/connect-wallet` – prompts a user to sign a challenge proving ownership of their wallet.
- `/confirm-wallet` – verifies the signature produced during `/connect-wallet` and stores the address.
- `/coin-snipe` – invokes `src/modules/coin_sniper/sniper.py` which sends a Uniswap `swapExactETHForTokens` transaction. The script reads `RPC_URL` and `PRIVATE_KEY` from the environment.
- `/welcome-channel` – configure which channel receives join greetings.
- `/report` – report a user for misconduct; the bot times them out and logs the report.
- `/ban-user` – admin only command that bans a user and automatically DM's them about the ban.

Refer to the source files in `src/domains` for exact implementation details.
