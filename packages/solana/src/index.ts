import { sha256 } from '@noble/hashes/sha256';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';

export const BOUNTY_ESCROW_PROGRAM_ID =
  process.env.NEXT_PUBLIC_BOUNTY_PROGRAM_ID?.trim() ||
  'BB2bMK8gwrDk3YG3GFECqnwnFigDoxvKDwJZiTXtzCK6';
export const DEVNET_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() || 'https://api.devnet.solana.com';
export const DEVNET_DEMO_BOUNTY_ADDRESS =
  process.env.NEXT_PUBLIC_BOUNTY_DEMO_ACCOUNT?.trim() ||
  'Fgu2x9AJkF7183BoQ2c9gXUbN588wBSAinGqoQssMzR';

const BOUNTY_DISCRIMINATOR = Uint8Array.from([59, 18, 13, 80, 225, 187, 6, 16]);
const BOUNTY_ACCOUNT_SIZE = 266;
const PLATFORM_SEED = new TextEncoder().encode('platform');
const BOUNTY_SEED = new TextEncoder().encode('bounty');
const BOUNTY_ID_DOMAIN = new TextEncoder().encode('GIMME_IDEA_BOUNTY_V1');
const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export type BountyState =
  'initialized' | 'funded' | 'active' | 'winner_selected' | 'resolution' | 'settled' | 'refunded';

export type OnchainBounty = {
  address: string;
  bountyIdHex: string;
  termsHashHex: string;
  sponsor: string;
  judge: string;
  mint: string;
  prizePoolRaw: bigint;
  platformFeeRaw: bigint;
  totalDepositedRaw: bigint;
  submissionDeadline: number;
  judgingDeadline: number;
  winner: string | null;
  state: BountyState;
  createdAt: number;
  activatedAt: number | null;
  settledAt: number | null;
};

export type DevnetBountySnapshot = {
  programDeployed: boolean;
  bounty: OnchainBounty | null;
  fetchedAt: string;
};

export const BOUNTY_STATES: readonly BountyState[] = [
  'initialized',
  'funded',
  'active',
  'winner_selected',
  'resolution',
  'settled',
  'refunded',
];

type PublicKeyInput = PublicKey | string;

function toPublicKey(value: PublicKeyInput, label: string) {
  try {
    return value instanceof PublicKey ? value : new PublicKey(value);
  } catch {
    throw new Error(`Invalid ${label}`);
  }
}

export function validateProgramId(
  value: PublicKeyInput,
  expected: PublicKeyInput = BOUNTY_ESCROW_PROGRAM_ID,
) {
  const programId = toPublicKey(value, 'program ID');
  const expectedProgramId = toPublicKey(expected, 'expected program ID');
  if (!programId.equals(expectedProgramId)) {
    throw new Error(
      `Unexpected bounty escrow program ID: ${programId.toBase58()}; expected ${expectedProgramId.toBase58()}`,
    );
  }
  return programId;
}

export function derivePlatformConfigPda(programId: PublicKeyInput = BOUNTY_ESCROW_PROGRAM_ID) {
  return PublicKey.findProgramAddressSync([PLATFORM_SEED], toPublicKey(programId, 'program ID'))[0];
}

export function deriveBountyIdFromUuid(uuid: string) {
  if (!UUID_PATTERN.test(uuid)) throw new Error('Bounty UUID must use canonical 8-4-4-4-12 form');
  const hex = uuid.replaceAll('-', '');
  const uuidBytes = Uint8Array.from({ length: 16 }, (_, index) =>
    Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16),
  );
  const input = new Uint8Array(BOUNTY_ID_DOMAIN.length + uuidBytes.length);
  input.set(BOUNTY_ID_DOMAIN);
  input.set(uuidBytes, BOUNTY_ID_DOMAIN.length);
  return sha256(input);
}

export function deriveBountyEscrowPda(
  bountyId: Uint8Array,
  programId: PublicKeyInput = BOUNTY_ESCROW_PROGRAM_ID,
) {
  if (bountyId.byteLength !== 32) throw new Error('Bounty ID must be exactly 32 bytes');
  return PublicKey.findProgramAddressSync(
    [BOUNTY_SEED, bountyId],
    toPublicKey(programId, 'program ID'),
  )[0];
}

