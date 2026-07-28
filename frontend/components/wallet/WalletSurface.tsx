'use client';

import React from 'react';
import { WalletProvider } from '../WalletProvider';
import { LazorkitProvider } from '@/contexts/LazorkitContext';
import { ConnectWalletPopup } from '../ConnectWalletPopup';

export function WalletSurface() {
  return (
    <WalletProvider>
      <LazorkitProvider>
        <ConnectWalletPopup />
      </LazorkitProvider>
    </WalletProvider>
  );
}
