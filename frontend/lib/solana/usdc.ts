import { PublicKey } from '@solana/web3.js';

// Mainnet USDC mint (legacy SPL USDC)
const USDC_MINT_MAINNET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
// Devnet USDC mint used by many demos
const USDC_MINT_DEVNET = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

export function getUsdcMintAddress(): string {
  // Allow override
  if (process.env.NEXT_PUBLIC_USDC_MINT) return process.env.NEXT_PUBLIC_USDC_MINT;

  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet' ? 'devnet' : 'mainnet';
  return network === 'devnet' ? USDC_MINT_DEVNET : USDC_MINT_MAINNET;
}

export function getUsdcMintPubkey(): PublicKey {
  return new PublicKey(getUsdcMintAddress());
}
