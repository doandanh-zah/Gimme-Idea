'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { LoadingLightbulb } from './LoadingLightbulb';
import toast from 'react-hot-toast';
import bs58 from 'bs58';

type ModalMode = 'reconnect' | 'connect' | 'change';

interface WalletRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ModalMode;
  onSuccess?: () => void;
}

export const WalletRequiredModal: React.FC<WalletRequiredModalProps> = ({
  isOpen,
  onClose,
  mode,
  onSuccess
}) => {
  const { user, setUser, refreshUser } = useAuth();
  const { wallets, select, connect, publicKey, signMessage, connected, disconnect } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'prompt' | 'select' | 'connecting'>('prompt');
  const isLinkingRef = useRef(false);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('prompt');
      setIsProcessing(false);
      isLinkingRef.current = false;
    }
  }, [isOpen]);

  // Handle wallet connection for change wallet
  useEffect(() => {
    const handleWalletChange = async () => {
      if (isLinkingRef.current) return;
      
      if (step === 'connecting' && connected && publicKey && signMessage && user && mode === 'change') {
        isLinkingRef.current = true;
        
        try {
          const newWalletAddress = publicKey.toBase58();
          
          // Check if wallet already exists in system
          const checkResponse = await apiClient.checkWalletExists(newWalletAddress);
          
          if (checkResponse.data?.exists && checkResponse.data?.userId !== user.id) {
            toast.error('This wallet is already linked to another account. Please use a different wallet.');
            isLinkingRef.current = false;
            await disconnect();
            setStep('select');
            return;
          }

          // Create message for signing
          const timestamp = new Date().toISOString();
          const message = `Change wallet for GimmeIdea\n\nTimestamp: ${timestamp}\nNew Wallet: ${newWalletAddress}\nEmail: ${user.email}`;
          
          // Request signature
          const encodedMessage = new TextEncoder().encode(message);
          const signature = await signMessage(encodedMessage);
          const signatureBase58 = bs58.encode(signature);

          // Send to backend
          const response = await apiClient.linkWallet({
            walletAddress: newWalletAddress,
            signature: signatureBase58,
            message,
          });

          if (response.success && response.data) {
            setUser({
              ...user,
              wallet: newWalletAddress,
              needsWalletConnect: false,
            });
            
            toast.success('Wallet changed successfully!');
            onSuccess?.();
            onClose();
          } else {
            throw new Error(response.error || 'Failed to change wallet');
          }
        } catch (error: any) {
          console.error('Change wallet error:', error);
          
          if (error.message?.includes('User rejected') || error.message?.includes('canceled')) {
            toast.error('Signature cancelled');
          } else {
            toast.error(error.message || 'Failed to change wallet');
          }
          
          isLinkingRef.current = false;
          await disconnect();
          setStep('select');
        }
      }
    };

    handleWalletChange();
  }, [step, connected, publicKey, signMessage, user, mode, setUser, onSuccess, onClose, disconnect]);

  // Track if we're in reconnect mode and waiting for connection
  const isReconnectingRef = useRef(false);

  // Handle reconnect wallet verification (after publicKey updates)
  useEffect(() => {
    const verifyReconnection = async () => {
      if (!isReconnectingRef.current || !connected || !publicKey || !user?.wallet) return;
      
      isReconnectingRef.current = false;
      setIsProcessing(false);
      
      if (publicKey.toBase58() === user.wallet) {
        toast.success('Wallet reconnected successfully!');
        onSuccess?.();
        onClose();
      } else {
        toast.error('Connected wallet does not match your profile. Please use the correct wallet or change your wallet in Profile.');
        await disconnect();
      }
    };

    verifyReconnection();
  }, [connected, publicKey, user?.wallet, onSuccess, onClose, disconnect]);

  const handleReconnect = async () => {
    if (!user?.wallet) return;

    setIsProcessing(true);
    try {
      const availableWallet = wallets.find(w => 
        w.readyState === 'Installed' || w.readyState === 'Loadable'
      );
      
      if (!availableWallet) {
        toast.error('No wallet extension found. Please install Phantom or Solflare.');
        setIsProcessing(false);
        return;
      }

      isReconnectingRef.current = true;
      select(availableWallet.adapter.name);
      await connect();
      // The useEffect above will handle verification after publicKey updates
    } catch (error: any) {
      console.error('Reconnect error:', error);
      isReconnectingRef.current = false;
      setIsProcessing(false);
      if (!error.message?.includes('User rejected')) {
        toast.error('Failed to reconnect wallet');
      }
    }
  };

  const handleConnectWallet = async (walletName: string) => {
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
      if (error.message?.includes('MetaMask') || error.message?.includes('Ethereum')) {
        return;
      }
      console.error('Wallet connection error:', error);
      if (!error.message?.includes('User rejected')) {
        toast.error('Failed to connect wallet');
      }
      setStep('select');
    }
  };

  const walletOptions = [
    { name: 'Phantom', icon: '/asset/phantom-logo.svg', color: 'hover:bg-[#AB9FF2]/20' },
    { name: 'Solflare', icon: '/asset/solflare-logo.png', color: 'hover:bg-[#FFD700]/20' },
  ];

  if (!isOpen) return null;

  const getTitle = () => {
    switch (mode) {
      case 'reconnect':
        return 'Reconnect Your Wallet';
      case 'connect':
        return 'Connect a Wallet';
      case 'change':
        return 'Change Wallet';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'reconnect':
        return 'Your wallet session has expired. Please reconnect to continue with the transaction.';
      case 'connect':
        return 'You need to connect a wallet to send tips. Connect now to continue.';
      case 'change':
        return 'Select a new wallet to link to your account. Your old wallet will be unlinked.';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-3 sm:px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-[#0F0F0F] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-[#FFD700] to-green-500" />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <AnimatePresence mode="wait">
          {step === 'prompt' && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                {mode === 'reconnect' ? (
                  <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />
                ) : (
                  <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />
                )}
              </div>
              
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">{getTitle()}</h2>
              <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">{getDescription()}</p>

              {user?.wallet && mode === 'reconnect' && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Your linked wallet:</p>
                  <p className="text-xs sm:text-sm font-mono text-white">
                    {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                {mode === 'reconnect' ? (
                  <button
                    onClick={handleReconnect}
                    disabled={isProcessing}
                    className="px-5 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-full transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 flex items-center gap-2 text-sm sm:text-base"
                  >
                    {isProcessing ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Reconnect Wallet
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setStep('select')}
                    className="px-5 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-full transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Wallet className="w-4 h-4" />
                    Select Wallet
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Wallet className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" />
              </div>
              
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Select Wallet</h2>
              <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">Choose your preferred Solana wallet</p>

              <div className="space-y-2 sm:space-y-3">
                {walletOptions.map((wallet) => {
                  const isInstalled = wallets.some(
                    w => w.adapter.name.toLowerCase().includes(wallet.name.toLowerCase()) &&
                         (w.readyState === 'Installed' || w.readyState === 'Loadable')
                  );

                  if (!isInstalled) return null;

                  return (
                    <button
                      key={wallet.name}
                      onClick={() => handleConnectWallet(wallet.name)}
                      className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-xl border border-white/5 bg-white/5 transition-all duration-300 group ${wallet.color}`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 flex items-center justify-center p-2 sm:p-2.5">
                          <img src={wallet.icon} alt={wallet.name} className="w-full h-full object-contain" />
                        </div>
                        <span className="font-bold text-base sm:text-lg text-white">{wallet.name}</span>
                      </div>
                    </button>
                  );
                })}
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
