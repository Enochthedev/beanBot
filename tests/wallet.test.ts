import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { ethers } from 'ethers';

const nonce = 'beanbot-test';
const wallet = ethers.Wallet.createRandom();
let signature: string;

before(async () => {
  signature = await wallet.signMessage(nonce);
});

describe('wallet verification', () => {
  it('verifies a signed message', () => {
    const signer = ethers.verifyMessage(nonce, signature);
    expect(signer.toLowerCase()).to.equal(wallet.address.toLowerCase());
  });
});
