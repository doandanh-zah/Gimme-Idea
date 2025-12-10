'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, AlertTriangle, ArrowLeft, ChevronUp } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { LoadingLightbulb } from './LoadingLightbulb';
import toast from 'react-hot-toast';
import bs58 from 'bs58';

type Step = 'initial' | 'warning' | 'select-wallet' | 'connecting';

// Key to track if user has dismissed the popup before
const WALLET_POPUP_DISMISSED_KEY = 'gimme_wallet_popup_dismissed';

export const ConnectWalletPopup = () => {
  const [step, setStep] = useState<Step>('initial');
  const [isMinimized, setIsMinimized] = useState(false);
  const { showWalletPopup, setShowWalletPopup, setIsNewUser, user, setUser, refreshUser } = useAuth();
  const { wallets, select, connect, publicKey, signMessage, connected, disconnect } = useWallet();
  
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

  // Reset step when popup opens
  useEffect(() => {
    if (showWalletPopup) {
      setStep('initial');
      isLinkingRef.current = false;
    }
  }, [showWalletPopup]);

  // Handle wallet connection and linking
  useEffect(() => {
    const linkWalletToAccount = async () => {
      // Prevent multiple calls
      if (isLinkingRef.current) return;
      
      if (step === 'connecting' && connected && publicKey && signMessage && user) {
        isLinkingRef.current = true;
        
        try {
          // Create message for signing
          const timestamp = new Date().toISOString();
          const message = `Link wallet to GimmeIdea\n\nTimestamp: ${timestamp}\nWallet: ${publicKey.toBase58()}\nEmail: ${user.email}`;
          
          // Request signature
          const encodedMessage = new TextEncoder().encode(message);
          const signature = await signMessage(encodedMessage);
          const signatureBase58 = bs58.encode(signature);

          // Send to backend
          const response = await apiClient.linkWallet({
            walletAddress: publicKey.toBase58(),
            signature: signatureBase58,
            message,
          });

          if (response.success && response.data) {
            // Update user with new wallet
            setUser({
              ...user,
              wallet: publicKey.toBase58(),
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
        } catch (error: any) {
          console.error('Link wallet error:', error);
          
          if (error.message?.includes('User rejected') || error.message?.includes('canceled')) {
            toast.error('Signature cancelled');
          } else {
            toast.error(error.message || 'Failed to link wallet');
          }
          
          // Reset flag and disconnect
          isLinkingRef.current = false;
          await disconnect();
          setStep('select-wallet');
        }
      }
    };

    linkWalletToAccount();
  }, [step, connected, publicKey, signMessage, user, setUser, setIsNewUser, setShowWalletPopup, disconnect]);

  const handleConnect = async (walletName: string) => {
    const selectedWallet = wallets.find(w =>
      w.adapter.name.toLowerCase().includes(walletName.toLowerCase())
    );

    if (!selectedWallet) {
      toast.error(`${walletName} wallet not found`);
      return;
    }

    try {
      setStep('connecting');
      select(selectedWallet.adapter.name);
      await connect();
    } catch (error: any) {
      // Ignore errors from other wallet extensions (like MetaMask)
      if (error.message?.includes('MetaMask') || 
          error.message?.includes('Ethereum') ||
          error.name === 'WalletNotSelectedError') {
        console.log('Ignoring non-Solana wallet error:', error.message);
        return;
      }
      
      console.error('Wallet connection error:', error);
      
      if (error.message?.includes('User rejected') || error.message?.includes('canceled')) {
        toast.error('Connection cancelled');
      } else {
        toast.error('Failed to connect wallet');
      }
      
      setStep('select-wallet');
    }
  };

  const handleSkip = () => {
    setStep('warning');
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
    {
      name: 'Phantom',
      icon: '/asset/phantom-logo.svg',
      color: 'hover:bg-[#AB9FF2]/20 hover:border-[#AB9FF2]/50'
    },
    {
      name: 'Solflare',
      icon: '/asset/solflare-logo.png',
      color: 'hover:bg-[#FFD700]/20 hover:border-[#FFD700]/50'
    },
  ];

  if (!showWalletPopup) return null;

  // Minimized version - small toast at bottom right
  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-[100] max-w-sm"
      >
        <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 shadow-2xl shadow-purple-900/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white mb-1">Connect Wallet?</h3>
              <p className="text-xs text-gray-400 mb-3">Receive tips from the community</p>
              <div className="flex gap-2">
                <button
                  onClick={handleExpandFromMinimized}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-full transition-all"
                >
                  Connect
                </button>
                <button
                  onClick={handleDismissMinimized}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 text-xs rounded-full transition-all"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={handleDismissMinimized}
              className="p-1 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Full popup version
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-3 sm:px-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
      />
        
      {/* Modal */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-[#0F0F0F] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl shadow-purple-900/20 overflow-hidden"
      >
        {/* Top Gradient Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-[#FFD700] to-green-500" />

        <AnimatePresence mode="wait">
          {step === 'initial' && (
            <motion.div
              key="initial"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />
              </div>
              
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
                Do you want to connect wallet?
              </h2>
              
              <p className="text-gray-400 text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed">
                Connect your Solana wallet to receive tips from the community for your awesome ideas!
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={() => setStep('select-wallet')}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25 text-sm sm:text-base"
                >
                  Okay
                </button>
                <button
                  onClick={handleSkip}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-full transition-all border border-zinc-700 text-sm sm:text-base"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}

          {step === 'warning' && (
            <motion.div
              key="warning"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
              </div>
              
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
                Heads up!
              </h2>
              
              <p className="text-gray-400 text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed">
                If you don't connect a wallet, you won't be able to receive tips from other users.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={() => setStep('select-wallet')}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black font-bold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/25 text-sm sm:text-base"
                >
                  Connect now
                </button>
                <button
                  onClick={handleUnderstood}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-full transition-all border border-zinc-700 text-sm sm:text-base"
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          )}

          {step === 'select-wallet' && (
            <motion.div
              key="select-wallet"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={() => setStep('initial')}
                className="absolute top-4 left-4 sm:top-6 sm:left-6 p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleUnderstood}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center pt-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Wallet className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" />
                </div>
                
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Select Wallet
                </h2>
                
                <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">
                  Choose your preferred Solana wallet
                </p>

                <div className="space-y-2 sm:space-y-3">
                  {wallets.filter(w => w.readyState === 'Installed' || w.readyState === 'Loadable').length > 0 ? (
                    walletOptions.map((wallet) => {
                      const isInstalled = wallets.some(
                        w => w.adapter.name.toLowerCase().includes(wallet.name.toLowerCase()) &&
                             (w.readyState === 'Installed' || w.readyState === 'Loadable')
                      );

                      if (!isInstalled) return null;

                      return (
                        <button
                          key={wallet.name}
                          onClick={() => handleConnect(wallet.name)}
                          className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-xl border border-white/5 bg-white/5 transition-all duration-300 group ${wallet.color}`}
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 flex items-center justify-center p-2 sm:p-2.5">
                              <img src={wallet.icon} alt={wallet.name} className="w-full h-full object-contain" />
                            </div>
                            <span className="font-bold text-base sm:text-lg text-white">{wallet.name}</span>
                          </div>
                          <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gray-600 transition-all ${
                            wallet.name === 'Phantom' ? 'group-hover:bg-[#AB9FF2] group-hover:shadow-[0_0_10px_#AB9FF2]' :
                            'group-hover:bg-[#FFD700] group-hover:shadow-[0_0_10px_#FFD700]'
                          }`} />
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-gray-400 py-4">
                      <p className="mb-4 text-sm sm:text-base">No wallet found. Please install:</p>
                      <div className="flex gap-3 sm:gap-4 justify-center">
                        <a
                          href="https://phantom.app/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 sm:px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full transition-all text-sm"
                        >
                          Phantom
                        </a>
                        <a
                          href="https://solflare.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 sm:px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-full transition-all text-sm"
                        >
                          Solflare
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-[10px] sm:text-xs text-gray-500 mt-4 sm:mt-6">
                  You can always connect or change your wallet later in Profile settings.
                </p>
              </div>
            </motion.div>
          )}

          {step === 'connecting' && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-6 sm:py-8"
            >
              <LoadingLightbulb text="Connecting wallet..." />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
