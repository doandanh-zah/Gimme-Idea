'use client';

import React from 'react';
import { Donate } from '../../components/Donate';
import { WalletRouteBoundary } from '../../components/wallet/WalletRouteBoundary';

export default function DonatePage() {
  return (
    <WalletRouteBoundary>
      <Donate />
    </WalletRouteBoundary>
  );
}
