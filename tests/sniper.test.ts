import { describe, it } from 'mocha';
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';

describe('coin sniper script', () => {
  it('exists at expected path', () => {
    const script = path.resolve('src/modules/coin_sniper/sniper.py');
    expect(fs.existsSync(script)).to.equal(true);
  });
});
