'use client';

import React from 'react';
import { WalletProvider } from '../WalletProvider';
import { LazorkitProvider } from '@/contexts/LazorkitContext';

export function WalletRouteBoundary({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <LazorkitProvider>{children}</LazorkitProvider>
    </WalletProvider>
  );
}
