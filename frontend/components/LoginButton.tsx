'use client';

import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { LoadingDots } from './LoadingSpinner';

export const LoginButton = () => {
  const { signInWithGoogle, signInWithWallet, isLoading } = useAuth();
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [isSigningInWallet, setIsSigningInWallet] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsSigningInGoogle(true);
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Google login error:', error);
      const message = error?.message || 'Failed to sign in with Google. Please try again.';
      if (
        String(message).toLowerCase().includes('invalid api key') ||
        String(message).toLowerCase().includes('not configured') ||
        String(message).toLowerCase().includes('3-part jwt')
      ) {
        toast.error(
          'Google sign-in misconfigured: set the full Supabase anon key on Vercel and redeploy.',
          { duration: 6000 }
        );
      } else {
        toast.error(message);
      }
      setIsSigningInGoogle(false);
    }
  };

  const handleWalletLogin = async () => {
    try {
      setIsSigningInWallet(true);
      // Prefetch wallet surface before opening so Standard adapters can
      // register before the user picks Phantom/Solflare.
      void import('@/components/wallet/WalletSurface');
      await signInWithWallet();
      setIsSigningInWallet(false);
    } catch (error: any) {
      console.error('Wallet login error:', error);
      toast.error(error?.message || 'Failed to sign in with wallet.');
      setIsSigningInWallet(false);
    }
  };

  const loadingGoogle = isLoading || isSigningInGoogle;
  const loadingWallet = isLoading || isSigningInWallet;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleWalletLogin}
        disabled={loadingWallet}
        aria-label="Sign in with wallet"
        title="Sign in with wallet"
        aria-busy={loadingWallet}
        className="flex h-10 min-w-10 items-center justify-center rounded-[4px] border border-white/15 bg-white/[0.03] px-3 text-gray-300 transition-colors hover:border-white/30 hover:bg-white/[0.05] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loadingWallet ? (
          <LoadingDots className="text-gray-300" />
        ) : (
          <Wallet className="w-4 h-4" aria-hidden="true" />
        )}
      </button>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loadingGoogle}
        aria-label="Sign in with Google"
        title="Sign in with Google"
        aria-busy={loadingGoogle}
        className="flex h-10 min-w-10 items-center justify-center gap-2 rounded-[4px] border border-[#FFD700] bg-[#FFD700] px-3 text-black transition-colors hover:bg-[#FDB931] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loadingGoogle ? (
          <LoadingDots className="text-black" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        <span className="hidden font-mono text-[11px] font-semibold uppercase tracking-[0.08em] lg:inline">
          Sign in
        </span>
      </button>
    </div>
  );
};
