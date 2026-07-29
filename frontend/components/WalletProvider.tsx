'use client';

import '../polyfills';
import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  // Use mainnet by default, devnet only if explicitly set
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet' 
    ? WalletAdapterNetwork.Devnet 
    : WalletAdapterNetwork.Mainnet;
  
  // Use custom RPC if provided, otherwise use default cluster URL
  const endpoint = useMemo(() => 
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network), 
    [network]
  );

  // Phantom and Solflare register via Wallet Standard. Passing their legacy
  // adapters here duplicates them and can fight over window.solana / window.phantom.
  // An empty list still picks up Standard wallets through useStandardWalletAdapters.
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={false} localStorageKey="gimmeWalletName">
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
