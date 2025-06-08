import { prisma } from '@libs/prisma';
import { randomBytes } from 'crypto';
import { TypedDataDomain, TypedDataField, verifyMessage } from 'ethers';

export interface WalletSession {
  id: string;
  userId: string;
  walletAddress: string;
  nonce: string;
  expiresAt: Date;
}

const SESSION_DURATION_MINUTES = parseInt(process.env.WALLET_CONNECTION_EXPIRE_MINUTES ?? '15', 10);
const SIGNATURE_MESSAGE = process.env.SIGNATURE_MESSAGE ?? 'Authorize mint bot access';

export async function createWalletSession(userId: string, walletAddress: string) {
  const nonce = randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MINUTES * 60 * 1000);
  return prisma.walletSession.create({
    data: { userId, walletAddress, nonce, signature: '', expiresAt }
  });
}

export async function verifyWalletSignature(sessionId: string, signature: string) {
  const session = await prisma.walletSession.findUnique({ where: { id: sessionId } });
  if (!session || !session.isActive || session.expiresAt < new Date()) return false;
  const message = `${SIGNATURE_MESSAGE}:${session.nonce}`;
  let recovered: string | null = null;
  try {
    recovered = verifyMessage(message, signature);
  } catch {
    return false;
  }
  if (recovered.toLowerCase() !== session.walletAddress.toLowerCase()) return false;
  await prisma.walletSession.update({ where: { id: sessionId }, data: { signature, isActive: false } });
  await prisma.user.update({ where: { id: session.userId }, data: { walletAddress: session.walletAddress } });
  return true;
}

export async function getUserWallet(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.walletAddress ?? null;
}
