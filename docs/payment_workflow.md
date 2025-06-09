# Payment Workflow

This document explains how on-chain payments unlock premium features.

1. Run `/pay service:<name> currency:<USDT|USDC>` to open a private payment ticket.
2. Send the requested amount to the wallet address shown by the bot.
3. Inside the ticket channel execute `/confirm-payment txhash:<hash>` once the transaction is mined.
4. After verification the payment status changes to `COMPLETED` and the bot automatically grants the purchased service or subscription. For subscription services a row is inserted into the `Subscription` table.
