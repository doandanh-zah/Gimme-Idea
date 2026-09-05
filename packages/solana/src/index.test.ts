import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { Keypair, PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';
import {
  BOUNTY_ESCROW_PROGRAM_ID,
  decodeBountyEscrow,
  deriveBountyEscrowPda,
  deriveBountyIdFromUuid,
  derivePlatformConfigPda,
  deriveVaultAddress,
  formatRawTokenAmount,
  mapBountyState,
  truncateSolanaAddress,
  validateProgramId,
} from './index.js';

function toHex(value: Uint8Array) {
  return [...value].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

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

    const bounty = decodeBountyEscrow(Keypair.generate().publicKey.toBase58(), data);
    expect(bounty.state).toBe('settled');
    expect(bounty.prizePoolRaw).toBe(5_000_000n);
    expect(bounty.platformFeeRaw).toBe(100_000n);
    expect(bounty.winner).toBeNull();
  });

  it('formats token raw units and addresses for UI', () => {
    expect(formatRawTokenAmount(5_100_000n)).toBe('5.1');
    expect(truncateSolanaAddress('BB2bMK8gwrDk3YG3GFECqnwnFigDoxvKDwJZiTXtzCK6')).toBe('BB2b…zCK6');
  });

  it('derives the versioned bounty ID from canonical UUID bytes', () => {
    const id = deriveBountyIdFromUuid('550e8400-e29b-41d4-a716-446655440000');
    expect(toHex(id)).toBe('04dd7f99da52318b11d808b272e583cb3662dc7f165797e7f50820b9cead2efc');
    expect(() => deriveBountyIdFromUuid('not-a-uuid')).toThrow(/canonical/);
  });

  it('derives platform, bounty, and legacy SPL vault addresses deterministically', () => {
    const programId = new PublicKey(BOUNTY_ESCROW_PROGRAM_ID);
    const bountyId = deriveBountyIdFromUuid('123e4567-e89b-12d3-a456-426614174000');
    const platform = derivePlatformConfigPda(programId);
    const bounty = deriveBountyEscrowPda(bountyId, programId);
    const mint = Keypair.generate().publicKey;

    expect(
      platform.equals(PublicKey.findProgramAddressSync([Buffer.from('platform')], programId)[0]),
    ).toBe(true);
    expect(
      bounty.equals(
        PublicKey.findProgramAddressSync(
          [Buffer.from('bounty'), Buffer.from(bountyId)],
          programId,
        )[0],
      ),
    ).toBe(true);
    expect(
      deriveVaultAddress(mint, bounty).equals(
        getAssociatedTokenAddressSync(mint, bounty, true, TOKEN_PROGRAM_ID),
      ),
    ).toBe(true);
  });

  it('maps raw and Anchor state values and rejects unknown states', () => {
    expect(mapBountyState(4)).toBe('resolution');
    expect(mapBountyState('winnerSelected')).toBe('winner_selected');
    expect(mapBountyState({ refunded: {} })).toBe('refunded');
    expect(() => mapBountyState(99)).toThrow(/Invalid bounty state/);
  });

  it('validates the configured program identity', () => {
    expect(validateProgramId(BOUNTY_ESCROW_PROGRAM_ID).toBase58()).toBe(BOUNTY_ESCROW_PROGRAM_ID);
    expect(() => validateProgramId(Keypair.generate().publicKey)).toThrow(/Unexpected/);
  });
});
