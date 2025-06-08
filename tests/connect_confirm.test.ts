import { describe, it } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { prisma } from '../src/libs/prisma';
import * as wallet from '../src/modules/wallet';
import { execute as connect } from '../src/domains/web3/commands/connect-wallet';
import { execute as confirm } from '../src/domains/web3/commands/confirm-wallet';
import { ethers } from 'ethers';

function mockInteraction(opts: any) {
  return {
    options: {
      getString: (name: string, req: boolean) => opts[name],
    },
    user: { id: 'user1', tag: 'user#1234' },
    reply: sinon.stub().resolves(),
  } as any;
}

describe('wallet connect flow', () => {
  it('generates nonce and verifies signature', async () => {
    const testWallet = ethers.Wallet.createRandom();
    const address = testWallet.address;
    const nonce = 'abc123';
    const userRecord = { id: 'uid1', discordId: 'user1', discordTag: 'user#1234' };

    const originalUser = prisma.user;
    (prisma as any).user = {
      findUnique: sinon.stub().resolves(userRecord as any),
      create: sinon.stub().resolves(userRecord as any),
      update: sinon.stub().resolves(userRecord as any)
    } as any;
    let generatedNonce = '';
    const originalWalletSession = prisma.walletSession;
    const createStub = sinon.stub().callsFake((data: any) => {
      generatedNonce = data.data.nonce;
      return Promise.resolve({ id: 'sess1', nonce: generatedNonce, walletAddress: address } as any);
    });
    const findFirstStub = sinon.stub();
    const findUniqueStub = sinon.stub();
    const updateStub = sinon.stub().resolves();
    (prisma as any).walletSession = { create: createStub, findFirst: findFirstStub, findUnique: findUniqueStub, update: updateStub } as any;

    const interaction = mockInteraction({ address });
    await connect(interaction);

    const signed = await testWallet.signMessage(`${process.env.SIGNATURE_MESSAGE}:${generatedNonce}`);
    (interaction.options.getString as any) = () => signed;

    findFirstStub.resolves({ id: 'sess1', userId: userRecord.id, walletAddress: address, nonce: generatedNonce, isActive: true, expiresAt: new Date(Date.now() + 1000) } as any);
    findUniqueStub.resolves({ id: 'sess1', userId: userRecord.id, walletAddress: address, nonce: generatedNonce, isActive: true, expiresAt: new Date(Date.now() + 1000) } as any);
    updateStub.resolves();

    await confirm(interaction);

    expect(createStub.called).to.equal(true);
    expect(findUniqueStub.calledWith({ where: { id: 'sess1' } })).to.equal(true);
    expect(updateStub.called).to.equal(true);

    (prisma as any).user = originalUser;
    (prisma as any).walletSession = originalWalletSession;
  });
});