export function deriveVaultAddress(mint: PublicKeyInput, bounty: PublicKeyInput) {
  return getAssociatedTokenAddressSync(
    toPublicKey(mint, 'mint'),
    toPublicKey(bounty, 'bounty'),
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
}

export function mapBountyState(value: number | string | Record<string, unknown>): BountyState {
  if (typeof value === 'number') {
    const state = BOUNTY_STATES[value];
    if (state) return state;
  } else {
    const raw = typeof value === 'string' ? value : (Object.keys(value)[0] ?? '');
    const normalized = raw
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/[ -]/g, '_')
      .toLowerCase();
    if ((BOUNTY_STATES as readonly string[]).includes(normalized)) {
      return normalized as BountyState;
    }
  }
  throw new Error('Invalid bounty state');
}

function bytesToHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalValue(entry)]),
    );
  }
  if (typeof value === 'number' && !Number.isSafeInteger(value)) {
    throw new Error('Canonical bounty terms cannot contain unsafe numbers. Use integer strings.');
  }
  return value;
}

export function canonicalizeBountyTerms(terms: Record<string, unknown>) {
  return JSON.stringify(canonicalValue(terms));
}

export function hashBountyTerms(terms: Record<string, unknown>) {
  return bytesToHex(sha256(new TextEncoder().encode(canonicalizeBountyTerms(terms))));
}

function readU64(data: Uint8Array, offset: number) {
  return new DataView(data.buffer, data.byteOffset, data.byteLength).getBigUint64(offset, true);
}

function readI64(data: Uint8Array, offset: number) {
  return Number(
    new DataView(data.buffer, data.byteOffset, data.byteLength).getBigInt64(offset, true),
  );
}

function readPublicKey(data: Uint8Array, offset: number) {
  return new PublicKey(data.slice(offset, offset + 32)).toBase58();
}

function isZeroPublicKey(value: string) {
  return value === '11111111111111111111111111111111';
}

export function decodeBountyEscrow(address: string, data: Uint8Array): OnchainBounty {
  toPublicKey(address, 'bounty address');
  if (data.byteLength !== BOUNTY_ACCOUNT_SIZE) {
    throw new Error(`Invalid bounty account size: ${data.byteLength}`);
  }
  if (!BOUNTY_DISCRIMINATOR.every((value, index) => data[index] === value)) {
    throw new Error('Invalid bounty account discriminator');
  }

  const winner = readPublicKey(data, 208);
  const state = mapBountyState(data[240] ?? -1);

  return {
    address,
    bountyIdHex: bytesToHex(data.slice(8, 40)),
    termsHashHex: bytesToHex(data.slice(40, 72)),
    sponsor: readPublicKey(data, 72),
    judge: readPublicKey(data, 104),
    mint: readPublicKey(data, 136),
    prizePoolRaw: readU64(data, 168),
    platformFeeRaw: readU64(data, 176),
    totalDepositedRaw: readU64(data, 184),
    submissionDeadline: readI64(data, 192),
    judgingDeadline: readI64(data, 200),
    winner: isZeroPublicKey(winner) ? null : winner,
    state,
    createdAt: readI64(data, 241),
    activatedAt: readI64(data, 249) || null,
    settledAt: readI64(data, 257) || null,
  };
}

/** @deprecated Use decodeBountyEscrow. */
export const decodeBountyAccount = decodeBountyEscrow;

export async function fetchDevnetBountySnapshot(
  bountyAddress = DEVNET_DEMO_BOUNTY_ADDRESS,
): Promise<DevnetBountySnapshot> {
  const connection = new Connection(DEVNET_RPC_URL, 'confirmed');
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Devnet RPC timed out')), 8_000);
  });
  let programAccount;
  let bountyAccount;
  try {
    [programAccount, bountyAccount] = await Promise.race([
      Promise.all([
        connection.getAccountInfo(new PublicKey(BOUNTY_ESCROW_PROGRAM_ID)),
        bountyAddress
          ? connection.getAccountInfo(new PublicKey(bountyAddress))
          : Promise.resolve(null),
      ]),
      timeout,
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  return {
    programDeployed: Boolean(programAccount?.executable),
    bounty:
      bountyAccount && bountyAddress ? decodeBountyEscrow(bountyAddress, bountyAccount.data) : null,
    fetchedAt: new Date().toISOString(),
  };
}

export function formatRawTokenAmount(rawAmount: bigint, decimals = 6) {
  const negative = rawAmount < 0n;
  const absolute = negative ? -rawAmount : rawAmount;
  const scale = 10n ** BigInt(decimals);
  const whole = absolute / scale;
  const fraction = (absolute % scale).toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}

export function truncateSolanaAddress(address: string, chars = 4) {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

export function devnetExplorerUrl(type: 'address' | 'tx', value: string) {
  return `https://explorer.solana.com/${type}/${value}?cluster=devnet`;
}
