import { describe, it } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { prisma } from '../src/libs/prisma';

describe('getUserWallet', () => {
  it('returns wallet from database', async () => {
    const original = prisma.user;
    const stub = sinon.stub().resolves({ walletAddress: '0xabc' });
    (prisma as any).user = { findUnique: stub };
    const { getUserWallet } = await import('../src/modules/wallet');
    const addr = await getUserWallet('user1');
    expect(stub.calledWith({ where: { id: 'user1' } })).to.equal(true);
    expect(addr).to.equal('0xabc');
    (prisma as any).user = original;
  });
});
