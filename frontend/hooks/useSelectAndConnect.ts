'use client';

import { useCallback, useRef } from 'react';
import { useWallet, type Wallet } from '@solana/wallet-adapter-react';
import type { Adapter, WalletName } from '@solana/wallet-adapter-base';
import { WalletReadyState } from '@solana/wallet-adapter-base';

export type FindWalletOptions = {
  walletName: string;
  isMobileAdapter?: boolean;
};

const SELECT_TIMEOUT_MS = 15_000;
const CONNECT_TIMEOUT_MS = 60_000;
const POLL_MS = 50;

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

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

function isAdapterReady(adapter: Adapter, readyState: WalletReadyState) {
  return (
    readyState === WalletReadyState.Installed ||
    readyState === WalletReadyState.Loadable ||
    adapter.readyState === WalletReadyState.Installed ||
    adapter.readyState === WalletReadyState.Loadable
  );
}

/**
 * Reliably select + connect a wallet without the classic race where
 * `select()` updates React state and an immediate `connect()` throws
 * WalletNotSelectedError, or where adapter-level connection is already
 * established but React `connected`/`publicKey` never re-sync after a
 * lazy WalletProvider remount.
 *
 * Strategy (aligned with current wallet-adapter + Wallet Standard usage):
 * 1. Resolve the target adapter from the wallets list
 * 2. `select(name)` and wait until the provider commits that selection
 * 3. Call `adapter.connect()` on the selected adapter instance (not only
 *    the context `connect()`, which can no-op when adapter.connected is
 *    already true without emitting events)
 * 4. Resolve only once `adapter.publicKey` is available
 */
export function useSelectAndConnect() {
  const { wallets, select, wallet, connected } = useWallet();
  const walletRef = useRef(wallet);
  const walletsRef = useRef(wallets);
  walletRef.current = wallet;
  walletsRef.current = wallets;

  const waitForSelectedWallet = useCallback(
    async (walletName: WalletName, adapter: Adapter): Promise<Wallet> => {
      const deadline = Date.now() + SELECT_TIMEOUT_MS;

      while (Date.now() < deadline) {
        const current = walletRef.current;
        if (current && current.adapter.name === walletName) {
          return current;
        }

        // Provider may not have re-rendered yet; adapter instance is still valid.
        const fromList = walletsRef.current.find((w) => w.adapter === adapter);
        if (fromList && walletRef.current?.adapter.name === walletName) {
          return fromList;
        }

        await sleep(POLL_MS);
      }

      // Last chance: selection may have committed without matching our ref timing.
      const latest = walletRef.current;
      if (latest && latest.adapter.name === walletName) {
        return latest;
      }

      throw new Error('Wallet selection timed out. Please try again.');
    },
    []
  );

  const ensureAdapterConnected = useCallback(async (adapter: Adapter) => {
    if (adapter.publicKey) {
      return;
    }

    if (!isAdapterReady(adapter, adapter.readyState)) {
      // Brief wait for Wallet Standard readyState to settle after provider mount.
      const readyDeadline = Date.now() + 3_000;
      while (Date.now() < readyDeadline && !isAdapterReady(adapter, adapter.readyState)) {
        await sleep(POLL_MS);
      }
    }

    if (!isAdapterReady(adapter, adapter.readyState)) {
      throw new Error(
        `${adapter.name} is not ready. Unlock the extension and try again.`
      );
    }

    // Connect via the adapter instance so we do not depend on React state
    // catching up. If already connected, many adapters resolve without a
    // new popup; we still verify publicKey below.
    if (!adapter.connected || !adapter.publicKey) {
      const connectPromise = adapter.connect();
      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => {
          reject(new Error('Wallet connection timed out. Please try again.'));
        }, CONNECT_TIMEOUT_MS);
      });
      await Promise.race([connectPromise, timeoutPromise]);
    }

    const pubkeyDeadline = Date.now() + 5_000;
    while (!adapter.publicKey && Date.now() < pubkeyDeadline) {
      await sleep(POLL_MS);
    }

    if (!adapter.publicKey) {
      throw new Error(
        'Wallet connected but no public key was returned. Please try again.'
      );
    }
  }, []);

  const selectAndConnect = useCallback(
    async (options: FindWalletOptions): Promise<Wallet> => {
      const selected = findWalletAdapter(walletsRef.current, options);
      if (!selected) {
        throw new Error(
          `${options.walletName} wallet not found. Please install a Solana wallet extension or app.`
        );
      }

      const walletName = selected.adapter.name as WalletName;
      const adapter = selected.adapter;

      // Already selected in provider and adapter has a key — done.
      if (
        walletRef.current?.adapter.name === walletName &&
        (adapter.publicKey || (connected && walletRef.current.adapter.publicKey))
      ) {
        if (!adapter.publicKey && walletRef.current.adapter.publicKey) {
          return walletRef.current;
        }
        if (adapter.publicKey) {
          return selected;
        }
      }

      // Select when needed. changeWallet no-ops if name already matches.
      if (walletRef.current?.adapter.name !== walletName) {
        select(walletName);
        await waitForSelectedWallet(walletName, adapter);
      }

      // One retry: first connect can fail when Standard wallets register
      // slightly after the lazy WalletProvider mounts, or when a previous
      // provider teardown left the extension in a half-connected state.
      let lastError: unknown;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          await ensureAdapterConnected(adapter);
          const committed =
            walletRef.current?.adapter.name === walletName
              ? walletRef.current
              : selected;
          return committed;
        } catch (error) {
          lastError = error;
          const message = error instanceof Error ? error.message : String(error);
          const retryable =
            message.includes('WalletNotSelected') ||
            message.includes('not ready') ||
            message.includes('timed out') ||
            message.includes('Unexpected error');

          if (!retryable || attempt === 1) {
            throw error;
          }

          // Re-select then retry connect once.
          select(walletName);
          await waitForSelectedWallet(walletName, adapter);
          await sleep(150);
        }
      }

      throw lastError instanceof Error
        ? lastError
        : new Error('Failed to connect wallet');
    },
    [connected, ensureAdapterConnected, select, waitForSelectedWallet]
  );

  return {
    wallets,
    selectAndConnect,
    findWalletAdapter: (opts: FindWalletOptions) => findWalletAdapter(wallets, opts),
  };
}
