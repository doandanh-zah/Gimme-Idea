'use client';

import { AnchorProvider } from '@coral-xyz/anchor';
import type { Connection } from '@solana/web3.js';
import type { WalletContextState } from '@solana/wallet-adapter-react';

// MetaDAO SDK (futarchy)
import { FutarchyClient } from '@metadaoproject/futarchy/v0.7';

export function makeAnchorProvider(connection: Connection, wallet: WalletContextState) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  // wallet-adapter WalletContextState is compatible enough for AnchorProvider
  // Anchor expects: publicKey, signTransaction, signAllTransactions
  const anchorWallet: any = {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction,
    signAllTransactions: wallet.signAllTransactions,
  };

  return new AnchorProvider(connection as any, anchorWallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });
}

export function makeFutarchyClient(connection: Connection, wallet: WalletContextState) {
  const provider = makeAnchorProvider(connection, wallet);
  return FutarchyClient.createClient({ provider });
}
