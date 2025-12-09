'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { LoadingLightbulb } from './LoadingLightbulb';
import toast from 'react-hot-toast';
import bs58 from 'bs58';

type Step = 'initial' | 'warning' | 'select-wallet' | 'connecting';

export const ConnectWalletPopup = () => {
  const [step, setStep] = useState<Step>('initial');
  const { showWalletPopup, setShowWalletPopup, setIsNewUser, user, setUser, refreshUser } = useAuth();
  const { wallets, select, connect, publicKey, signMessage, connected, disconnect } = useWallet();
  
  // Flag to prevent multiple API calls
  const isLinkingRef = useRef(false);

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
    setIsNewUser(false);
    setShowWalletPopup(false);
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
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
        className="relative w-full max-w-md bg-[#0F0F0F] border border-white/10 rounded-3xl p-8 shadow-2xl shadow-purple-900/20 overflow-hidden"
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
              <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-10 h-10 text-purple-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3">
                Do you want to connect wallet?
              </h2>
              
              <p className="text-gray-400 mb-8 leading-relaxed">
                Connect your Solana wallet to receive tips from the community for your awesome ideas!
              </p>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setStep('select-wallet')}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25"
                >
                  Okay
                </button>
                <button
                  onClick={handleSkip}
                  className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-full transition-all border border-zinc-700"
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
              <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-yellow-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3">
                Heads up!
              </h2>
              
              <p className="text-gray-400 mb-8 leading-relaxed">
                If you don't connect a wallet, you won't be able to receive tips from other users.
              </p>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setStep('select-wallet')}
                  className="px-8 py-3 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black font-bold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/25"
                >
                  Connect now
                </button>
                <button
                  onClick={handleUnderstood}
                  className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-full transition-all border border-zinc-700"
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
                className="absolute top-6 left-6 p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleUnderstood}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center pt-4">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wallet className="w-8 h-8 text-purple-400" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">
                  Select Wallet
                </h2>
                
                <p className="text-gray-400 mb-6">
                  Choose your preferred Solana wallet
                </p>

                <div className="space-y-3">
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
                          className={`w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 transition-all duration-300 group ${wallet.color}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center p-2.5">
                              <img src={wallet.icon} alt={wallet.name} className="w-full h-full object-contain" />
                            </div>
                            <span className="font-bold text-lg text-white">{wallet.name}</span>
                          </div>
                          <div className={`w-2.5 h-2.5 rounded-full bg-gray-600 transition-all ${
                            wallet.name === 'Phantom' ? 'group-hover:bg-[#AB9FF2] group-hover:shadow-[0_0_10px_#AB9FF2]' :
                            'group-hover:bg-[#FFD700] group-hover:shadow-[0_0_10px_#FFD700]'
                          }`} />
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-gray-400 py-4">
                      <p className="mb-4">No wallet found. Please install:</p>
                      <div className="flex gap-4 justify-center">
                        <a
                          href="https://phantom.app/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full transition-all"
                        >
                          Phantom
                        </a>
                        <a
                          href="https://solflare.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-full transition-all"
                        >
                          Solflare
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-6">
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
              className="py-8"
            >
              <LoadingLightbulb text="Connecting wallet..." />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
