import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey('BB2bMK8gwrDk3YG3GFECqnwnFigDoxvKDwJZiTXtzCK6');
export const BPF_LOADER_UPGRADEABLE_PROGRAM_ID = new PublicKey(
  'BPFLoaderUpgradeab1e11111111111111111111111',
);
export const PROGRAM_DATA = new PublicKey('23EgEZUnytRFNVAdVrNFuaU3UKo9meDbJ14xhLP1f8if');
export const REQUIRED_AUTHORITY = new PublicKey('FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm');
export const RENT_RECIPIENT = new PublicKey('HrsRZ43rXfXJjLtzdyNYAVvNEZc6faQkMJwFhiHnVSUu');
export const STALE_BUFFER = new PublicKey('G9hakN238JUYe4MujZDEiwv2UGev2KRTXf6PwUFK6VGT');
export const EXPECTED_CI_EXECUTABLE_HASH =
  '4c8720ce0fd500a8d7f6a6a8459aef34e2c2a18a45729372cc7ea56975c6b503';

function instructionData(variant: number) {
  const data = new Uint8Array(4);
  new DataView(data.buffer).setUint32(0, variant, true);
  return data as unknown as Buffer;
}

export function buildCloseStaleBufferInstruction() {
  return new TransactionInstruction({
    programId: BPF_LOADER_UPGRADEABLE_PROGRAM_ID,
    keys: [
      { pubkey: STALE_BUFFER, isSigner: false, isWritable: true },
      { pubkey: RENT_RECIPIENT, isSigner: false, isWritable: true },
      { pubkey: REQUIRED_AUTHORITY, isSigner: true, isWritable: false },
    ],
    data: instructionData(5),
  });
}

export function buildUpgradeInstruction(buffer: PublicKey) {
  return new TransactionInstruction({
    programId: BPF_LOADER_UPGRADEABLE_PROGRAM_ID,
    keys: [
      { pubkey: PROGRAM_DATA, isSigner: false, isWritable: true },
      { pubkey: PROGRAM_ID, isSigner: false, isWritable: true },
      { pubkey: buffer, isSigner: false, isWritable: true },
      { pubkey: REQUIRED_AUTHORITY, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: REQUIRED_AUTHORITY, isSigner: true, isWritable: false },
    ],
    data: instructionData(3),
  });
}
