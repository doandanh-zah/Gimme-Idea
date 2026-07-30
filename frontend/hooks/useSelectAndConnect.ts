'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useWallet, type Wallet } from '@solana/wallet-adapter-react';
import type { WalletName } from '@solana/wallet-adapter-base';

export type FindWalletOptions = {
  walletName: string;
  isMobileAdapter?: boolean;
};

/**
 * Find a wallet adapter by display name. Prefer Mobile Wallet Adapter when
 * requested; fall back to Phantom/Solflare on mobile if MWA is unavailable.
 */
function findWalletAdapter(
  wallets: Wallet[],
  { walletName, isMobileAdapter }: FindWalletOptions
): Wallet | undefined {
  let selected: Wallet | undefined;

  if (isMobileAdapter) {
    selected = wallets.find(
      (w) =>
        w.adapter.name.toLowerCase().includes('mobile') ||
        w.adapter.name.toLowerCase().includes('solana mobile')
    );
  } else {
    selected = wallets.find((w) =>
      w.adapter.name.toLowerCase().includes(walletName.toLowerCase())
    );
  }

  if (!selected && isMobileAdapter) {
    selected = wallets.find(
      (w) =>
        w.adapter.name.toLowerCase().includes('phantom') ||
        w.adapter.name.toLowerCase().includes('solflare')
    );
  }

  return selected;
}

type PendingConnect = {
  walletName: WalletName;
  resolve: () => void;
  reject: (error: unknown) => void;
};

/**
 * Reliably select + connect a wallet without the classic race where
 * `select()` updates React state and an immediate `connect()` throws
 * WalletNotSelectedError because the selected adapter has not committed yet.
 */
export function useSelectAndConnect() {
  const { wallets, select, connect, wallet, connected } = useWallet();
  const pendingRef = useRef<PendingConnect | null>(null);
  const connectRef = useRef(connect);
  connectRef.current = connect;

  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending || !wallet) return;
    if (wallet.adapter.name !== pending.walletName) return;

    pendingRef.current = null;

    if (wallet.adapter.connected || connected) {
      pending.resolve();
      return;
    }

    connectRef
      .current()
      .then(() => pending.resolve())
      .catch((error) => pending.reject(error));
  }, [wallet, connected]);

  const selectAndConnect = useCallback(
    async (options: FindWalletOptions): Promise<Wallet> => {
      const selected = findWalletAdapter(wallets, options);
      if (!selected) {
        throw new Error(
          `${options.walletName} wallet not found. Please install a Solana wallet app.`
        );
      }

      const walletName = selected.adapter.name as WalletName;

      // Already selected and connected — nothing to do.
      if (wallet?.adapter.name === walletName && (wallet.adapter.connected || connected)) {
        return selected;
      }

      // Already selected but not connected — connect immediately.
      if (wallet?.adapter.name === walletName) {
        await connectRef.current();
        return selected;
      }

      await new Promise<void>((resolve, reject) => {
        pendingRef.current = { walletName, resolve, reject };
        select(walletName);

        // Safety timeout so a stuck pending select does not hang the UI forever.
        window.setTimeout(() => {
          if (pendingRef.current?.walletName === walletName) {
            pendingRef.current = null;
            reject(new Error('Wallet selection timed out. Please try again.'));
          }
        }, 15000);
      });

      return selected;
    },
    [wallets, select, wallet, connected]
  );

  return { wallets, selectAndConnect, findWalletAdapter: (opts: FindWalletOptions) => findWalletAdapter(wallets, opts) };
}
