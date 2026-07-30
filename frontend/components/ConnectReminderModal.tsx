'use client';

import React from 'react';
import { Wallet, X, ArrowRight, Lock } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useAuth } from '../contexts/AuthContext';
import { LoadingDots } from './LoadingSpinner';

export const ConnectReminderModal = () => {
  const isConnectReminderOpen = useAppStore((state) => state.isConnectReminderOpen);
  const closeConnectReminder = useAppStore((state) => state.closeConnectReminder);
  const { signInWithGoogle, signInWithWallet } = useAuth();
  const [isSigningInGoogle, setIsSigningInGoogle] = React.useState(false);
  const [isSigningInWallet, setIsSigningInWallet] = React.useState(false);

  React.useEffect(() => {
    if (!isConnectReminderOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeConnectReminder();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeConnectReminder, isConnectReminderOpen]);

  if (!isConnectReminderOpen) return null;

  const handleGoogleSignIn = async () => {
    closeConnectReminder();
    try {
      setIsSigningInGoogle(true);
      await signInWithGoogle();
      setIsSigningInGoogle(false);
    } catch (error) {
      console.error('Sign in error:', error);
      setIsSigningInGoogle(false);
    }
  };

  const handleWalletSignIn = async () => {
    closeConnectReminder();
    try {
      setIsSigningInWallet(true);
      await signInWithWallet();
      setIsSigningInWallet(false);
    } catch (error) {
      console.error('Wallet sign in error:', error);
      setIsSigningInWallet(false);
    }
  };

  const loadingGoogle = isSigningInGoogle;
  const loadingWallet = isSigningInWallet;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={closeConnectReminder}
        className="absolute inset-0 modal-overlay"
      />

      <div
        className="modal-panel relative w-full max-w-md overflow-hidden border-l-2 border-l-[#FFD700]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="connect-reminder-title"
        aria-describedby="connect-reminder-description"
      >
        <button
          type="button"
          aria-label="Close sign in dialog"
          onClick={closeConnectReminder}
          className="absolute right-3 top-3 z-20 flex min-h-[40px] min-w-[40px] items-center justify-center text-gray-500 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="ui-eyebrow mb-5">Access</div>
          <div className="mb-2 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/10 bg-[#111]">
              <Lock className="w-4 h-4 text-[#FFD700]" />
            </div>
            <div>
              <h2 id="connect-reminder-title" className="font-display text-2xl font-bold tracking-tight text-white">
                Sign in required
              </h2>
              <p id="connect-reminder-description" className="mt-2 text-sm leading-relaxed text-gray-400">
                You must sign in to post projects, ideas, or send donations.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-2.5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loadingGoogle}
              aria-busy={loadingGoogle}
              className="btn-primary w-full"
            >
              {loadingGoogle ? (
                <LoadingDots className="text-black" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Sign in with Google
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleWalletSignIn}
              disabled={loadingWallet}
              aria-busy={loadingWallet}
              className="btn-ghost w-full"
            >
              {loadingWallet ? (
                <LoadingDots className="text-white" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              Sign in with wallet
            </button>

            <button
              type="button"
              onClick={closeConnectReminder}
              className="mt-2 min-h-[40px] w-full py-2 font-mono text-xs uppercase tracking-wider text-gray-600 transition-colors hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
