import { PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';
import {
  BPF_LOADER_UPGRADEABLE_PROGRAM_ID,
  buildCloseStaleBufferInstruction,
  buildUpgradeInstruction,
  PROGRAM_DATA,
  PROGRAM_ID,
  RENT_RECIPIENT,
  REQUIRED_AUTHORITY,
  STALE_BUFFER,
} from './devnet-program-upgrade';

describe('Devnet program administration instructions', () => {
  it('uses the canonical ProgramData PDA', () => {
    const [derived] = PublicKey.findProgramAddressSync(
      [PROGRAM_ID.toBuffer()],
      BPF_LOADER_UPGRADEABLE_PROGRAM_ID,
    );
    expect(PROGRAM_DATA.equals(derived)).toBe(true);
  });

  it('closes only the stale buffer to the controlled CLI deployer', () => {
    const instruction = buildCloseStaleBufferInstruction();
    expect(instruction.programId.equals(BPF_LOADER_UPGRADEABLE_PROGRAM_ID)).toBe(true);
    expect([...instruction.data]).toEqual([5, 0, 0, 0]);
    expect(instruction.keys).toEqual([
      { pubkey: STALE_BUFFER, isSigner: false, isWritable: true },
      { pubkey: RENT_RECIPIENT, isSigner: false, isWritable: true },
      { pubkey: REQUIRED_AUTHORITY, isSigner: true, isWritable: false },
    ]);
  });

  it('builds the loader upgrade with the authority as signer and spill recipient', () => {
    const buffer = new PublicKey('11111111111111111111111111111111');
    const instruction = buildUpgradeInstruction(buffer);
    expect(instruction.programId.equals(BPF_LOADER_UPGRADEABLE_PROGRAM_ID)).toBe(true);
    expect([...instruction.data]).toEqual([3, 0, 0, 0]);
    expect(instruction.keys[0]).toEqual({
      pubkey: PROGRAM_DATA,
      isSigner: false,
      isWritable: true,
    });
    expect(instruction.keys[1]).toEqual({ pubkey: PROGRAM_ID, isSigner: false, isWritable: true });
    expect(instruction.keys[2]).toEqual({ pubkey: buffer, isSigner: false, isWritable: true });
    expect(instruction.keys[3]).toEqual({
      pubkey: REQUIRED_AUTHORITY,
      isSigner: false,
      isWritable: true,
    });
    expect(instruction.keys.at(-1)).toEqual({
      pubkey: REQUIRED_AUTHORITY,
      isSigner: true,
      isWritable: false,
    });
  });
});
