import { describe, it } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
process.env.PRIMARY_RPC_URL = 'http://localhost:8545';
import { prisma } from '../src/libs/prisma';
import { network } from '../src/modules/network';
import * as paymentModule from '../src/modules/payment';
import { ethers } from 'ethers';
import { PaymentCurrency, PaymentStatus } from '@prisma/client';
import { ChannelType } from 'discord.js';

function mockInteraction(tx: string) {
  return {
    options: { getString: () => tx },
    channelId: 'chan1',
    reply: sinon.stub().resolves(),
    channel: { type: ChannelType.GuildText, delete: sinon.stub().resolves() }
  } as any;
}

describe('confirm-payment command', () => {
  it('confirms payment when transaction matches', async () => {
    process.env.USDT_ADDRESS = '0xusdt';
    process.env.USDC_ADDRESS = '0xusdc';
    Object.keys(require.cache).forEach(k => {
      if (k.includes('src/config/index')) delete (require as any).cache[k];
    });

    const wallet = '0x000000000000000000000000000000000000dEaD';
    const payment = { id: 'pay1', walletAddress: wallet, amount: '10', currency: PaymentCurrency.USDT } as any;
    const paymentStub = sinon.stub().resolves(payment);
    const originalPaymentModel = prisma.payment as any;
    const updateStub = sinon.stub().resolves({ service: { name: 'subscription-basic' } });
    const subCreate = sinon.stub().resolves({});
    const originalSub = prisma.subscription as any;
    (prisma as any).subscription = { create: subCreate } as any;
    (prisma as any).payment = { findFirst: paymentStub, update: updateStub } as any;

    const iface = new ethers.Interface(['function transfer(address to, uint256 value)']);
    const data = iface.encodeFunctionData('transfer', [wallet, ethers.parseUnits('10', 6)]);
    const tx = { to: '0xusdt', data };
    const provider = {
      waitForTransaction: sinon.stub().resolves(),
      getTransaction: sinon.stub().resolves(tx)
    } as any;
    const originalWP = network.withProvider;
    (network as any).withProvider = (fn: any) => fn(provider);

    const { execute } = await import('../src/domains/web3/commands/confirm-payment');
    const interaction = mockInteraction('0x' + 'a'.repeat(64));
    await execute(interaction);

    expect(updateStub.called).to.equal(true);
    expect(interaction.reply.calledWithMatch({ content: '✅ Payment confirmed. Closing ticket...', ephemeral: true })).to.equal(true);

    (network as any).withProvider = originalWP;
    (prisma as any).payment = originalPaymentModel;
    (prisma as any).subscription = originalSub;
  });

  it('rejects mismatched transaction', async () => {
    process.env.USDT_ADDRESS = '0xusdt';
    process.env.USDC_ADDRESS = '0xusdc';
    Object.keys(require.cache).forEach(k => {
      if (k.includes('src/config/index')) delete (require as any).cache[k];
    });

    const wallet = '0x000000000000000000000000000000000000dEaD';
    const payment = { id: 'pay1', walletAddress: wallet, amount: '10', currency: PaymentCurrency.USDT } as any;
    const paymentStub = sinon.stub().resolves(payment);
    const originalPaymentModel = prisma.payment as any;
    const updateStub = sinon.stub().resolves({});
    (prisma as any).payment = { findFirst: paymentStub, update: updateStub } as any;

    const iface = new ethers.Interface(['function transfer(address to, uint256 value)']);
    const data = iface.encodeFunctionData('transfer', [wallet, ethers.parseUnits('5', 6)]); // wrong amount
    const tx = { to: '0xusdt', data };
    const provider = {
      waitForTransaction: sinon.stub().resolves(),
      getTransaction: sinon.stub().resolves(tx)
    } as any;
    const originalWP = network.withProvider;
    (network as any).withProvider = (fn: any) => fn(provider);

    const { execute } = await import('../src/domains/web3/commands/confirm-payment');
    const interaction = mockInteraction('0x' + 'a'.repeat(64));
    await execute(interaction);

    expect(updateStub.called).to.equal(false);
    expect(interaction.reply.calledWithMatch({ content: sinon.match(/^❌/), ephemeral: true })).to.equal(true);

    (network as any).withProvider = originalWP;
    (prisma as any).payment = originalPaymentModel;
  });
});
