import { prisma } from '@libs/prisma';
import { MintStatus } from '@prisma/client';
import { ethers } from 'ethers';

export interface ValidationResult {
  ok: boolean;
  message?: string;
}

export async function validateMintEligibility(walletAddress: string, projectId: string, mintAmount: number): Promise<ValidationResult> {
  const project = await prisma.mintProject.findUnique({ where: { id: projectId } });
  if (!project || !project.isActive) return { ok: false, message: 'Project not active' };
  if (project.mintStartTime && project.mintStartTime > new Date()) return { ok: false, message: 'Mint not started' };
  if (project.mintEndTime && project.mintEndTime < new Date()) return { ok: false, message: 'Mint ended' };

  const provider = new ethers.JsonRpcProvider(process.env.PRIMARY_RPC_URL);
  const balance = await provider.getBalance(walletAddress);
  const price = BigInt(project.mintPrice) * BigInt(mintAmount);
  if (balance < price) return { ok: false, message: 'Insufficient balance' };

  return { ok: true };
}
