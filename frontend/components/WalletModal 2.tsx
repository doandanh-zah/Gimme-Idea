
'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../lib/store';
import toast from 'react-hot-toast';
import { LoadingLightbulb, LoadingStatus } from './LoadingLightbulb';

export const WalletModal = () => {
  const { isWalletModalOpen, closeWalletModal, connectWallet } = useAppStore();
  const [status, setStatus] = useState<LoadingStatus>('loading');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isWalletModalOpen) {
        setStatus('loading');
        setIsProcessing(false);
    }
  }, [isWalletModalOpen]);

  if (!isWalletModalOpen) return null;

  const handleConnect = async (walletName: string) => {
    setIsProcessing(true);
    setStatus('loading');

    try {
      // Call the store action
      await connectWallet(walletName);
      
      // Show success state
      setStatus('success');
      
      // Wait a bit for the user to see the success animation before closing
      setTimeout(() => {
        toast.success(`Connected to ${walletName}`);
        closeWalletModal();
        setIsProcessing(false);
      }, 1500);

    } catch (error) {
      setStatus('error');
      setTimeout(() => {
        setIsProcessing(false);
      }, 2000);
      toast.error("Failed to connect");
    }
  };

  const wallets = [
    { 
        name: 'Phantom', 
        icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Phantom_wallet_logo.png/1200px-Phantom_wallet_logo.png?20220525001338', 
        color: 'hover:bg-purple-500/20 hover:border-purple-500/50' 
    },
    { 
        name: 'Solflare', 
        icon: 'https://play-lh.googleusercontent.com/fXvU754g5c8Y181E8Y-gT1-rW80qV3d8nZ67Z35c7c67791808c7a089501008a301c', 
        color: 'hover:bg-orange-500/20 hover:border-orange-500/50' 
    },
    { 
        name: 'MetaMask', 
        icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg', 
        color: 'hover:bg-orange-600/20 hover:border-orange-600/50' 
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={isProcessing ? undefined : closeWalletModal}
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
      />
        
      {/* Modal */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-sm bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-2xl shadow-purple-900/20 overflow-hidden min-h-[400px] flex flex-col"
      >
        {/* Top Gradient Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-gold to-green-500" />
        
        {isProcessing ? (
          <div className="flex-grow flex flex-col items-center justify-center h-full min-h-[300px]">
            <LoadingLightbulb 
                text={status === 'loading' ? "Connecting Wallet..." : status === 'success' ? "Wallet Connected" : "Connection Failed"} 
                status={status}
            />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8 mt-2">
              <h2 className="text-2xl font-bold font-display">Connect Wallet</h2>
              <button onClick={closeWalletModal} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 flex-grow">
                {wallets.map((wallet) => (
                    <button
                        key={wallet.name}
                        onClick={() => handleConnect(wallet.name)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 transition-all duration-300 group ${wallet.color}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center p-2.5 backdrop-blur-sm shadow-inner">
                                <img src={wallet.icon} alt={wallet.name} className="w-full h-full object-contain" />
                            </div>
                            <span className="font-bold text-lg tracking-wide">{wallet.name}</span>
                        </div>
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-600 group-hover:bg-[#14F195] group-hover:shadow-[0_0_10px_#14F195] transition-all" />
                    </button>
                ))}
            </div>
            
            <div className="mt-8 text-center border-t border-white/5 pt-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                    By connecting a wallet, you agree to Gimme Idea's <br/>
                    <a href="#" className="text-gray-400 hover:text-white underline">Terms of Service</a> and <a href="#" className="text-gray-400 hover:text-white underline">Privacy Policy</a>.
                </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
