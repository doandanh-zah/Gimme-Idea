'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';

const WalletSurface = dynamic(
  () => import('./WalletSurface').then((mod) => mod.WalletSurface),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div className="modal-panel w-full max-w-sm p-6 text-center">
          <div className="mx-auto mb-4 h-8 w-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <p className="text-sm text-gray-300">Loading wallet...</p>
        </div>
      </div>
    ),
  }
);

export function WalletSurfaceHost() {
  const { showWalletPopup } = useAuth();

  if (!showWalletPopup) {
    return null;
  }

  return <WalletSurface />;
}
