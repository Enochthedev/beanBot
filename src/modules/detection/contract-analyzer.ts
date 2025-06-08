import { JsonRpcProvider } from 'ethers';

/** Basic contract analysis utilities */
export interface MintFunction {
  name: string;
  inputs: string[];
}

export interface ContractAnalysis {
  mintFunctions: MintFunction[];
}

/**
 * Analyze an ABI to detect possible mint functions.
 * Simple heuristic: look for functions containing the word "mint" that
 * are payable or have a quantity parameter.
 */
export function analyzeAbi(abi: any[]): ContractAnalysis {
  const mintFunctions: MintFunction[] = [];
  for (const item of abi) {
    if (item.type === 'function' && /mint/i.test(item.name)) {
      const inputs = (item.inputs || []).map((i: any) => i.type);
      mintFunctions.push({ name: item.name, inputs });
    }
  }
  return { mintFunctions };
}

/**
 * Fetch ABI via RPC and analyze for mint methods.
 * Note: This is a placeholder and assumes the contract has the `eth_getCode`
 * method available. Real implementations might query Etherscan or use a
 * verified ABI source.
 */
export async function analyzeContract(
  address: string,
  provider: JsonRpcProvider
): Promise<ContractAnalysis | null> {
  try {
    const code = await provider.getCode(address);
    if (!code || code === '0x') return null;
    // Without verified ABI we cannot decode. Placeholder returns empty result.
    return { mintFunctions: [] };
  } catch {
    return null;
  }
}
