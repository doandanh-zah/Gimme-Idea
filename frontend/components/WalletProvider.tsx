'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import { 
  SolanaMobileWalletAdapter,
  createDefaultAddressSelector,
  createDefaultAuthorizationResultCache,
  createDefaultWalletNotFoundHandler,
} from '@solana-mobile/wallet-adapter-mobile';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// Helper to detect mobile browser
const isMobileBrowser = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
};

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  // Use mainnet for production, devnet for development
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta' 
    ? WalletAdapterNetwork.Mainnet 
    : WalletAdapterNetwork.Devnet;
  
  // Use custom RPC if provided, otherwise use default cluster URL
  const endpoint = useMemo(() => 
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network), 
    [network]
  );

  // Detect mobile on client
  useEffect(() => {
    setIsMobile(isMobileBrowser());
  }, []);

  // Configure supported wallets - include Mobile Wallet Adapter for mobile devices
  const wallets = useMemo(
    () => {
      const baseWallets = [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
      ];
      
      // Add Mobile Wallet Adapter for mobile browsers
      // This enables deep linking to wallet apps on mobile
      if (isMobile) {
        const getUriForAppIdentity = () => {
          if (typeof window === 'undefined') return 'https://gimme-idea.vercel.app';
          return window.location.origin;
        };
        
        return [
          new SolanaMobileWalletAdapter({
            addressSelector: createDefaultAddressSelector(),
            appIdentity: {
              name: 'GimmeIdea',
              uri: getUriForAppIdentity(),
              icon: `${getUriForAppIdentity()}/icon.png`,
            },
            authorizationResultCache: createDefaultAuthorizationResultCache(),
            chain: network === WalletAdapterNetwork.Mainnet ? 'solana:mainnet' : 'solana:devnet',
            onWalletNotFound: createDefaultWalletNotFoundHandler(),
          }),
          ...baseWallets,
        ];
      }
      
      return baseWallets;
    },
    [isMobile, network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
