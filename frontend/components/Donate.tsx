
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Send, Twitter, Copy, Check, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../lib/store';
import { apiClient } from '../lib/api-client';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

export const Donate = () => {
  const { user, openConnectReminder } = useAppStore();
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('0.5');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: number; duration: string; opacity: number }[]>([]);

  // Generate stars on mount
  useEffect(() => {
    const newStars = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      duration: `${Math.random() * 3 + 2}s`,
      opacity: Math.random()
    }));
    setStars(newStars);
  }, []);

  const walletAddress = "FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm";

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    toast.success("Wallet address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDonate = async () => {
    if (!user || !publicKey) {
        openConnectReminder();
        return;
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);

    try {
      const recipientPubKey = new PublicKey(walletAddress);

      // Create SOL transfer instruction
      const lamports = amountNum * LAMPORTS_PER_SOL;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubKey,
          lamports,
        })
      );

      // Send transaction
      const signature = await sendTransaction(transaction, connection);

      // Wait for confirmation
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      setTxHash(signature);
      setIsProcessing(false);
      setIsSuccess(true);
      toast.success("Donation sent successfully!");

      // Verify with backend (optional - transaction is already successful on-chain)
      try {
        await apiClient.verifyTransaction({
          signature,
          type: 'bounty',
          amount: amountNum,
        });
      } catch (backendError: any) {
        // Silent fail - transaction is already successful on-chain
        // Backend verification is for tracking/leaderboard purposes only
        if (backendError?.response?.status !== 400) {
          console.warn('Backend verification skipped:', backendError.message || 'Unknown error');
        }
      }

      // Keep success state for 5 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setTxHash('');
      }, 5000);
    } catch (error: any) {
      console.error('Donation failed:', error);
      setIsProcessing(false);

      let errorMessage = 'Transaction failed';
      if (error.message?.includes('User rejected')) {
        errorMessage = 'Transaction cancelled';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL balance';
      }

      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 relative overflow-hidden flex items-center">

      {/* Background with Stars & Grid (same as landing page) */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="bg-grid opacity-40"></div>
          <div className="stars-container">
            {stars.map((star) => (
              <div
                key={star.id}
                className="star"
                style={{
                  top: star.top,
                  left: star.left,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  '--duration': star.duration,
                  '--opacity': star.opacity
                } as React.CSSProperties}
              />
            ))}
            <div className="shooting-star" style={{ top: '20%', left: '80%' }} />
            <div className="shooting-star" style={{ top: '60%', left: '10%', animationDelay: '2s' }} />
          </div>
      </div>

      <div className="max-w-6xl mx-auto w-full">

        {/* Header Section - Compact */}
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
        >
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-2 leading-tight">
                <Heart className="inline w-8 h-8 text-red-400 fill-current mb-2" /> Support <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Gimme Idea</span>
            </h1>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto">
                Help us keep the servers running and coffee flowing ☕
            </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">

        {/* Donation Card */}
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full lg:w-1/2"
        >
            <div className="bg-[#0F0F0F]/80 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl shadow-blue-900/10 group flex flex-col justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                
                <AnimatePresence mode="wait">
                    {isSuccess ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center justify-center h-full py-4"
                        >
                            <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50 relative z-10"
                                >
                                    <Check className="w-10 h-10 text-green-500" />
                                </motion.div>
                                <motion.div 
                                    className="absolute inset-0 rounded-full border border-green-500/30"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1.5, opacity: 0 }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                                {[...Array(6)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-1.5 h-1.5 bg-green-400 rounded-full"
                                        initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                                        animate={{ 
                                            x: Math.cos(i * 60 * (Math.PI / 180)) * 60,
                                            y: Math.sin(i * 60 * (Math.PI / 180)) * 60,
                                            opacity: 0,
                                            scale: 0.5
                                        }}
                                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                    />
                                ))}
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2 font-display">Donation Received!</h3>
                            <p className="text-gray-400 mb-6">You successfully sent <span className="text-white font-bold">{amount} SOL</span></p>
                            
                            <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 max-w-xs">
                                <div className="flex justify-between items-center text-sm mb-2">
                                    <span className="text-gray-500">Status</span>
                                    <span className="text-green-400 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Confirmed</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Transaction</span>
                                    <a
                                        href={txHash ? `https://solscan.io/tx/${txHash}?cluster=devnet` : '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1"
                                    >
                                        View <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>

                            <button 
                                onClick={() => setIsSuccess(false)}
                                className="mt-8 text-sm text-gray-500 hover:text-white transition-colors"
                            >
                                Make another donation
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                             <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">You are in devnet, please donate in mainnet! Thank you so much :3</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                                    {['0.1', '0.5', '1', '2'].map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => setAmount(val)}
                                            className={`py-3 rounded-xl font-mono font-bold transition-all border ${
                                                amount === val
                                                ? 'bg-blue-500/20 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/10'
                                            }`}
                                        >
                                            {val} SOL
                                        </button>
                                    ))}
                                </div>
                                <div className="relative group/input">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        step="0.1"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-2xl font-bold text-white outline-none focus:border-blue-500 transition-colors pr-16 group-hover/input:border-white/20"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono text-gray-500 pointer-events-none">
                                        SOL
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-3 mb-6 relative group/copy transition-colors hover:border-white/20">
                                <code className="text-sm text-gray-300 font-mono truncate w-full px-2">
                                    {walletAddress}
                                </code>
                                <button 
                                    onClick={handleCopy}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white flex-shrink-0"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <div className="absolute inset-x-0 -bottom-8 text-center opacity-0 group-hover/copy:opacity-100 transition-opacity pointer-events-none">
                                    <span className="text-[10px] text-gray-500 bg-black/80 px-2 py-1 rounded border border-white/10">Click to copy address</span>
                                </div>
                            </div>

                            <button 
                                onClick={handleDonate}
                                disabled={isProcessing}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 relative overflow-hidden group/btn"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                                <span className="relative z-10 flex items-center gap-2">
                                    {isProcessing ? "Processing..." : "Send Donation"} <Send className="w-5 h-5" />
                                </span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div> {/* Close Donation Card motion.div */}

        {/* Group Builders Section and Social Links */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">

        {/* Builders Section */}
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0F0F0F]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl"
        >
            <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-bold mb-2">
                    🧑‍🍳 <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">We Cooked</span> Gimme Idea
                </h2>
                <p className="text-gray-400">Meet the builders behind this platform</p>
            </div>

            <div className="space-y-6">
                {/* ZAH */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-yellow-500/30 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-yellow-500/30 group-hover:border-yellow-500/60 transition-colors">
                                <img
                                    src="/asset/zah.png"
                                    alt="ZAH"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-[#0F0F0F] shadow-lg">
                                <span className="text-xs">👨‍💻</span>
                            </div>
                        </div>
                        <div className="flex-grow">
                            <h3 className="text-xl font-bold text-white mb-1 flex flex-wrap sm:flex-nowrap items-center gap-2">
                                ZAH
                                <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-[10px] font-mono text-yellow-400">FOUNDER</span>
                            </h3>
                            <p className="text-sm text-gray-400 mb-1">President @ DUT Superteam University Club</p>
                            <p className="text-xs text-gray-500">Founder @ Gimme Idea</p>
                        </div>
                    </div>
                </motion.div>

                {/* THODIUM */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500/30 group-hover:border-blue-500/60 transition-colors">
                                <img
                                    src="/asset/thodium.png"
                                    alt="THODIUM"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#0F0F0F] shadow-lg">
                                <span className="text-xs">⚡</span>
                            </div>
                        </div>
                        <div className="flex-grow">
                            <h3 className="text-xl font-bold text-white mb-1 flex flex-wrap sm:flex-nowrap items-center gap-2">
                                THODIUM
                                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-[10px] font-mono text-blue-400">CO-FOUNDER</span>
                            </h3>
                            <p className="text-sm text-gray-400 mb-1">Vice President @ DUT Superteam University Club</p>
                            <p className="text-xs text-gray-500">Co-Founder @ Gimme Idea</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Fun fact */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 p-4 bg-gradient-to-r from-yellow-500/5 to-blue-500/5 border border-white/5 rounded-xl"
            >
                <p className="text-sm text-gray-400 text-center">
                    💡 Built with <span className="text-red-400">❤️</span>, <span className="text-yellow-400">☕</span> coffee, and countless late nights
                </p>
            </motion.div>

        </motion.div> {/* End Builders Section */}

                {/* Social Links */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex gap-4"
                >
                    <a
                        href="https://twitter.com/intent/tweet?text=Just%20supported%20Gimme%20Idea!%20Check%20out%20the%20future%20of%20Solana%20building.&url=https://gimmeidea.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-white/5 hover:bg-[#1DA1F2]/10 border border-white/10 hover:border-[#1DA1F2]/50 rounded-xl p-4 flex items-center justify-center gap-2 transition-all group"
                    >
                        <Twitter className="w-5 h-5 text-gray-400 group-hover:text-[#1DA1F2] transition-colors" />
                        <span className="text-sm font-bold text-gray-300 group-hover:text-white">Tweet Support</span>
                    </a>
                    <a
                        href="https://t.me/+s7KW91Nf4G1iZWVl"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-white/5 hover:bg-[#0088cc]/10 border border-white/10 hover:border-[#0088cc]/50 rounded-xl p-4 flex items-center justify-center gap-2 transition-all group"
                    >
                        <Send className="w-5 h-5 text-gray-400 group-hover:text-[#0088cc]" />
                        <span className="text-sm font-bold text-gray-300 group-hover:text-white">Join Telegram</span>
                    </a>
                </motion.div>
        
        </div> {/* Close new flex wrapper */}
      </div> {/* Close max-w-6xl mx-auto w-full */}
    </div> {/* Close min-h-screen pt-24 pb-12 px-6 relative overflow-hidden flex items-center */}
    </div>
  );
};
