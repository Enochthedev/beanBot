import { describe, it } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { cache } from '../src/lib/cache';
import { getUserWallet } from '../src/modules/wallet';

describe('getUserWallet', () => {
  it('returns wallet from cache', async () => {
    const stub = sinon.stub(cache, 'get').resolves('0xabc' as any);
    const addr = await getUserWallet('user1');
    expect(stub.calledWith('wallet:user1')).to.equal(true);
    expect(addr).to.equal('0xabc');
    stub.restore();
  });
});
