import { Keypair } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';
import { decodeBountyAccount, formatRawTokenAmount, truncateSolanaAddress } from './index.js';

describe('bounty account client', () => {
  it('decodes the fixed Anchor account layout without floating point money', () => {
    const data = new Uint8Array(266);
    data.set([59, 18, 13, 80, 225, 187, 6, 16]);
    data.set(Keypair.generate().publicKey.toBytes(), 72);
    data.set(Keypair.generate().publicKey.toBytes(), 104);
    data.set(Keypair.generate().publicKey.toBytes(), 136);
    new DataView(data.buffer).setBigUint64(168, 5_000_000n, true);
    new DataView(data.buffer).setBigUint64(176, 100_000n, true);
    new DataView(data.buffer).setBigUint64(184, 5_100_000n, true);
    data[240] = 5;
    new DataView(data.buffer).setBigInt64(241, 1_700_000_000n, true);
    new DataView(data.buffer).setBigInt64(249, 1_700_000_010n, true);
    new DataView(data.buffer).setBigInt64(257, 1_700_000_020n, true);

    const bounty = decodeBountyAccount(Keypair.generate().publicKey.toBase58(), data);
    expect(bounty.state).toBe('settled');
    expect(bounty.prizePoolRaw).toBe(5_000_000n);
    expect(bounty.platformFeeRaw).toBe(100_000n);
    expect(bounty.winner).toBeNull();
  });

  it('formats token raw units and addresses for UI', () => {
    expect(formatRawTokenAmount(5_100_000n)).toBe('5.1');
    expect(truncateSolanaAddress('BB2bMK8gwrDk3YG3GFECqnwnFigDoxvKDwJZiTXtzCK6')).toBe('BB2b…zCK6');
  });
});
