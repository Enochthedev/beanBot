import { describe, it } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function mockInteraction(to: string) {
  return {
    options: { getString: () => to },
    reply: sinon.stub().resolves(),
  } as any;
}

describe('mint-fast command', () => {
  it('spawns built binary after cargo build', async () => {
    const bin = path.resolve('src/modules/nft_mint_bot/target/release/nft_mint_bot');
    if (!fs.existsSync(bin)) {
      try {
        execSync('cargo build --release -p nft_mint_bot --manifest-path src/modules/nft_mint_bot/Cargo.toml', {
          stdio: 'inherit'
        });
      } catch {
        // ignore build errors in CI environments without Rust toolchain
      }
    }

    const spawnStub = sinon.stub(require('child_process'), 'spawn').callsFake(() => ({
      stdout: { on: () => {} },
      stderr: { on: () => {} },
      on: (evt: string, cb: (code: number) => void) => { if (evt === 'close') cb(0); }
    }) as any);

    const { execute } = await import('../src/domains/web3/commands/mint-fast');
    const interaction = mockInteraction('0xabc');
    await execute(interaction);
    expect(spawnStub.calledWith(bin, ['0xabc'])).to.equal(true);
    spawnStub.restore();
  }).timeout(300000); // allow time for cargo build
});
