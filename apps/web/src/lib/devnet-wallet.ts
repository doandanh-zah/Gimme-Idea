export const SOLANA_NETWORK = 'devnet' as const;
export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
export const DEVNET_USDC_MINT =
  process.env.NEXT_PUBLIC_DEVNET_USDC_MINT ?? '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

const LAMPORTS_PER_SOL = 1_000_000_000n;
const USDC_BASE_UNITS = 1_000_000n;

type RpcEnvelope<T> = {
  result?: T;
  error?: { code?: number; message?: string };
};

type TokenAccountResult = {
  value: Array<{
    account?: {
      data?: {
        parsed?: {
          info?: {
            tokenAmount?: { amount?: string };
          };
        };
      };
    };
  }>;
};

export type DevnetBalances = {
  sol: string;
  usdc: string;
};

function decimalFromRawUnits(raw: bigint, unit: bigint, decimals: number) {
  const whole = raw / unit;
  const fraction = (raw % unit).toString().padStart(decimals, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

async function rpc<T>(method: string, params: unknown[], signal?: AbortSignal): Promise<T> {
  const response = await fetch(SOLANA_RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params }),
    signal,
  });
  if (!response.ok) throw new Error(`Devnet RPC returned ${response.status}.`);
  const payload = (await response.json()) as RpcEnvelope<T>;
  if (payload.error || payload.result === undefined) {
    throw new Error(payload.error?.message ?? `Devnet RPC ${method} failed.`);
  }
  return payload.result;
}

export async function fetchDevnetBalances(
  address: string,
  signal?: AbortSignal,
): Promise<DevnetBalances> {
  const [solResult, tokenResult] = await Promise.all([
    rpc<{ value: number }>('getBalance', [address, { commitment: 'confirmed' }], signal),
    rpc<TokenAccountResult>(
      'getTokenAccountsByOwner',
      [address, { mint: DEVNET_USDC_MINT }, { encoding: 'jsonParsed', commitment: 'confirmed' }],
      signal,
    ),
  ]);

  const lamports = BigInt(solResult.value);
  const usdcRaw = tokenResult.value.reduce((sum, entry) => {
    const amount = entry.account?.data?.parsed?.info?.tokenAmount?.amount;
    return amount && /^\d+$/.test(amount) ? sum + BigInt(amount) : sum;
  }, 0n);

  return {
    sol: decimalFromRawUnits(lamports, LAMPORTS_PER_SOL, 9),
    usdc: decimalFromRawUnits(usdcRaw, USDC_BASE_UNITS, 6),
  };
}

export function devnetExplorerAddressUrl(address: string) {
  return `https://explorer.solana.com/address/${encodeURIComponent(address)}?cluster=devnet`;
}
