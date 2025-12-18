'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { LazorkitProvider as LazorkitSDKProvider, useWallet as useLazorkitWallet } from '@lazorkit/wallet';
import { PublicKey } from '@solana/web3.js';

// LazorKit Configuration - Default to mainnet
const LAZORKIT_CONFIG = {
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  portalUrl: 'https://portal.lazor.sh',
  paymasterConfig: {
    paymasterUrl: process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL || 'https://kora.lazorkit.com/',
  },
};

// Context type for passkey wallet
interface PasskeyWalletContextType {
  isPasskeyConnected: boolean;
  isPasskeyConnecting: boolean;
  passkeyWalletAddress: string | null;
  smartWalletPubkey: PublicKey | null;
  connectPasskey: () => Promise<void>;
  disconnectPasskey: () => Promise<void>;
  signAndSendPasskeyTransaction: (params: {
    instructions: any[];
    transactionOptions?: {
      feeToken?: string;
      computeUnitLimit?: number;
    };
  }) => Promise<string>;
  signPasskeyMessage: (message: string) => Promise<{ signature: string; signedPayload: string }>;
}

const PasskeyWalletContext = createContext<PasskeyWalletContextType | null>(null);

// Inner component that uses LazorKit hooks
function PasskeyWalletProviderInner({ children }: { children: React.ReactNode }) {
  const {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    wallet,
    smartWalletPubkey,
    signAndSendTransaction,
    signMessage,
  } = useLazorkitWallet();

  const [passkeyWalletAddress, setPasskeyWalletAddress] = useState<string | null>(null);

  // Update wallet address when connected
  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      setPasskeyWalletAddress(smartWalletPubkey.toBase58());
    } else {
      setPasskeyWalletAddress(null);
    }
  }, [isConnected, smartWalletPubkey]);

  const connectPasskey = useCallback(async () => {
    try {
      await connect({ feeMode: 'paymaster' });
    } catch (error) {
      console.error('Passkey connect error:', error);
      throw error;
    }
  }, [connect]);

  const disconnectPasskey = useCallback(async () => {
    try {
      await disconnect();
      setPasskeyWalletAddress(null);
    } catch (error) {
      console.error('Passkey disconnect error:', error);
      throw error;
    }
  }, [disconnect]);

  const signAndSendPasskeyTransaction = useCallback(
    async (params: {
      instructions: any[];
      transactionOptions?: {
        feeToken?: string;
        computeUnitLimit?: number;
      };
    }) => {
      if (!isConnected) {
        throw new Error('Passkey wallet not connected');
      }
      return signAndSendTransaction(params);
    },
    [isConnected, signAndSendTransaction]
  );

  const signPasskeyMessage = useCallback(
    async (message: string) => {
      if (!isConnected) {
        throw new Error('Passkey wallet not connected');
      }
      return signMessage(message);
    },
    [isConnected, signMessage]
  );

  return (
    <PasskeyWalletContext.Provider
      value={{
        isPasskeyConnected: isConnected,
        isPasskeyConnecting: isConnecting,
        passkeyWalletAddress,
        smartWalletPubkey: smartWalletPubkey || null,
        connectPasskey,
        disconnectPasskey,
        signAndSendPasskeyTransaction,
        signPasskeyMessage,
      }}
    >
      {children}
    </PasskeyWalletContext.Provider>
  );
}

// Main provider that wraps LazorKit SDK
export function LazorkitProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazorkitSDKProvider
      rpcUrl={LAZORKIT_CONFIG.rpcUrl}
      portalUrl={LAZORKIT_CONFIG.portalUrl}
      paymasterConfig={LAZORKIT_CONFIG.paymasterConfig}
    >
      <PasskeyWalletProviderInner>{children}</PasskeyWalletProviderInner>
    </LazorkitSDKProvider>
  );
}

// Hook to use passkey wallet
export function usePasskeyWallet() {
  const context = useContext(PasskeyWalletContext);
  if (!context) {
    throw new Error('usePasskeyWallet must be used within LazorkitProvider');
  }
  return context;
}
