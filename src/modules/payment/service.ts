import { prisma } from '@libs/prisma';
import { PaymentCurrency, PaymentStatus, PaymentMethod } from '@prisma/client';
import { config } from '@config/index';

const receiverAddresses = config.paymentReceiverAddresses;

function selectReceiver(): string | undefined {
  if (receiverAddresses.length === 0) return undefined;
  const index = Math.floor(Math.random() * receiverAddresses.length);
  return receiverAddresses[index];
}

export async function createPayment(
  userId: string,
  serviceId: string,
  amount: string,
  currency: PaymentCurrency,
  method: PaymentMethod,
  channelId?: string,
  txHash?: string
) {
  const walletAddress = method === PaymentMethod.ON_CHAIN ? selectReceiver() : undefined;
  return prisma.payment.create({
    data: {
      userId,
      serviceId,
      amount,
      currency,
      method,
      walletAddress,
      channelId,
      txHash,
      status: PaymentStatus.PENDING,
    },
  });
}

export async function updatePaymentStatus(id: string, status: PaymentStatus, txHash?: string) {
  return prisma.payment.update({
    where: { id },
    data: { status, txHash }
  });
}

export async function getUserPayments(userId: string) {
  return prisma.payment.findMany({ where: { userId } });
}
