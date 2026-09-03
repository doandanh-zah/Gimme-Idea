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

const BOUNTY_STATES: BountyState[] = [
  'initialized',
  'funded',
  'active',
  'winner_selected',
  'resolution',
  'settled',
  'refunded',
];

function bytesToHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
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

export function decodeBountyAccount(address: string, data: Uint8Array): OnchainBounty {
  if (data.byteLength !== BOUNTY_ACCOUNT_SIZE) {
    throw new Error(`Invalid bounty account size: ${data.byteLength}`);
  }
  if (!BOUNTY_DISCRIMINATOR.every((value, index) => data[index] === value)) {
    throw new Error('Invalid bounty account discriminator');
  }

  const winner = readPublicKey(data, 208);
  const state = BOUNTY_STATES[data[240] ?? -1];
  if (!state) throw new Error('Invalid bounty state');

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
      bountyAccount && bountyAddress
        ? decodeBountyAccount(bountyAddress, bountyAccount.data)
        : null,
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
