'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Wallet, AlertTriangle, ArrowLeft, Smartphone, Fingerprint } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePasskeyWallet } from '@/contexts/LazorkitContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSelectAndConnect } from '@/hooks/useSelectAndConnect';
import { apiClient } from '@/lib/api-client';
import { markBackendSessionPresent } from '@/lib/session';
import { LoadingLightbulb } from './LoadingLightbulb';
import { LoadingDots } from './LoadingSpinner';
import toast from 'react-hot-toast';
import bs58 from 'bs58';

type Step = 'initial' | 'warning' | 'select-wallet' | 'connecting' | 'connecting-passkey';

// Key to track if user has dismissed the popup before
const WALLET_POPUP_DISMISSED_KEY = 'gimme_wallet_popup_dismissed';

// Helper to detect mobile browser
const isMobileBrowser = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
};

export const ConnectWalletPopup = () => {
  const [step, setStep] = useState<Step>('initial');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const {
    showWalletPopup,
    setShowWalletPopup,
    setShowWalletEmailPopup,
    setIsNewUser,
    user,
    setUser,
    refreshUser,
    signInWithGoogle,
    isLoading,
  } = useAuth();
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const { wallets, selectAndConnect } = useSelectAndConnect();
  const { isPasskeyConnected, passkeyWalletAddress, connectPasskey, disconnectPasskey, signPasskeyMessage, isPasskeyConnecting } = usePasskeyWallet();
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  
  // Flag to prevent multiple API calls
  const isLinkingRef = useRef(false);

  // Check if user has dismissed popup before
  useEffect(() => {
    if (showWalletPopup && typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(WALLET_POPUP_DISMISSED_KEY);
      if (dismissed === 'true') {
        // Show minimized version instead
        setIsMinimized(true);
      } else {
        setIsMinimized(false);
      }
    }
  }, [showWalletPopup]);

  // Detect mobile browser
  useEffect(() => {
    setIsMobile(isMobileBrowser());
  }, []);

  // Reset step when popup opens
  useEffect(() => {
    if (showWalletPopup) {
      setStep('initial');
      isLinkingRef.current = false;
    }
  }, [showWalletPopup]);

  // Handle wallet connection, then either link to an email account or sign in wallet-first.
  useEffect(() => {
    const linkWalletToAccount = async () => {
      // Prevent multiple calls
      if (isLinkingRef.current) return;
      
      if (step === 'connecting' && connected && publicKey && signMessage) {
        isLinkingRef.current = true;
        
        try {
          const timestamp = new Date().toISOString();
          const walletAddress = publicKey.toBase58();
          const message = user
            ? `Link wallet to GimmeIdea\n\nTimestamp: ${timestamp}\nWallet: ${walletAddress}\nEmail: ${user.email}`
            : `Sign in to GimmeIdea\n\nTimestamp: ${timestamp}\nWallet: ${walletAddress}`;

          const encodedMessage = new TextEncoder().encode(message);
          const signature = await signMessage(encodedMessage);
          const signatureBase58 = bs58.encode(signature);

          if (!user) {
            const response = await apiClient.login({
              publicKey: walletAddress,
              signature: signatureBase58,
              message,
            });

            if (!response.success || !response.data) {
              throw new Error(response.error || 'Wallet login failed');
            }

            markBackendSessionPresent();

            const userData = {
              id: response.data.user.id,
              wallet: response.data.user.wallet || walletAddress,
              username: response.data.user.username,
              reputation: response.data.user.reputationScore || 0,
              balance: response.data.user.balance || 0,
              projects: [],
              avatar: response.data.user.avatar,
              coverImage: response.data.user.coverImage,
              bio: response.data.user.bio,
              socials: response.data.user.socialLinks,
              email: response.data.user.email,
              authProvider: response.data.user.authProvider || 'wallet',
              authId: response.data.user.authId,
              needsWalletConnect: response.data.user.needsWalletConnect || false,
            };

            setUser(userData);
            setIsNewUser((response.data.user.loginCount || 0) <= 1);
            setShowWalletEmailPopup((userData.authProvider || 'wallet') === 'wallet' && !userData.email);
            setShowWalletPopup(false);
            toast.success('Signed in with wallet');
          } else {
            const response = await apiClient.linkWallet({
              walletAddress,
              signature: signatureBase58,
              message,
            });

            if (response.success && response.data) {
              setUser({
                ...user,
                wallet: walletAddress,
                needsWalletConnect: false,
                reputation: response.data.user.reputationScore || user.reputation,
                balance: response.data.user.balance || user.balance,
              });

              if (response.data.merged) {
                toast.success('Wallet linked & data merged from existing account!', { duration: 5000 });
              } else {
                toast.success('Wallet connected successfully!');
              }

              setIsNewUser(false);
              setShowWalletPopup(false);
            } else {
              throw new Error(response.error || 'Failed to link wallet');
            }
          }
        } catch (error: any) {
          console.error('Wallet auth error:', error);
          
          if (error.message?.includes('User rejected') || error.message?.includes('canceled')) {
            toast.error('Signature cancelled');
          } else {
            toast.error(error.message || 'Wallet authentication failed');
          }
          
          // Reset flag and disconnect
          isLinkingRef.current = false;
          await disconnect();
          setStep('select-wallet');
        }
      }
    };

    linkWalletToAccount();
  }, [step, connected, publicKey, signMessage, user, setUser, setIsNewUser, setShowWalletEmailPopup, setShowWalletPopup, disconnect]);

  // Handle Passkey wallet connection and linking
  useEffect(() => {
    const linkPasskeyWalletToAccount = async () => {
      if (isLinkingRef.current) return;
      
      if (step === 'connecting-passkey' && isPasskeyConnected && passkeyWalletAddress && !user) {
        isLinkingRef.current = true;
        toast.error('Sign in with Google first, then link a passkey wallet.');
        await disconnectPasskey();
        isLinkingRef.current = false;
        setStep('select-wallet');
        return;
      }

      if (step === 'connecting-passkey' && isPasskeyConnected && passkeyWalletAddress && user) {
        isLinkingRef.current = true;
        
        try {
          // Create message for signing
          const timestamp = new Date().toISOString();
          const message = `Link wallet to GimmeIdea\n\nTimestamp: ${timestamp}\nWallet: ${passkeyWalletAddress}\nEmail: ${user.email}`;
          
          // Request signature from passkey wallet
          // signPasskeyMessage returns { signature, signedPayload } for WebAuthn
          const { signature, signedPayload } = await signPasskeyMessage(message);

          // Send to backend with passkey-specific data
          const response = await apiClient.linkWallet({
            walletAddress: passkeyWalletAddress,
            signature,
            message,
            signedPayload, // Required for passkey verification
            isPasskey: true, // Flag to use P256 verification
          });

          if (response.success && response.data) {
            setUser({
              ...user,
              wallet: passkeyWalletAddress,
              needsWalletConnect: false,
              reputation: response.data.user.reputationScore || user.reputation,
              balance: response.data.user.balance || user.balance,
            });

            if (response.data.merged) {
              toast.success('Passkey wallet linked & data merged!', { duration: 5000 });
            } else {
              toast.success('Passkey wallet connected successfully!');
            }

            setIsNewUser(false);
            setShowWalletPopup(false);
          } else {
            throw new Error(response.error || 'Failed to link passkey wallet');
          }
        } catch (error: any) {
          console.error('Link passkey wallet error:', error);
          
          if (error.message?.includes('User rejected') || error.message?.includes('canceled') || error.message?.includes('cancelled')) {
            toast.error('Passkey authentication cancelled');
          } else {
            toast.error(error.message || 'Failed to link passkey wallet');
          }
          
          isLinkingRef.current = false;
          await disconnectPasskey();
          setStep('select-wallet');
        }
      }
    };

    linkPasskeyWalletToAccount();
  }, [step, isPasskeyConnected, passkeyWalletAddress, signPasskeyMessage, user, setUser, setIsNewUser, setShowWalletPopup, disconnectPasskey]);

  const handleConnect = async (walletName: string, isMobileAdapter?: boolean) => {
    try {
      setStep('connecting');
      // select() is async React state — useSelectAndConnect waits for the
      // selected adapter before calling connect(), avoiding WalletNotSelectedError.
      await selectAndConnect({ walletName, isMobileAdapter });
    } catch (error: any) {
      // Ignore errors from other wallet extensions (like MetaMask)
      if (error.message?.includes('MetaMask') || 
          error.message?.includes('Ethereum')) {
        setStep('select-wallet');
        return;
      }
      
      console.error('Wallet connection error:', error);
      
      if (error.message?.includes('not found')) {
        toast.error(error.message);
      } else if (error.message?.includes('User rejected') || error.message?.includes('canceled') || error.message?.includes('cancelled')) {
        toast.error('Connection cancelled');
      } else {
        toast.error('Failed to connect wallet');
      }
      
      setStep('select-wallet');
    }
  };

  const handlePasskeyConnect = async () => {
    try {
      setStep('connecting-passkey');
      await connectPasskey();
    } catch (error: any) {
      console.error('Passkey connection error:', error);
      
      if (error.message?.includes('User rejected') || error.message?.includes('canceled') || error.message?.includes('cancelled')) {
        toast.error('Passkey authentication cancelled');
      } else if (error.message?.includes('not supported')) {
        toast.error('Passkey not supported on this device');
      } else {
        toast.error('Failed to connect with Passkey');
      }
      
      setStep('select-wallet');
    }
  };

  const handleSkip = () => {
    setStep('warning');
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningInGoogle(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign in error:', error);
      setIsSigningInGoogle(false);
    }
  };

  const handleUnderstood = () => {
    // Mark as dismissed so next time shows minimized version
    if (typeof window !== 'undefined') {
      localStorage.setItem(WALLET_POPUP_DISMISSED_KEY, 'true');
    }
    setIsNewUser(false);
    setShowWalletPopup(false);
  };

  const handleDismissMinimized = () => {
    setShowWalletPopup(false);
  };

  const handleExpandFromMinimized = () => {
    setIsMinimized(false);
    setStep('select-wallet');
  };

  const walletOptions = [
    // Passkey option - shown first for easy access
    {
      name: 'Passkey',
      icon: '', // We'll use Fingerprint icon component
      isPasskey: true,
      isMobileAdapter: false,
    },
    {
      name: 'Phantom',
      icon: '/asset/phantom-logo.svg',
      isPasskey: false,
      isMobileAdapter: false,
    },
    {
      name: 'Solflare',
      icon: '/asset/solflare-logo.png',
      isPasskey: false,
      isMobileAdapter: false,
    },
  ];

  const stepMotion = prefersReducedMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
      };
  const walletOptionClass = 'group flex min-h-[64px] w-full items-center justify-between border border-white/10 bg-white/[0.03] px-3 py-3 text-left transition-colors hover:border-[#FFD700]/40 hover:bg-[#FFD700]/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FFD700] sm:px-4';
  const walletIconClass = 'flex h-11 w-11 shrink-0 items-center justify-center border border-white/10 bg-[#111] p-2';

  if (!showWalletPopup) return null;

  if (isMinimized) {
    return (
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: 'easeOut' }}
        className="fixed bottom-6 right-6 z-[100] max-w-sm px-4 sm:px-0"
        role="dialog"
        aria-label="Connect wallet reminder"
      >
        <div className="modal-panel border-l-2 border-l-[#FFD700] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center border border-white/10 bg-[#111]">
              <Wallet className="h-5 w-5 text-[#FFD700]" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                Connect wallet
              </h3>
              <p className="mb-3 text-xs leading-5 text-gray-400">Receive tips from the community.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleExpandFromMinimized}
                  className="min-h-[36px] border border-[#FFD700] bg-[#FFD700] px-3 py-1.5 text-xs font-bold text-black transition-colors hover:bg-[#FDB931] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                >
                  Connect
                </button>
                <button
                  type="button"
                  onClick={handleDismissMinimized}
                  className="min-h-[36px] border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs text-gray-400 transition-colors hover:bg-white/[0.05] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              type="button"
              aria-label="Dismiss wallet reminder"
              onClick={handleDismissMinimized}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center text-gray-500 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-3 sm:px-4">
      <motion.button
        type="button"
        aria-label="Dismiss wallet dialog"
        tabIndex={-1}
        onClick={handleUnderstood}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 modal-overlay"
      />

      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { scale: 0.98, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.98, opacity: 0, y: 12 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: 'easeOut' }}
        className="modal-panel relative w-full max-w-md overflow-hidden border-l-2 border-l-[#FFD700] p-5 sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-popup-title"
      >
        <button
          type="button"
          aria-label="Close wallet dialog"
          onClick={handleUnderstood}
          className="absolute right-3 top-3 z-20 flex min-h-[40px] min-w-[40px] items-center justify-center text-gray-500 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
        >
          <X className="h-5 w-5" />
        </button>

        <AnimatePresence mode="wait">
          {step === 'initial' && (
            <motion.div
              key="initial"
              {...stepMotion}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: 'easeOut' }}
              className="text-center"
            >
              <div className="ui-eyebrow mb-5 justify-center">Wallet</div>
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center border border-white/10 bg-[#111]">
                <Wallet className="h-8 w-8 text-[#FFD700]" aria-hidden="true" />
              </div>

              <h2 id="wallet-popup-title" className="mb-3 text-xl font-bold tracking-tight text-white sm:text-2xl">
                Connect wallet
              </h2>

              <p className="mx-auto max-w-sm text-sm leading-6 text-gray-400">
                Add a Solana wallet to receive community tips and manage on-chain actions.
              </p>

              <div className="mt-8 grid gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep('select-wallet')}
                  className="btn-primary w-full"
                >
                  Connect wallet
                </button>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading || isSigningInGoogle}
                  aria-busy={isLoading || isSigningInGoogle}
                  className="btn-ghost w-full"
                >
                  {isLoading || isSigningInGoogle ? (
                    <LoadingDots className="text-white" />
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Sign in with Google
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="min-h-[44px] w-full border border-white/15 bg-transparent px-4 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/[0.04] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}

          {step === 'warning' && (
            <motion.div
              key="warning"
              {...stepMotion}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: 'easeOut' }}
              className="text-center"
            >
              <div className="ui-eyebrow mb-5 justify-center">Notice</div>
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center border border-[#FFD700]/35 bg-[#FFD700]/10">
                <AlertTriangle className="h-8 w-8 text-[#FFD700]" aria-hidden="true" />
              </div>

              <h2 id="wallet-popup-title" className="mb-3 text-xl font-bold tracking-tight text-white sm:text-2xl">
                Heads up!
              </h2>

              <p className="mx-auto max-w-sm text-sm leading-6 text-gray-400">
                If you don't connect a wallet, you won't be able to receive tips from other users.
              </p>

              <div className="mt-8 grid gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep('select-wallet')}
                  className="btn-primary w-full"
                >
                  Connect now
                </button>
                <button
                  type="button"
                  onClick={handleUnderstood}
                  className="btn-ghost w-full"
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          )}

          {step === 'select-wallet' && (
            <motion.div
              key="select-wallet"
              {...stepMotion}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: 'easeOut' }}
            >
              <button
                type="button"
                aria-label="Back"
                onClick={() => setStep('initial')}
                className="absolute left-3 top-3 flex min-h-[40px] min-w-[40px] items-center justify-center text-gray-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="pt-8 text-center">
                <div className="ui-eyebrow mb-5 justify-center">Provider</div>
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center border border-white/10 bg-[#111]">
                  <Wallet className="h-7 w-7 text-[#FFD700]" aria-hidden="true" />
                </div>

                <h2 id="wallet-popup-title" className="mb-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Select Wallet
                </h2>

                <p className="mb-5 text-sm leading-6 text-gray-400">
                  Choose your preferred Solana wallet
                </p>

                <div className="space-y-2">
                  {isMobile ? (
                    walletOptions.map((wallet) => (
                      <button
                        type="button"
                        key={wallet.name}
                        onClick={() => wallet.isPasskey ? handlePasskeyConnect() : handleConnect(wallet.name, wallet.isMobileAdapter)}
                        className={walletOptionClass}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={walletIconClass}>
                            {wallet.isPasskey ? (
                              <Fingerprint className="h-5 w-5 text-[#FFD700]" aria-hidden="true" />
                            ) : wallet.isMobileAdapter ? (
                              <Smartphone className="h-5 w-5 text-[#FFD700]" aria-hidden="true" />
                            ) : (
                              <img src={wallet.icon} alt={wallet.name} className="w-full h-full object-contain" />
                            )}
                          </div>
                          <div className="min-w-0 text-left">
                            <span className="block font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white">{wallet.name}</span>
                            {wallet.isPasskey && (
                              <span className="text-xs text-gray-500">FaceID / TouchID / Windows Hello</span>
                            )}
                            {wallet.isMobileAdapter && (
                              <span className="text-xs text-gray-500">Opens your wallet app</span>
                            )}
                          </div>
                        </div>
                        <span className="h-2 w-2 border border-white/25 transition-colors group-hover:border-[#FFD700] group-hover:bg-[#FFD700]" />
                      </button>
                    ))
                  ) : (
                    <>
                      {walletOptions.filter(w => w.isPasskey).map((wallet) => (
                        <button
                          type="button"
                          key={wallet.name}
                          onClick={handlePasskeyConnect}
                          className={walletOptionClass}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className={walletIconClass}>
                              <Fingerprint className="h-5 w-5 text-[#FFD700]" aria-hidden="true" />
                            </div>
                            <div className="min-w-0 text-left">
                              <span className="block font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white">{wallet.name}</span>
                              <span className="text-xs text-gray-500">FaceID / TouchID / Windows Hello</span>
                            </div>
                          </div>
                          <span className="h-2 w-2 border border-white/25 transition-colors group-hover:border-[#FFD700] group-hover:bg-[#FFD700]" />
                        </button>
                      ))}

                      <div className="flex items-center gap-3 py-2">
                        <div className="flex-1 h-px bg-white/10"></div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">Wallet extension</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                      </div>

                      {wallets.filter(w => w.readyState === 'Installed' || w.readyState === 'Loadable').length > 0 ? (
                        walletOptions.filter(w => !w.isPasskey && !w.isMobileAdapter).map((wallet) => {
                          const isInstalled = wallets.some(
                            w => w.adapter.name.toLowerCase().includes(wallet.name.toLowerCase()) &&
                                 (w.readyState === 'Installed' || w.readyState === 'Loadable')
                          );

                          if (!isInstalled) return null;

                          return (
                            <button
                              type="button"
                              key={wallet.name}
                              onClick={() => handleConnect(wallet.name, wallet.isMobileAdapter)}
                              className={walletOptionClass}
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className={walletIconClass}>
                                  <img src={wallet.icon} alt={wallet.name} className="w-full h-full object-contain" />
                                </div>
                                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white">{wallet.name}</span>
                              </div>
                              <span className="h-2 w-2 border border-white/25 transition-colors group-hover:border-[#FFD700] group-hover:bg-[#FFD700]" />
                            </button>
                          );
                        })
                      ) : (
                        <div className="border border-white/10 bg-white/[0.02] px-4 py-3 text-center">
                          <p className="text-xs text-gray-500">No wallet extension detected</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <p className="mt-5 text-[10px] text-gray-500 sm:text-xs">
                  You can always connect or change your wallet later in Profile settings.
                </p>
              </div>
            </motion.div>
          )}

          {step === 'connecting' && (
            <motion.div
              key="connecting"
              {...stepMotion}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: 'easeOut' }}
              className="py-6 sm:py-8"
            >
              <LoadingLightbulb text="Connecting wallet..." />
            </motion.div>
          )}

          {step === 'connecting-passkey' && (
            <motion.div
              key="connecting-passkey"
              {...stepMotion}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: 'easeOut' }}
              className="py-6 sm:py-8"
            >
              <div className="text-center" aria-busy={isPasskeyConnecting}>
                <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden border border-white/15 bg-[#0A0A0A]">
                  <span className="absolute left-0 top-0 h-2 w-2 border-l border-t border-[#FFD700]" />
                  <span className="absolute right-0 top-0 h-2 w-2 border-r border-t border-[#FFD700]" />
                  <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-[#FFD700]" />
                  <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-[#FFD700]" />
                  {!prefersReducedMotion && (
                    <motion.span
                      className="absolute left-3 right-3 top-1/2 h-px bg-[#FFD700]"
                      animate={{ y: [-22, 22, -22], opacity: [0.2, 0.9, 0.2] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <Fingerprint className="relative z-10 h-8 w-8 text-[#FFD700]" aria-hidden="true" />
                </div>
                <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FFD700]">
                  Authenticating passkey
                </h3>
                <p className="text-sm leading-6 text-gray-400">Use FaceID, TouchID, or your device PIN to continue.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
