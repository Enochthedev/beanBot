import { describe, it } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { cache } from '../src/lib/cache';
import { execute as connect } from '../src/domains/web3/commands/connect-wallet';
import { execute as confirm } from '../src/domains/web3/commands/confirm-wallet';
import { ethers } from 'ethers';

function mockInteraction(opts: any) {
  return {
    options: {
      getString: (name: string, req: boolean) => opts[name],
    },
    user: { id: 'user1' },
    reply: sinon.stub().resolves(),
  } as any;
}

describe('wallet connect flow', () => {
  it('generates nonce and verifies signature', async () => {
    const wallet = ethers.Wallet.createRandom();
    const address = wallet.address;
    const setStub = sinon.stub(cache, 'set').resolves();
    const interaction = mockInteraction({ address });
    await connect(interaction);
    expect(setStub.calledOnce).to.equal(true);
    const nonce = setStub.firstCall.args[1].nonce;
    const pending = { address, nonce };

    sinon.stub(cache, 'get').resolves(pending as any);
    const signed = await wallet.signMessage(nonce);
    (interaction.options.getString as any) = () => signed;
    const del = sinon.stub(cache, 'del').resolves();
    await confirm(interaction);
    expect(setStub.calledTwice).to.equal(true);
    expect(setStub.secondCall.args[0]).to.equal('wallet:user1');
    expect(setStub.secondCall.args[1]).to.equal(pending.address);
    expect(del.calledWith('wallet_nonce:user1')).to.equal(true);
    (cache.get as any).restore();
    setStub.restore();
    del.restore();
  });
});
