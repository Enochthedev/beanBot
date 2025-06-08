import { JsonRpcProvider, Wallet, Contract, TransactionReceipt } from 'ethers';
import { network } from '@modules/network';

export interface SendOptions {
  privateTx?: boolean; // send via Flashbots
  gasMultiplier?: number; // apply multiplier to maxFeePerGas
  nonce?: number;
  maxRetries?: number;
}

const FLASHBOTS_RPC = 'https://rpc.flashbots.net';

export async function sendWithReplacement(
  wallet: Wallet,
  contract: Contract,
  functionName: string,
  args: unknown[],
  opts: SendOptions = {}
): Promise<TransactionReceipt> {
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

  const signer = wallet.connect(provider);
  const nonce = opts.nonce;
  const maxRetries = opts.maxRetries ?? 0;
  const timeout = 30000; // 30 seconds

  let attempt = 0;
  while (attempt <= maxRetries) {
    let txResponse;
    try {
      txResponse = await (contract.connect(signer) as any)[functionName](...args, {
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce
      });
    } catch (err) {
      if (attempt >= maxRetries) throw err;
      console.log(`⏫ Replacing tx nonce ${nonce} (attempt ${attempt + 1})`);
      maxFeePerGas = maxFeePerGas + maxPriorityFeePerGas;
      attempt++;
      continue;
    }

    const receipt = await provider.waitForTransaction(txResponse.hash, 1, timeout);
    if (receipt) return receipt;

    attempt++;
    if (attempt > maxRetries) throw new Error('Transaction timed out');

    console.log(`⏫ Replacing tx nonce ${nonce} (attempt ${attempt})`);
    maxFeePerGas = maxFeePerGas + maxPriorityFeePerGas;
  }

  throw new Error('Transaction failed');
}

export function getFlashbotsProvider(): JsonRpcProvider {
  return new JsonRpcProvider(FLASHBOTS_RPC);
}
