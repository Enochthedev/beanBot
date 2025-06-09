import { prisma } from '@libs/prisma';
import { MintStatus } from '@prisma/client';

export enum AccessLevel {
  NONE,
  BASIC,
  PREMIUM,
}

export async function checkUserAccess(discordId: string): Promise<AccessLevel> {
  const user = await prisma.user.findUnique({ where: { discordId } });
  if (!user) return AccessLevel.NONE;
  const sub = await prisma.subscription.findFirst({
    where: { userId: user.id, isActive: true }
  });
  if (sub) {
    if (sub.expiresAt && sub.expiresAt < new Date()) {
      await prisma.subscription.update({ where: { id: sub.id }, data: { isActive: false } });
    } else {
      return sub.subscriptionType === 'PREMIUM' ? AccessLevel.PREMIUM : AccessLevel.BASIC;
    }
  }
  const holding = await prisma.nftHolding.findFirst({
    where: { userId: user.id, isVerified: true, mintsRemaining: { gt: 0 } }
  });
  return holding ? AccessLevel.BASIC : AccessLevel.NONE;
}

export async function verifyNftHoldings(userId: string, walletAddress: string): Promise<number> {
  const holdings = await prisma.nftHolding.findMany({ where: { userId } });
  return holdings.reduce((sum, h) => sum + h.mintsRemaining, 0);
}

export async function decrementUserMints(userId: string, amount: number): Promise<void> {
  await prisma.subscription.updateMany({
    where: { userId, isActive: true },
    data: { mintsRemaining: { decrement: amount } }
  });
}

export async function removeUserFromQueues(userId: string): Promise<void> {
  await prisma.mintAttempt.updateMany({
    where: { userId, status: { in: [MintStatus.PENDING, MintStatus.QUEUED, MintStatus.PROCESSING] } },
    data: { status: MintStatus.CANCELLED }
  });
}
