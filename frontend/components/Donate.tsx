'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Send, Twitter, Copy, Check, ExternalLink, ArrowLeft, Sparkles, Coffee, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../lib/store';
import { apiClient } from '../lib/api-client';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useAuth } from '../contexts/AuthContext';
import { WalletRequiredModal } from './WalletRequiredModal';
import { useRouter } from 'next/navigation';

export const Donate = () => {
    const router = useRouter();
    const { openConnectReminder } = useAppStore();
    const { user } = useAuth();
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const [copied, setCopied] = useState(false);
    const [amount, setAmount] = useState('0.5');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [txHash, setTxHash] = useState('');
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [walletModalMode, setWalletModalMode] = useState<'reconnect' | 'connect'>('connect');
    const [contributorName, setContributorName] = useState('');

    const walletAddress = "FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm";

    const handleCopy = () => {
        navigator.clipboard.writeText(walletAddress);
        setCopied(true);
        toast.success("Wallet address copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDonate = async () => {
        // First check if user is signed in
        if (!user) {
            openConnectReminder();
            return;
        }

        // Then check if wallet is connected
        if (!publicKey) {
            if (user.wallet) {
                setWalletModalMode('reconnect');
            } else {
                setWalletModalMode('connect');
            }
            setShowWalletModal(true);
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
            const lamports = amountNum * LAMPORTS_PER_SOL;

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: recipientPubKey,
                    lamports,
                })
            );

            const signature = await sendTransaction(transaction, connection);

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

            try {
                await apiClient.verifyTransaction({
                    signature,
                    type: 'bounty',
                    amount: amountNum,
                });
            } catch (backendError: any) {
                if (backendError?.response?.status !== 400) {
                    console.warn('Backend verification skipped:', backendError.message || 'Unknown error');
                }
            }

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
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="min-h-screen pt-24 sm:pt-32 pb-20 px-4 sm:px-6"
        >
            <div className="max-w-4xl mx-auto">
                {/* Nav */}
                <button 
                    onClick={() => router.push('/')} 
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 sm:mb-8 text-sm"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </button>

                {/* Header */}
                <div className="mb-8 sm:mb-12">
                    <div className="flex flex-col gap-4 mb-6">
                        <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold leading-tight flex items-center gap-3">
                            <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 fill-blue-400" />
                            Support <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Gimme Idea</span>
                        </h1>
                        <p className="text-gray-400 text-sm sm:text-base max-w-2xl">
                            Your contribution helps keep our servers running and fuels open-source development for the Solana community.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400 border-b border-white/10 pb-6 sm:pb-8">
                        <span className="flex items-center gap-2">
                            <Coffee className="w-4 h-4 text-blue-400" /> Coffee Fund
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-blue-400" /> Server Costs
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-400" /> Open Source
                        </span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-12">
                    {/* Donation Section */}
                    <section>
                        <h3 className="text-xl font-bold text-blue-400 mb-4 font-mono uppercase tracking-wider">Make a Donation</h3>
                        
                        <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5">
                            <AnimatePresence mode="wait">
                                {isSuccess ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex flex-col items-center justify-center py-8"
                                    >
                                        <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                                className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50"
                                            >
                                                <Check className="w-8 h-8 text-green-500" />
                                            </motion.div>
                                        </div>

                                        <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
                                        <p className="text-gray-400 mb-6">
                                            You sent <span className="text-white font-bold">{amount} SOL</span>
                                        </p>

                                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-full max-w-sm">
                                            <div className="flex justify-between items-center text-sm mb-2">
                                                <span className="text-gray-500">Status</span>
                                                <span className="text-green-400 font-bold flex items-center gap-1">
                                                    <Check className="w-3 h-3" /> Confirmed
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Transaction</span>
                                                <a
                                                    href={`https://solscan.io/tx/${txHash}?cluster=devnet`}
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
                                            className="mt-6 text-sm text-gray-500 hover:text-white transition-colors"
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
                                        className="space-y-6"
                                    >
                                        {/* Amount Selection */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-400 mb-3">Select Amount (SOL)</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                                                {['0.1', '0.5', '1', '2'].map((val) => (
                                                    <button
                                                        key={val}
                                                        onClick={() => setAmount(val)}
                                                        className={`py-3 rounded-xl font-mono font-bold transition-all border ${
                                                            amount === val
                                                                ? 'bg-blue-500/20 border-blue-500 text-white'
                                                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                    >
                                                        {val} SOL
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    step="0.1"
                                                    className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-4 text-xl font-bold text-white outline-none focus:border-blue-500 transition-colors pr-16"
                                                    placeholder="Custom amount"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono text-gray-500">
                                                    SOL
                                                </span>
                                            </div>
                                        </div>

                                        {/* Name Input */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-400 mb-3">Your Name (optional)</label>
                                            <input
                                                type="text"
                                                value={contributorName}
                                                onChange={(e) => setContributorName(e.target.value)}
                                                placeholder="Anonymous Hero"
                                                className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                                            />
                                        </div>

                                        {/* Wallet Address */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-400 mb-3">Or send directly to</label>
                                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
                                                <code className="text-sm text-gray-300 font-mono truncate flex-1">
                                                    {walletAddress}
                                                </code>
                                                <button
                                                    onClick={handleCopy}
                                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white flex-shrink-0"
                                                >
                                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                            <button
                                                onClick={() => {
                                                    const amountNum = Number(amount);
                                                    if (isNaN(amountNum) || amountNum <= 0) {
                                                        toast.error('Please enter a valid amount');
                                                        return;
                                                    }
                                                    const message = contributorName ? `from ${contributorName}` : 'Supporting GimmeIdea';
                                                    const solanaUrl = `solana:${walletAddress}?amount=${amountNum}&label=GimmeIdea&message=${encodeURIComponent(message)}`;
                                                    window.open(solanaUrl, '_blank');
                                                }}
                                                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <ExternalLink className="w-4 h-4" /> Wallet App
                                            </button>
                                            <button
                                                onClick={handleDonate}
                                                disabled={isProcessing}
                                                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isProcessing ? "Processing..." : "Send Donation"} <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </section>

                    {/* Builders Section */}
                    <section>
                        <h3 className="text-xl font-bold text-blue-400 mb-4 font-mono uppercase tracking-wider">Meet the Builders</h3>
                        
                        <div className="p-6 bg-white/5 border-l-4 border-blue-500 rounded-r-xl mb-6">
                            <p className="text-lg text-white leading-relaxed">
                                👨‍💻 We built Gimme Idea to help the Solana community discover and share innovative ideas.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* ZAH */}
                            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 hover:border-blue-500/30 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-shrink-0">
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500/30 group-hover:border-blue-500/60 transition-colors">
                                            <img src="/asset/zah.png" alt="ZAH" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#0A0A0A]">
                                            <span className="text-[10px]">👨‍💻</span>
                                        </div>
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <h4 className="text-lg font-bold text-white flex flex-wrap items-center gap-2">
                                            ZAH
                                            <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-[10px] font-mono text-blue-400">FOUNDER</span>
                                        </h4>
                                        <p className="text-sm text-gray-400 truncate">President @ DUT Superteam University Club</p>
                                    </div>
                                </div>
                            </div>

                            {/* THODIUM */}
                            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 hover:border-cyan-500/30 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-shrink-0">
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-500/30 group-hover:border-cyan-500/60 transition-colors">
                                            <img src="/asset/thodium.png" alt="THODIUM" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-[#0A0A0A]">
                                            <span className="text-[10px]">⚡</span>
                                        </div>
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <h4 className="text-lg font-bold text-white flex flex-wrap items-center gap-2">
                                            THODIUM
                                            <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[10px] font-mono text-cyan-400">CO-FOUNDER</span>
                                        </h4>
                                        <p className="text-sm text-gray-400 truncate">Vice President @ DUT Superteam University Club</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fun fact */}
                        <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                            <p className="text-sm text-gray-400">
                                💡 Built with <span className="text-red-400">❤️</span>, <span className="text-blue-400">☕</span> coffee, and countless late nights
                            </p>
                        </div>
                    </section>

                    {/* Social Links */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-500 mb-4 font-mono uppercase">Share the Love</h3>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <a
                                href="https://twitter.com/intent/tweet?text=Just%20supported%20Gimme%20Idea!%20Check%20it%20out&url=https://gimmeidea.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-[#0A0A0A] hover:bg-[#1DA1F2]/10 border border-white/5 hover:border-[#1DA1F2]/50 rounded-xl p-4 flex items-center justify-center gap-2 transition-all group"
                            >
                                <Twitter className="w-5 h-5 text-gray-400 group-hover:text-[#1DA1F2]" />
                                <span className="text-sm font-bold text-gray-300 group-hover:text-white">Tweet Support</span>
                            </a>
                            <a
                                href="https://t.me/+s7KW91Nf4G1iZWVl"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-[#0A0A0A] hover:bg-[#0088cc]/10 border border-white/5 hover:border-[#0088cc]/50 rounded-xl p-4 flex items-center justify-center gap-2 transition-all group"
                            >
                                <Send className="w-5 h-5 text-gray-400 group-hover:text-[#0088cc]" />
                                <span className="text-sm font-bold text-gray-300 group-hover:text-white">Join Telegram</span>
                            </a>
                        </div>
                    </section>
                </div>
            </div>

            {/* Wallet Required Modal */}
            <WalletRequiredModal
                isOpen={showWalletModal}
                onClose={() => setShowWalletModal(false)}
                mode={walletModalMode}
                onSuccess={() => setShowWalletModal(false)}
            />
        </motion.div>
    );
};