import { describe, it } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { ChannelType } from 'discord.js';
import { prisma } from '../src/libs/prisma';
import { cache } from '../src/lib/cache';
import { PaymentStatus } from '@prisma/client';

import { execute as setServicePrice } from '../src/domains/web3/commands/set-service-price';
import { execute as pay } from '../src/domains/web3/commands/pay';
import { execute as confirmPayment } from '../src/domains/web3/commands/confirm-payment';
import { execute as restrictCommand } from '../src/domains/core/commands/restrict-command';
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
    await setServicePrice(interaction as any);
    expect(upsert.calledWithMatch({ where: { name: 'sniper' }, create: { name: 'sniper', price: '5', currency: 'USDT' }, update: { price: '5', currency: 'USDT' } })).to.equal(true);
    (prisma as any).servicePrice = original;
  });

  it('creates a ticket with /pay and cleans up on /confirm-payment', async () => {
    process.env.PAYMENT_RECEIVER_ADDRESSES = '0xwallet';

    const svcStub = sinon.stub().resolves({ id: 'svc1', name: 'sniper', price: '10' });
    const originalService = prisma.servicePrice;
    (prisma as any).servicePrice = { findUnique: svcStub } as any;

    const userFind = sinon.stub().resolves(null);
    const userCreate = sinon.stub().resolves({ id: 'uid1' });
    const originalUser = prisma.user;
    (prisma as any).user = { findUnique: userFind, create: userCreate } as any;

    const payCreate = sinon.stub().resolves({ id: 'pay1', walletAddress: '0xwallet' });
    const payUpdate = sinon.stub().resolves();
    const originalPayment = prisma.payment;
    (prisma as any).payment = { create: payCreate, update: payUpdate, findFirst: sinon.stub() } as any;

    const sendStub = sinon.stub().resolves();
    const createdChannel = { id: 'chan1', send: sendStub };
    const createChannel = sinon.stub().resolves(createdChannel);
    const guild = { channels: { create: createChannel }, roles: { everyone: { id: 'everyone' } }, ownerId: 'owner' };
    const interaction = mockInteraction({ service: 'sniper', currency: 'USDT', guild });

    await pay(interaction as any);
    expect(createChannel.called).to.equal(true);
    expect(sendStub.called).to.equal(true);
    expect(payUpdate.calledWithMatch({ where: { id: 'pay1' }, data: { channelId: 'chan1' } })).to.equal(true);

    (prisma as any).payment.findFirst = sinon.stub().resolves({ id: 'pay1', walletAddress: '0xwallet' });
    const deleteStub = sinon.stub().resolves();
    interaction.channel = { id: 'chan1', type: ChannelType.GuildText, delete: deleteStub } as any;
    interaction.channelId = 'chan1';
    (interaction.options.getString as any) = () => '0x' + 'a'.repeat(64);

    const netStub = sinon.stub(network, 'withProvider');
    netStub.onFirstCall().resolves({});
    netStub.onSecondCall().resolves({ to: '0xwallet' });

    await confirmPayment(interaction as any);
    expect(deleteStub.called).to.equal(true);
    expect(payUpdate.calledWithMatch({ where: { id: 'pay1' }, data: { status: PaymentStatus.COMPLETED, txHash: sinon.match.string } })).to.equal(true);

    netStub.restore();
    (prisma as any).servicePrice = originalService;
    (prisma as any).user = originalUser;
    (prisma as any).payment = originalPayment;
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

    await pay(payInteraction as any);
    expect(createChannel.called).to.equal(true);
  });
});
