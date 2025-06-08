# Developer Overview

This document explains the structure of the codebase and how the bot loads commands and message listeners. It also covers the Rust and Python modules shipped with the repository.

## Project Structure

The source code lives in the `src` directory. The major folders are:

- **`bot`** – the entry point for starting the Discord client. It also contains the command deploy script.
- **`config`** – centralised configuration loaded from `.env` variables.
- **`domains`** – feature domains such as `core`, `tools`, `communication`, `web3` and others. Each domain may provide `commands/` and `listeners/` directories.
- **`handlers`** – runtime handlers that register slash commands and message listeners with the Discord client.
- **`interactions`** – shared types and the registry that loads all commands from the domain folders.
- **`lib`** – utilities such as Redis caching and Lua scripts.
- **`libs`** – wrappers around external services (Prisma, network provider manager, etc.).
- **`modules`** – larger features and language specific submodules. This includes the Rust mint bot and the Python coin sniper.
- **`utils`** – small helper utilities.

## Command Loading and Message Handlers

Commands are organised under `src/domains/*/commands`. Each command file exports `data` (a `SlashCommandBuilder`) and an `execute` function. The function `loadCommands()` in `src/interactions/registry/commands.ts` scans these directories and returns an array of commands. `registerCommandHandler()` in `src/handlers/commands.ts` then maps them to Discord interactions at runtime.

Message listeners live under `src/domains/*/listeners`. `registerMessageHandlers()` in `src/handlers/messages/register-message-handlers.ts` dynamically imports every listener and attaches it to the Discord client's `messageCreate` event.

## Rust and Python Modules

The `src/modules/nft_mint_bot` directory contains a standalone Rust crate used for the `/mint-fast` command. It builds a binary that interacts with your NFT contract for high‑performance minting. See [NFT Mint Bot Developer Guide](./nft_mint_bot.md) for details.

The `src/modules/coin_sniper` folder provides a small Python script for token sniping. Its tests live alongside the script.

## Further Reading

- [Deployment Guide](./deployment.md)
- [NFT Mint Bot Developer Guide](./nft_mint_bot.md)

