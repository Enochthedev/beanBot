import { describe, it } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { prisma } from '../src/libs/prisma';
import { checkUserAccess, AccessLevel } from '../src/modules/mint/access';

describe('subscription expiry check', () => {
  it('marks expired subscriptions inactive', async () => {
    const findUser = sinon.stub().resolves({ id: 'u1' });
    const findSub = sinon.stub().resolves({ id: 's1', userId: 'u1', subscriptionType: 'BASIC', isActive: true, expiresAt: new Date(Date.now() - 1000) });
    const updateSub = sinon.stub().resolves({});
    const originalUser = prisma.user;
    const originalSub = prisma.subscription;
    const originalHolding = prisma.nftHolding;
    (prisma as any).user = { findUnique: findUser } as any;
    (prisma as any).subscription = { findFirst: findSub, update: updateSub } as any;
    (prisma as any).nftHolding = { findFirst: sinon.stub().resolves(null) } as any;

    const level = await checkUserAccess('discord');
    expect(level).to.equal(AccessLevel.NONE);
    expect(updateSub.calledWithMatch({ where: { id: 's1' }, data: { isActive: false } })).to.equal(true);

    (prisma as any).user = originalUser;
    (prisma as any).subscription = originalSub;
    (prisma as any).nftHolding = originalHolding;
  });
});
