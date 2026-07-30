'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, AlertCircle, RefreshCw, ArrowRight, Smartphone, Fingerprint } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePasskeyWallet } from '@/contexts/LazorkitContext';
import { useSelectAndConnect } from '@/hooks/useSelectAndConnect';
import { apiClient } from '@/lib/api-client';
import { LoadingLightbulb } from './LoadingLightbulb';
import toast from 'react-hot-toast';
import bs58 from 'bs58';

type ModalMode = 'reconnect' | 'connect' | 'change';

// Helper to detect mobile browser
const isMobileBrowser = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
};

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
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const { wallets, selectAndConnect } = useSelectAndConnect();
  const { isPasskeyConnected, passkeyWalletAddress, connectPasskey, disconnectPasskey, signPasskeyMessage, isPasskeyConnecting } = usePasskeyWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'prompt' | 'select' | 'connecting'>('prompt');
  const [isMobile, setIsMobile] = useState(false);
  const isLinkingRef = useRef(false);

  // Detect mobile on mount
  useEffect(() => {
    setIsMobile(isMobileBrowser());
  }, []);

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
    // Instead of auto-reconnect, go to wallet selection
    setStep('select');
  };

  // Handle Passkey reconnect
  const handlePasskeyReconnect = async () => {
    if (!user?.wallet) return;

    setIsProcessing(true);
    try {
      await connectPasskey();
      
      // Check if passkey wallet matches user's linked wallet
      if (passkeyWalletAddress === user.wallet) {
        toast.success('Passkey wallet reconnected successfully!');
        onSuccess?.();
        onClose();
      } else if (passkeyWalletAddress) {
        toast.error('Connected passkey wallet does not match your profile.');
        await disconnectPasskey();
      }
    } catch (error: any) {
      console.error('Passkey reconnect error:', error);
      if (!error.message?.includes('User rejected') && !error.message?.includes('cancelled')) {
        toast.error('Failed to reconnect with Passkey');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle specific wallet reconnect
  const handleWalletReconnect = async (walletName: string, isMobileAdapter?: boolean) => {
    if (!user?.wallet) return;

    setIsProcessing(true);
    try {
      isReconnectingRef.current = true;
      await selectAndConnect({ walletName, isMobileAdapter });
      // The useEffect above will handle verification after publicKey updates
    } catch (error: any) {
      console.error('Reconnect error:', error);
      isReconnectingRef.current = false;
      setIsProcessing(false);
      if (error.message?.includes('not found')) {
        toast.error(error.message);
      } else if (!error.message?.includes('User rejected') && !error.message?.includes('cancelled')) {
        toast.error('Failed to reconnect wallet');
      }
    }
  };

  const handleConnectWallet = async (walletName: string, isMobileAdapter?: boolean) => {
    try {
      setStep('connecting');
      await selectAndConnect({ walletName, isMobileAdapter });
    } catch (error: any) {
      if (error.message?.includes('MetaMask') || error.message?.includes('Ethereum')) {
        setStep('select');
        return;
      }
      console.error('Wallet connection error:', error);
      if (error.message?.includes('not found')) {
        toast.error(error.message);
      } else if (!error.message?.includes('User rejected') && !error.message?.includes('cancelled')) {
        toast.error('Failed to connect wallet');
      }
      setStep('select');
    }
  };

  const walletOptions = [
    { name: 'Passkey', icon: '', color: 'hover:bg-green-500/20', isMobileAdapter: false, isPasskey: true },
    { name: 'Phantom', icon: '/asset/phantom-logo.svg', color: 'hover:bg-[#AB9FF2]/20', isMobileAdapter: false, isPasskey: false },
    { name: 'Solflare', icon: '/asset/solflare-logo.png', color: 'hover:bg-[#FFD700]/20', isMobileAdapter: false, isPasskey: false },
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 modal-overlay"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="modal-frame max-w-md p-5 sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-required-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="modal-close"
          aria-label="Close wallet dialog"
        >
          <X className="w-5 h-5" aria-hidden="true" />
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
              <div className="modal-icon mx-auto mb-4 h-16 w-16 sm:mb-6">
                {mode === 'reconnect' ? (
                  <RefreshCw className="w-8 h-8 sm:w-9 sm:h-9" aria-hidden="true" />
                ) : (
                  <Wallet className="w-8 h-8 sm:w-9 sm:h-9" aria-hidden="true" />
                )}
              </div>
              
              <p className="ui-eyebrow mx-auto mb-3 w-fit">Wallet</p>
              <h2 id="wallet-required-title" className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">{getTitle()}</h2>
              <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">{getDescription()}</p>

              {user?.wallet && mode === 'reconnect' && (
                <div className="modal-section mb-4 sm:mb-6">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Your linked wallet:</p>
                  <p className="text-xs sm:text-sm font-mono text-white">
                    {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                {mode === 'reconnect' ? (
                  <button
                    type="button"
                    onClick={handleReconnect}
                    disabled={isProcessing}
                    className="btn-primary disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" />
                        Select Wallet
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep('select')}
                    className="btn-primary"
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
              <div className="modal-icon mx-auto mb-4 h-14 w-14 sm:mb-6 sm:h-16 sm:w-16">
                <Wallet className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true" />
              </div>
              
              <p className="ui-eyebrow mx-auto mb-3 w-fit">Wallet</p>
              <h2 id="wallet-required-title" className="text-xl sm:text-2xl font-bold text-white mb-2">
                {mode === 'reconnect' ? 'Reconnect Wallet' : 'Select Wallet'}
              </h2>
              <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">
                {mode === 'reconnect' 
                  ? 'Choose the wallet you want to reconnect with'
                  : 'Choose your preferred Solana wallet'}
              </p>

              {user?.wallet && mode === 'reconnect' && (
                <div className="modal-section mb-4 text-left">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Your linked wallet:</p>
                  <p className="text-xs sm:text-sm font-mono text-white">
                    {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
                  </p>
                </div>
              )}

              <div className="space-y-2 sm:space-y-3">
                {/* On mobile, show all options including Mobile Wallet Adapter */}
                {isMobile ? (
                  walletOptions.map((wallet) => (
                    <button
                      type="button"
                      key={wallet.name}
                      onClick={() => {
                        if (wallet.isPasskey) {
                          mode === 'reconnect' ? handlePasskeyReconnect() : handleConnectWallet(wallet.name, false);
                        } else {
                          mode === 'reconnect' 
                            ? handleWalletReconnect(wallet.name, wallet.isMobileAdapter)
                            : handleConnectWallet(wallet.name, wallet.isMobileAdapter);
                        }
                      }}
                      disabled={isProcessing || isPasskeyConnecting}
                      className={`modal-option justify-between group ${wallet.color} disabled:opacity-50`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/10 p-2 sm:h-12 sm:w-12 sm:p-2.5">
                          {wallet.isMobileAdapter ? (
                            <Smartphone className="w-6 h-6 text-purple-400" />
                          ) : wallet.isPasskey ? (
                            <Fingerprint className="w-6 h-6 text-green-400" />
                          ) : (
                            <img src={wallet.icon} alt={wallet.name} className="w-full h-full object-contain" />
                          )}
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-base sm:text-lg text-white block">{wallet.name}</span>
                          {wallet.isMobileAdapter && (
                            <span className="text-xs text-gray-400">Opens your wallet app</span>
                          )}
                          {wallet.isPasskey && (
                            <span className="text-xs text-gray-400">Use Face ID / Touch ID</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  walletOptions.map((wallet) => {
                    // Passkey is always available
                    if (wallet.isPasskey) {
                      return (
                        <button
                          type="button"
                          key={wallet.name}
                          onClick={() => {
                            mode === 'reconnect' ? handlePasskeyReconnect() : handleConnectWallet(wallet.name, false);
                          }}
                          disabled={isProcessing || isPasskeyConnecting}
                          className={`modal-option justify-between group ${wallet.color} disabled:opacity-50`}
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/10 p-2 sm:h-12 sm:w-12 sm:p-2.5">
                              <Fingerprint className="w-6 h-6 text-green-400" />
                            </div>
                            <div className="text-left">
                              <span className="font-bold text-base sm:text-lg text-white block">{wallet.name}</span>
                              <span className="text-xs text-gray-400">Use Face ID / Touch ID</span>
                            </div>
                          </div>
                        </button>
                      );
                    }

                    // Regular wallets - check if installed
                    const isInstalled = wallets.some(
                      w => w.adapter.name.toLowerCase().includes(wallet.name.toLowerCase()) &&
                           (w.readyState === 'Installed' || w.readyState === 'Loadable')
                    );

                    if (!isInstalled) return null;

                    return (
                      <button
                        type="button"
                        key={wallet.name}
                        onClick={() => {
                          mode === 'reconnect' 
                            ? handleWalletReconnect(wallet.name, wallet.isMobileAdapter)
                            : handleConnectWallet(wallet.name, wallet.isMobileAdapter);
                        }}
                        disabled={isProcessing}
                        className={`modal-option justify-between group ${wallet.color} disabled:opacity-50`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/10 p-2 sm:h-12 sm:w-12 sm:p-2.5">
                            <img src={wallet.icon} alt={wallet.name} className="w-full h-full object-contain" />
                          </div>
                          <span className="font-bold text-base sm:text-lg text-white">{wallet.name}</span>
                        </div>
                      </button>
                    );
                  })
                )}
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
