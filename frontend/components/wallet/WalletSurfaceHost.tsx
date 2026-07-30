'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const loadWalletSurface = () =>
  import('./WalletSurface').then((mod) => mod.WalletSurface);

const WalletSurface = dynamic(loadWalletSurface, {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="modal-panel w-full max-w-sm p-6 text-center">
        <div className="mx-auto mb-4 h-8 w-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <p className="text-sm text-gray-300">Loading wallet...</p>
      </div>
    </div>
  ),
});

/**
 * Mount wallet providers only when the connect popup is open (ADR 0001),
 * but prefetch the chunk as soon as auth is ready so the first connect
 * click does not race Wallet Standard registration.
 */
export function WalletSurfaceHost() {
  const { showWalletPopup, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || typeof window === 'undefined') return;
    // Warm the dynamic import + give Standard wallets time to register
    // before the user opens the popup.
    const idle = (window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    }).requestIdleCallback;
    if (idle) {
      const id = idle(() => {
        void loadWalletSurface();
      }, { timeout: 2500 });
      return () => {
        (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
      };
    }
    const timer = window.setTimeout(() => {
      void loadWalletSurface();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  if (!showWalletPopup) {
    return null;
  }

  return <WalletSurface />;
}
