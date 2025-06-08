# Deployment Guide

This guide walks through preparing your environment and running the bot.

1. Copy `.env.example` to `.env` and fill in all required values.
2. Install dependencies with `pnpm install` (or `npm ci`).
3. Generate the Prisma client:
   ```bash
   pnpm exec prisma generate
   ```
4. Build the Rust mint bot binary:
   ```bash
   cargo build --release -p nft_mint_bot
   ```
5. Start the bot locally with `pnpm run dev` or use Docker:
   ```bash
   docker-compose up
   ```
