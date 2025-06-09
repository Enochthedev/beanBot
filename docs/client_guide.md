# Client Guide

This guide is aimed at Discord server owners and moderators who want to run the bot without digging into the source code.

## Prerequisites

1. Copy `.env.example` to `.env` and fill in the required values. Important variables include:
   - **Discord**: `DISCORD_BOT_TOKEN`, `DISCORD_APPLICATION_ID`.
   - **Blockchain/Web3**: `PRIMARY_RPC_URL`, `SECONDARY_RPC_URL`, `TERTIARY_RPC_URL`, `WEBSOCKET_RPC_URL`, `PRIVATE_KEY`, `CONTRACT_ADDRESS`, `CHAIN_ID`.
   - **Database & Cache**: `DATABASE_URL`, `REDIS_URL`.
   - **Monitoring**: `METRICS_PORT`, `ENABLE_PERFORMANCE_MONITORING`.
   - Review `.env.example` for the full list of available options.
2. If you plan to run the bot outside of Docker, install dependencies and generate the Prisma client:
   ```bash
   pnpm install
   pnpm exec prisma generate
   ```

## Running with Docker Compose

The repository includes a `docker-compose.yml` file that builds and hosts the bot.

```bash
cp .env.example .env
# Edit .env with your values
docker-compose up --build
```

The compose file builds the Docker image, compiles the Rust mint bot and starts the TypeScript bot process. Metrics are exposed on the port defined by `METRICS_PORT`. Set `BOT_REPLICAS` in your `.env` file if you need multiple instances.

Stop the stack with `docker-compose down`.

## Slash Commands and Moderation Features

The bot provides many slash commands. Some highlights:

- `/info` – show commands available in the current channel.
- `/restrict-command` – limit a command to a specific channel.
- `/report` – members can report misbehaving users. The bot logs the report, times the user out for ten minutes and notifies moderators.
- `/ban-user` – ban a user from the server and send them a DM explaining the ban.
- `/set-modlog` – choose the channel that receives moderation logs.
- `/set-admin-role` – designate which role has admin privileges for bot commands.
- `/set-mod-role` – designate the moderator role for bot commands.
- `/welcome-channel` – set the channel used for join greetings.
- `/connect-wallet` and `/confirm-wallet` – verify a member's wallet address.
- `/mint-fast` – invoke the high speed NFT mint bot.
- Utility commands such as `pin-message`, `purge-messages`, `post-bounty`, and more are available under the **tools** domain.

Run `/admin-info` in your server for a generated list of every available command.
