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
- `RPC_URL` – JSON-RPC endpoint
- `PRIVATE_KEY` – private key used to sign transactions
- `CONTRACT_ADDRESS` – address of the mint contract

## Adding Logic
Open `src/modules/nft_mint_bot/src/main.rs` and implement your minting logic.
A simple example using `ethers` is included. Feel free to expand it with more
contract calls or gas optimisations.

## Concurrency
Multiple users may trigger `/mint-fast` concurrently. Because the bot spawns a
new process per command, each mint runs isolated and will not block other
commands. Keep your Rust code efficient to maintain fast response times.

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
