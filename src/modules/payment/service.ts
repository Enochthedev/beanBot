import { prisma } from '@libs/prisma';
import {
  PaymentCurrency,
  PaymentStatus,
  PaymentMethod,
  SubscriptionType,
  Payment,
  ServicePrice,
} from '@prisma/client';
import { config } from '@config/index';

const receiverAddresses = config.paymentReceiverAddresses;

function methodEnabled(method: PaymentMethod): boolean {
  return !config.disabledPaymentMethods.includes(method);
}

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
  if (!methodEnabled(method)) {
    throw new Error('Payment method disabled');
  }
  const walletAddress =
    method === PaymentMethod.ON_CHAIN ? selectReceiver() : undefined;

  if (method === PaymentMethod.ON_CHAIN && !walletAddress) {
    throw new Error('No payment receiver address configured');
  }

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

export async function updatePaymentStatus(
  id: string,
  status: PaymentStatus,
  txHash?: string
) {
  const payment = await prisma.payment.update({
    where: { id },
    data: { status, txHash },
    include: { service: true },
  });

  if (status === PaymentStatus.COMPLETED) {
    await grantPurchasedService(payment);
  }

  return payment;
}

async function grantPurchasedService(payment: Payment & { service: ServicePrice }) {
  const name = payment.service.name.toLowerCase();
  const match = /^subscription-(basic|premium)$/i.exec(name);
  if (!match) return;

  const subType = match[1].toUpperCase() as SubscriptionType;
  await prisma.subscription.create({
    data: { userId: payment.userId, subscriptionType: subType, isActive: true },
  });
}

export async function getUserPayments(userId: string) {
  return prisma.payment.findMany({ where: { userId } });
}
