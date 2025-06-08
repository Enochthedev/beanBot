# Advanced Minting Guide

This guide covers environment variables and options introduced for dynamic gas management, Flashbots integration and batch mint support.

## Additional Environment Variables

The following variables can be set in your `.env` file:

- `MAX_CONCURRENT_MINTS` – maximum simultaneous mints processed by the queue.
- `MAX_QUEUE_SIZE` – limit for queued requests per priority level.
- `MINT_MAX_RETRIES` – how many times a failed mint is retried.
- `GAS_MULTIPLIER` – multiplier applied to `maxFeePerGas` and `maxPriorityFeePerGas`.
- `USE_FLASHBOTS` – when `true` transactions are sent through Flashbots.
- `DETECTION_SCORE_THRESHOLD` – minimum score before a detection opportunity is emitted.

Refer to `.env.example` for default values.

## Dynamic Gas Configuration

The transaction engine scales gas fees using the `gasMultiplier` option:

```ts
const provider: JsonRpcProvider = opts.privateTx
  ? getFlashbotsProvider()
  : network.getProvider();
const feeData = await provider.getFeeData();
let maxFeePerGas = feeData.maxFeePerGas ?? 0n;
let maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? 0n;
if (opts.gasMultiplier) {
  maxFeePerGas = (maxFeePerGas * BigInt(Math.floor(opts.gasMultiplier * 100))) / 100n;
  maxPriorityFeePerGas = (maxPriorityFeePerGas * BigInt(Math.floor(opts.gasMultiplier * 100))) / 100n;
}
```

This multiplier can be configured via the `GAS_MULTIPLIER` environment variable.

## Flashbots Usage

When `privateTx` is enabled the provider switches to the Flashbots RPC endpoint:

```ts
const provider: JsonRpcProvider = opts.privateTx
  ? getFlashbotsProvider()
  : network.getProvider();
```

Enable Flashbots submission by setting `USE_FLASHBOTS=true`.

## Batch Minting

The `/mint` command accepts an `amount` option and the queue passes it to the contract:

```ts
  .addIntegerOption(opt =>
    opt.setName('amount')
      .setDescription('Mint amount')
      .setRequired(true)
  );
...
await sendWithReplacement(wallet, contract, project.mintFunction.split('(')[0], [request.amount], {
  gasMultiplier: config.gasMultiplier,
  privateTx: process.env.USE_FLASHBOTS === 'true'
});
```

Multiple tokens can therefore be minted in a single transaction when the contract supports it.
