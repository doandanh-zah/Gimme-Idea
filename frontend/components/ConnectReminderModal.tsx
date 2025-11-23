
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, X, ArrowRight, Lock, ShieldAlert } from 'lucide-react';
import { useAppStore } from '../lib/store';

export const ConnectReminderModal = () => {
  const { isConnectReminderOpen, closeConnectReminder, openWalletModal } = useAppStore();

  if (!isConnectReminderOpen) return null;

  const handleConnect = () => {
    closeConnectReminder();
    openWalletModal();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeConnectReminder}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative w-full max-w-md bg-[#0F0F0F] border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(255,215,0,0.15)] overflow-hidden"
      >
        {/* Glow Effects - GOLD THEMED */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        {/* Close Button */}
        <button 
            onClick={closeConnectReminder}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors z-20 bg-white/5 rounded-full"
        >
            <X className="w-5 h-5" />
        </button>

        <div className="relative z-10 flex flex-col items-center text-center">
            {/* Animated Icon */}
            <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 to-orange-500/20 rounded-full border border-white/5"
                />
                <div className="absolute inset-2 bg-[#1A1A1A] rounded-full border border-white/10 flex items-center justify-center shadow-inner">
                    <Wallet className="w-10 h-10 text-gray-200" />
                </div>
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="absolute -bottom-1 -right-1 bg-black border-2 border-[#1A1A1A] p-2 rounded-full"
                >
                    <Lock className="w-4 h-4 text-yellow-500" />
                </motion.div>
            </div>

            <h2 className="text-2xl font-display font-bold text-white mb-3">Access Restricted</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-[280px]">
                You must connect your Solana wallet to post projects, ideas, or send donations.
            </p>

            <button 
                onClick={handleConnect}
                className="w-full py-4 bg-gradient-to-r from-[#FFD700] to-[#FDB931] rounded-xl font-bold text-black hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-2">
                    Connect Wallet <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
            </button>
            
            <button 
                onClick={closeConnectReminder}
                className="mt-5 text-sm text-gray-500 hover:text-gray-300 transition-colors font-medium"
            >
                Cancel
            </button>
        </div>
      </motion.div>
    </div>
  );
};
