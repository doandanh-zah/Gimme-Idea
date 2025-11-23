
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Send, Twitter, Copy, Check, Trophy, Clock, DollarSign, Crown, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../lib/store';
import { apiClient } from '../lib/api-client';

export const Donate = () => {
  const { user, openConnectReminder } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('10');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'top'>('top');
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [topDonators, setTopDonators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch donation data on mount
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setIsLoading(true);
        const [recent, top] = await Promise.all([
          apiClient.getRecentDonations(10),
          apiClient.getTopDonators(10)
        ]);

        if (recent.success && recent.data) {
          setRecentDonations(recent.data);
        }
        if (top.success && top.data) {
          setTopDonators(top.data);
        }
      } catch (error) {
        console.error('Failed to fetch donations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonations();
  }, []);

  const walletAddress = "FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm";

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    toast.success("Wallet address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDonate = async () => {
    if (!user) {
        openConnectReminder();
        return;
    }

    setIsProcessing(true);
    
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setIsSuccess(true);
    toast.success("Donation sent!");
    
    // Keep success state longer to show the effect
    setTimeout(() => {
        setIsSuccess(false);
    }, 5000);
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 relative overflow-hidden">
      
      {/* Background */}
      <div className="fixed inset-0 z-[-1] bg-[radial-gradient(circle_at_50%_0%,#3b0764_0%,#000000_100%)] opacity-80" />
      <div className="fixed inset-0 z-[-1] opacity-30 bg-[linear-gradient(rgba(236,72,153,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />

      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
        
        {/* Left Column: Donation Actions */}
        <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
        >
            <div className="text-left">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-sm mb-6"
                >
                    <Heart className="w-4 h-4 fill-current" /> Support the Builder
                </motion.div>
                <h1 className="text-5xl font-display font-bold mb-4 leading-tight">
                    Fuel the <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Revolution.</span>
                </h1>
                <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                    Your contribution directly supports server costs, coffee, and open-source development.
                </p>
            </div>

            {/* Donation Card */}
            <div className="bg-[#0F0F0F]/80 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-blue-900/10 group min-h-[420px] flex flex-col justify-center">
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
                            <p className="text-gray-400 mb-6">You successfully sent <span className="text-white font-bold">{amount} USDC</span></p>
                            
                            <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 max-w-xs">
                                <div className="flex justify-between items-center text-sm mb-2">
                                    <span className="text-gray-500">Status</span>
                                    <span className="text-green-400 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Confirmed</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Transaction</span>
                                    <a href="#" className="text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1">
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
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Select Amount</label>
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                    {['5', '10', '50', '100'].map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => setAmount(val)}
                                            className={`py-3 rounded-xl font-mono font-bold transition-all border ${
                                                amount === val 
                                                ? 'bg-blue-500/20 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                                                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/10'
                                            }`}
                                        >
                                            ${val}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative group/input">
                                    <input 
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-2xl font-bold text-white outline-none focus:border-blue-500 transition-colors pl-12 group-hover/input:border-white/20"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                                        <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" className="w-6 h-6" alt="USDC" />
                                    </div>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono text-gray-500 pointer-events-none">
                                        USDC
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

            {/* Social Links Mini */}
            <div className="flex gap-4">
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
            </div>
        </motion.div>

        {/* Right Column: Leaderboard & Feed */}
        <motion.div 
             initial={{ opacity: 0, x: 50 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.2 }}
             className="bg-[#0F0F0F]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden flex flex-col h-full min-h-[600px] shadow-2xl"
        >
             {/* Tabs */}
             <div className="flex border-b border-white/10">
                 <button 
                    onClick={() => setActiveTab('top')}
                    className={`flex-1 py-6 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'top' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                    <div className="flex items-center justify-center gap-2">
                        <Trophy className={`w-4 h-4 ${activeTab === 'top' ? 'text-yellow-500' : ''}`} /> Top Donators
                    </div>
                    {activeTab === 'top' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 shadow-[0_-2px_10px_rgba(59,130,246,0.5)]" />}
                 </button>
                 <button 
                    onClick={() => setActiveTab('recent')}
                    className={`flex-1 py-6 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'recent' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                    <div className="flex items-center justify-center gap-2">
                        <Clock className={`w-4 h-4 ${activeTab === 'recent' ? 'text-blue-500' : ''}`} /> Recent Activity
                    </div>
                    {activeTab === 'recent' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 shadow-[0_-2px_10px_rgba(59,130,246,0.5)]" />}
                 </button>
             </div>

             {/* Content */}
             <div className="p-0 overflow-y-auto flex-grow custom-scrollbar">
                 <AnimatePresence mode="wait">
                    {activeTab === 'top' ? (
                        <motion.div 
                            key="top"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="divide-y divide-white/5"
                        >
                            {topDonators.map((donor, index) => (
                                <div key={donor.id} className="p-6 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                                    <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full font-display font-bold text-lg relative border border-white/5
                                        ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 
                                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-black' :
                                          index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-black' :
                                          'bg-white/5 text-gray-500'}
                                    `}>
                                        {index < 3 ? <Crown className="w-6 h-6" /> : index + 1}
                                        {index === 0 && <div className="absolute -top-2 -right-2 text-2xl animate-bounce">👑</div>}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`font-bold ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>{donor.user}</span>
                                            <span className="font-mono text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 text-xs">${donor.amount}</span>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                            <div 
                                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full relative" 
                                                style={{ width: `${topDonators[0] ? (donor.amount / topDonators[0].amount) * 100 : 0}%` }} 
                                            >
                                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="recent"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="divide-y divide-white/5"
                        >
                            {recentDonations.map((item) => (
                                <div key={item.id} className="p-6 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 overflow-hidden flex-shrink-0 group-hover:border-blue-500/30 transition-colors">
                                        {item.avatar ? (
                                            <img src={item.avatar} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">?</div>
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-gray-200">{item.user}</span>
                                            <span className="text-xs text-gray-500 font-mono">{item.time}</span>
                                        </div>
                                        <div className="text-sm text-gray-400 mt-0.5 flex items-center gap-1">
                                            Donated <span className="text-white font-bold">${item.amount}</span>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-green-500/10 rounded-full border border-green-500/10 group-hover:border-green-500/30 transition-colors">
                                        <DollarSign className="w-4 h-4 text-green-500" />
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                 </AnimatePresence>
             </div>
        </motion.div>
      </div>
    </div>
  );
};
