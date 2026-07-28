'use client';

import React from 'react';
import { Profile } from '../../components/Profile';
import { WalletRouteBoundary } from '../../components/wallet/WalletRouteBoundary';

export default function ProfilePage() {
  return (
    <WalletRouteBoundary>
      <Profile />
    </WalletRouteBoundary>
  );
}
