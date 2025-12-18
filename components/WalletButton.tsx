'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, LogOut, Loader2, Fingerprint } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import toast from 'react-hot-toast';

export function WalletButton() {
  const { isConnected, isConnecting, walletAddress, connect, disconnect } = useWallet();
  const [showMenu, setShowMenu] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
      toast.success('Wallet connected!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      localStorage.removeItem('auth_token');
      toast.success('Wallet disconnected');
      setShowMenu(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect');
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (isConnecting) {
    return (
      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 text-primary">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Connecting...</span>
      </button>
    );
  }

  if (isConnected && walletAddress) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 hover:border-primary/50 transition-all"
        >
          <Fingerprint className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium">{shortenAddress(walletAddress)}</span>
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 top-full mt-2 w-48 bg-dark border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
            >
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium hover:opacity-90 transition-opacity"
    >
      <Wallet className="w-4 h-4" />
      <span>Connect</span>
    </button>
  );
}
