'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { LazorkitProvider as LazorkitSDKProvider, useWallet as useLazorkitWallet } from '@lazorkit/wallet';
import { PublicKey } from '@solana/web3.js';
import { api } from '../lib/api';
import type { User } from '../lib/supabase';

const LAZORKIT_CONFIG = {
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  portalUrl: 'https://portal.lazor.sh',
  paymasterConfig: {
    paymasterUrl: process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL || 'https://kora.devnet.lazorkit.com/',
  },
};

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  walletAddress: string | null;
  publicKey: PublicKey | null;
  user: User | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (params: { instructions: any[] }) => Promise<string>;
  signMessage: (message: string) => Promise<{ signature: string; signedPayload: string }>;
}

const WalletContext = createContext<WalletContextType | null>(null);

function WalletProviderInner({ children }: { children: React.ReactNode }) {
  const {
    connect: lazorConnect,
    disconnect: lazorDisconnect,
    isConnected,
    isConnecting,
    smartWalletPubkey,
    signAndSendTransaction,
    signMessage,
  } = useLazorkitWallet();

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Sync user with Supabase when wallet connects
  useEffect(() => {
    const syncUser = async () => {
      if (isConnected && smartWalletPubkey) {
        const address = smartWalletPubkey.toBase58();
        setWalletAddress(address);
        
        // Login/create user in Supabase
        const result = await api.login({ publicKey: address });
        if (result.success && result.data?.user) {
          setUser(result.data.user);
        }
      } else {
        setWalletAddress(null);
        setUser(null);
      }
    };
    
    syncUser();
  }, [isConnected, smartWalletPubkey]);

  const connect = useCallback(async () => {
    try {
      await lazorConnect({ feeMode: 'paymaster' });
    } catch (error) {
      console.error('Connect error:', error);
      throw error;
    }
  }, [lazorConnect]);

  const disconnect = useCallback(async () => {
    try {
      await lazorDisconnect();
      api.logout();
      setWalletAddress(null);
      setUser(null);
    } catch (error) {
      console.error('Disconnect error:', error);
      throw error;
    }
  }, [lazorDisconnect]);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        walletAddress,
        publicKey: smartWalletPubkey || null,
        user,
        connect,
        disconnect,
        signAndSendTransaction,
        signMessage,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazorkitSDKProvider
      rpcUrl={LAZORKIT_CONFIG.rpcUrl}
      portalUrl={LAZORKIT_CONFIG.portalUrl}
      paymasterConfig={LAZORKIT_CONFIG.paymasterConfig}
    >
      <WalletProviderInner>{children}</WalletProviderInner>
    </LazorkitSDKProvider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
