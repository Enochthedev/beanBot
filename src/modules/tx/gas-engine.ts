import { JsonRpcProvider, TransactionRequest } from 'ethers';
import { network } from '@modules/network';

export interface GasOptions {
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

/** Estimate gas and return populated gas options */
export async function estimateGas(
  tx: TransactionRequest,
  provider: JsonRpcProvider = network.getProvider()
): Promise<GasOptions> {
  const gasLimit = await provider.estimateGas(tx);
  const feeData = await provider.getFeeData();
  return {
    gasLimit,
    maxFeePerGas: feeData.maxFeePerGas ?? undefined,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined
  };
}
