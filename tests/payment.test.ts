process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { prisma } from '../src/libs/prisma';
import { PaymentStatus, PaymentCurrency, PaymentMethod, SubscriptionType } from '@prisma/client';

describe('payment module', () => {
  it('creates and updates a payment', async () => {
    const paymentOriginal = prisma.payment as any;
    const subOriginal = prisma.subscription as any;
    const createStub = sinon.stub().resolves({ id: 'pay1' });
    const updateStub = sinon.stub().resolves({
      id: 'pay1',
      userId: 'u1',
      serviceId: 'svc1',
      service: { name: 'subscription-premium' }
    });
    const findManyStub = sinon.stub().resolves([]);
    const subCreateStub = sinon.stub().resolves({});
    (prisma as any).payment = {
      create: createStub,
      update: updateStub,
      findMany: findManyStub
    } as any;
    (prisma as any).subscription = {
      create: subCreateStub
    } as any;

    process.env.PAYMENT_RECEIVER_ADDRESSES = '0xabc';
    const { config } = await import('../src/config');
    config.disabledPaymentMethods = [];

    const { createPayment, updatePaymentStatus, getUserPayments } = await import('../src/modules/payment');
    await createPayment('u1', 'svc1', '10', PaymentCurrency.USDT, PaymentMethod.ON_CHAIN, 'chan1', 'hash');
    expect(createStub.calledWithMatch({ data: { userId: 'u1', serviceId: 'svc1', amount: '10', currency: PaymentCurrency.USDT, method: PaymentMethod.ON_CHAIN, walletAddress: sinon.match.string, channelId: 'chan1', txHash: 'hash', status: PaymentStatus.PENDING } })).to.equal(true);

    await updatePaymentStatus('pay1', PaymentStatus.COMPLETED);
    expect(updateStub.calledWithMatch({ where: { id: 'pay1' }, data: { status: PaymentStatus.COMPLETED }, include: { service: true } })).to.equal(true);
    expect(subCreateStub.calledWithMatch({ data: { userId: 'u1', subscriptionType: SubscriptionType.PREMIUM, isActive: true } })).to.equal(true);

    await getUserPayments('u1');
    expect(findManyStub.calledWith({ where: { userId: 'u1' } })).to.equal(true);

    (prisma as any).payment = paymentOriginal;
    (prisma as any).subscription = subOriginal;
  });

  it('throws when no receiver address is configured', async () => {
    const original = prisma.payment as any;
    const createStub = sinon.stub().resolves({ id: 'pay1' });
    (prisma as any).payment = { create: createStub } as any;

    process.env.PAYMENT_RECEIVER_ADDRESSES = '';

    Object.keys(require.cache).forEach(k => {
      if (k.includes('src/config/index')) delete (require as any).cache[k];
      if (k.includes('src/modules/payment')) delete (require as any).cache[k];
    });
    const { createPayment } = await import('../src/modules/payment');

    let error: any;
    try {
      await createPayment('u1', 'svc1', '10', PaymentCurrency.USDT, PaymentMethod.ON_CHAIN);
    } catch (err) {
      error = err;
    }

    expect(error).to.be.an('Error');
    expect((error as Error).message).to.match(/receiver address/);
    expect(createStub.called).to.equal(false);

    (prisma as any).payment = original;
  });

  it('throws when payment method disabled', async () => {
    const original = prisma.payment as any;
    const createStub = sinon.stub().resolves({ id: 'pay1' });
    (prisma as any).payment = { create: createStub } as any;

    process.env.PAYMENT_RECEIVER_ADDRESSES = '0xabc';

    Object.keys(require.cache).forEach(k => {
      if (k.includes('src/config/index')) delete (require as any).cache[k];
      if (k.includes('src/modules/payment')) delete (require as any).cache[k];
    });
    const { createPayment } = await import('../src/modules/payment');
    const { config } = await import('../src/config');

    config.disabledPaymentMethods.push(PaymentMethod.ON_CHAIN);

    let error: any;
    try {
      await createPayment('u1', 'svc1', '10', PaymentCurrency.USDT, PaymentMethod.ON_CHAIN);
    } catch (err) {
      error = err;
    }

    expect(error).to.be.an('Error');
    expect((error as Error).message).to.match(/disabled/);
    expect(createStub.called).to.equal(false);

    (prisma as any).payment = original;
  });
});
