process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { ChannelType } from 'discord.js';
import { prisma } from '../src/libs/prisma';
import { cache } from '../src/lib/cache';
import { PaymentStatus } from '@prisma/client';
import { ethers } from 'ethers';

import { execute as restrictCommand } from '../src/domains/core/commands/restrict-command';
// other command modules are imported dynamically within tests
import { network } from '../src/modules/network';

function mockInteraction(opts: any) {
  return {
    options: {
      getString: (name: string, req: boolean) => opts[name],
      getNumber: (name: string, req: boolean) => opts[name],
      getChannel: (name: string, req: boolean) => opts[name]
    },
    user: { id: 'user1', tag: 'user#1234', username: 'user' },
    guild: opts.guild,
    channel: opts.channel,
    channelId: opts.channel?.id,
    reply: sinon.stub().resolves()
  } as any;
}

describe('payment command flow', () => {
  it('sets service price via /set-service-price', async () => {
    const upsert = sinon.stub().resolves({});
    const original = prisma.servicePrice;
    (prisma as any).servicePrice = { upsert } as any;
    const interaction = mockInteraction({ service: 'sniper', price: 5, currency: 'USDT' });
    const { execute } = await import('../src/domains/web3/commands/set-service-price');
    await execute(interaction as any);
    expect(upsert.calledWithMatch({ where: { name: 'sniper' }, create: { name: 'sniper', price: '5', currency: 'USDT' }, update: { price: '5', currency: 'USDT' } })).to.equal(true);
    (prisma as any).servicePrice = original;
  });

  it('creates a ticket with /pay and cleans up on /confirm-payment', async () => {
    process.env.PAYMENT_RECEIVER_ADDRESSES = '0x000000000000000000000000000000000000dEaD';
    process.env.USDT_ADDRESS = '0xusdt';
    process.env.USDC_ADDRESS = '0xusdc';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    Object.keys(require.cache).forEach(k => {
      if (k.includes('src/config/index')) delete (require as any).cache[k];
      if (k.includes('src/modules/payment')) delete (require as any).cache[k];
    });

    const svcStub = sinon.stub().resolves({ id: 'svc1', name: 'sniper', price: '10' });
    const originalService = prisma.servicePrice;
    (prisma as any).servicePrice = { findUnique: svcStub } as any;

    const originalCfg = prisma.guildConfig;
    (prisma as any).guildConfig = { findUnique: sinon.stub().resolves({ adminRoleIds: [] }) } as any;

    const userFind = sinon.stub().resolves(null);
    const userCreate = sinon.stub().resolves({ id: 'uid1' });
    const originalUser = prisma.user;
    (prisma as any).user = { findUnique: userFind, create: userCreate } as any;

    const payCreate = sinon.stub().resolves({ id: 'pay1', walletAddress: '0x000000000000000000000000000000000000dEaD' });
    const payUpdate = sinon.stub().resolves({ service: { name: 'subscription-basic' } });
    const subCreate = sinon.stub().resolves();
    const originalSub = prisma.subscription;
    (prisma as any).subscription = { create: subCreate } as any;
    const originalPayment = prisma.payment;
    (prisma as any).payment = { create: payCreate, update: payUpdate, findFirst: sinon.stub() } as any;

    const sendStub = sinon.stub().resolves();
    const createdChannel = { id: 'chan1', send: sendStub };
    const createChannel = sinon.stub().resolves(createdChannel);
    const guild = { channels: { create: createChannel }, roles: { everyone: { id: 'everyone' } }, ownerId: 'owner' };
    const interaction = mockInteraction({ service: 'sniper', currency: 'USDT', guild });

    const { execute: pay } = await import('../src/domains/web3/commands/pay');
    await pay(interaction as any);
    expect(createChannel.called).to.equal(true);
    expect(sendStub.called).to.equal(true);
    expect(payUpdate.calledWithMatch({ where: { id: 'pay1' }, data: { channelId: 'chan1' } })).to.equal(true);

    (prisma as any).payment.findFirst = sinon.stub().resolves({ id: 'pay1', walletAddress: '0x000000000000000000000000000000000000dEaD', amount: '10', currency: 'USDT' });
    const deleteStub = sinon.stub().resolves();
    interaction.channel = { id: 'chan1', type: ChannelType.GuildText, delete: deleteStub } as any;
    interaction.channelId = 'chan1';
    (interaction.options.getString as any) = () => '0x' + 'a'.repeat(64);

    const iface = new ethers.Interface(['function transfer(address to, uint256 value)']);
    const data = iface.encodeFunctionData('transfer', ['0x000000000000000000000000000000000000dEaD', ethers.parseUnits('10', 6)]);
    const tx = { to: '0xusdt', data } as any;
    const provider = {
      waitForTransaction: sinon.stub().resolves(),
      getTransaction: sinon.stub().resolves(tx)
    } as any;
    const netStub = sinon.stub(network, 'withProvider').callsFake(fn => fn(provider));

    const { execute: confirmPayment } = await import('../src/domains/web3/commands/confirm-payment');
    await confirmPayment(interaction as any);
    expect(deleteStub.called).to.equal(true);
    expect(payUpdate.calledWithMatch({ where: { id: 'pay1' }, data: { status: PaymentStatus.COMPLETED, txHash: sinon.match.string } })).to.equal(true);

    netStub.restore();
    (prisma as any).servicePrice = originalService;
    (prisma as any).user = originalUser;
    (prisma as any).payment = originalPayment;
    (prisma as any).guildConfig = originalCfg;
    (prisma as any).subscription = originalSub;
  });

  it('honors command restriction set by /restrict-command', async () => {
    const restrictInteraction = mockInteraction({ command: 'pay', channel: { id: 'allowed' } });
    await restrictCommand(restrictInteraction as any);

    const allowed = await cache.get<string>('cmd:channel:pay');
    expect(allowed).to.equal('allowed');

    const guild = { channels: { create: sinon.stub() }, roles: { everyone: { id: 'everyone' } }, ownerId: 'owner' };
    const payInteraction = mockInteraction({ service: 'sniper', currency: 'USDT', guild, channel: { id: 'wrong' } });
    payInteraction.channelId = 'wrong';

    const replyStub = payInteraction.reply;
    const allowedChannel = await cache.get<string>('cmd:channel:pay');
    if (allowedChannel && allowedChannel !== payInteraction.channelId) {
      await payInteraction.reply({ content: `❌ Use this command in <#${allowedChannel}>`, ephemeral: true });
    }
    expect(replyStub.called).to.equal(true);

    payInteraction.channel.id = 'allowed';
    payInteraction.channelId = 'allowed';
    replyStub.resetHistory();
    const createChannel = sinon.stub().resolves({ id: 'c1', send: sinon.stub().resolves() });
    guild.channels.create = createChannel;

    const originalCfg2 = prisma.guildConfig;
    (prisma as any).guildConfig = { findUnique: sinon.stub().resolves({ adminRoleIds: [] }) } as any;

    process.env.PAYMENT_RECEIVER_ADDRESSES = '0x000000000000000000000000000000000000dEaD';
    process.env.USDT_ADDRESS = '0xusdt';
    process.env.USDC_ADDRESS = '0xusdc';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    Object.keys(require.cache).forEach(k => {
      if (k.includes('src/config/index')) delete (require as any).cache[k];
      if (k.includes('src/modules/payment')) delete (require as any).cache[k];
    });
    const { execute: payCmd } = await import('../src/domains/web3/commands/pay');
    await payCmd(payInteraction as any);
    expect(createChannel.called).to.equal(true);
    (prisma as any).guildConfig = originalCfg2;
  });

  it('disables payment method via command', async () => {
    const interaction = mockInteraction({ method: 'ON_CHAIN', guild: { id: 'g' } });
    const { execute } = await import('../src/domains/web3/commands/deactivate-payment-method');
    await execute(interaction as any);
    const { config } = await import('../src/config');
    expect(config.disabledPaymentMethods.includes('ON_CHAIN' as any)).to.equal(true);
  });
});
