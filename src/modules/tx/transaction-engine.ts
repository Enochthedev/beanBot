import { JsonRpcProvider, Wallet, Contract, TransactionReceipt } from 'ethers';
import { network } from '@modules/network';

export interface SendOptions {
  privateTx?: boolean; // send via Flashbots
  gasMultiplier?: number; // apply multiplier to maxFeePerGas
}

const FLASHBOTS_RPC = 'https://rpc.flashbots.net';

export async function sendWithReplacement(
  wallet: Wallet,
  contract: Contract,
  functionName: string,
  args: unknown[],
  opts: SendOptions = {}
): Promise<TransactionReceipt> {
  const provider: JsonRpcProvider = network.getProvider();
  const feeData = await provider.getFeeData();
  let maxFeePerGas = feeData.maxFeePerGas ?? 0n;
  let maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? 0n;
  if (opts.gasMultiplier) {
    maxFeePerGas = (maxFeePerGas * BigInt(Math.floor(opts.gasMultiplier * 100))) / 100n;
    maxPriorityFeePerGas = (maxPriorityFeePerGas * BigInt(Math.floor(opts.gasMultiplier * 100))) / 100n;
  }

  const txResponse = await (contract.connect(wallet) as any)[functionName](...args, {
    maxFeePerGas,
    maxPriorityFeePerGas
  });

  let receipt: TransactionReceipt | null = null;
  try {
    receipt = await txResponse.wait(1);
  } catch {
    // replacement logic: bump gas and resend once
    maxFeePerGas = maxFeePerGas + maxPriorityFeePerGas;
    const replacement = await (contract.connect(wallet) as any)[functionName](...args, {
      maxFeePerGas,
      maxPriorityFeePerGas
    });
    receipt = await replacement.wait(1);
  }
  return receipt!;
}

export function getFlashbotsProvider(): JsonRpcProvider {
  return new JsonRpcProvider(FLASHBOTS_RPC);
}
