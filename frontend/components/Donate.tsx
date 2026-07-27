'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Send, Copy, Check, ExternalLink, Sparkles, Coffee, Zap, Wallet, Shield } from 'lucide-react';
import { TwitterIcon as Twitter } from './icons/SocialBrandIcons';
import toast from 'react-hot-toast';
import { useAppStore } from '../lib/store';
import { apiClient } from '../lib/api-client';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { usePasskeyWallet } from '@/contexts/LazorkitContext';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js';
import { useAuth } from '../contexts/AuthContext';
import { WalletRequiredModal } from './WalletRequiredModal';

// Memo Program ID for adding transaction context
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export const Donate = () => {
    const { openConnectReminder } = useAppStore();
    const { user } = useAuth();
    
    // Standard Solana wallet adapter
    const { publicKey, sendTransaction, connected } = useWallet();
    const { connection } = useConnection();
    
    // Lazorkit passkey wallet
    const { 
        isPasskeyConnected, 
        passkeyWalletAddress, 
        smartWalletPubkey,
        signAndSendPasskeyTransaction 
    } = usePasskeyWallet();
    
    // Check if any wallet is connected
    const isWalletConnected = (connected && publicKey) || (isPasskeyConnected && passkeyWalletAddress);
    const isUsingPasskey = isPasskeyConnected && passkeyWalletAddress && !publicKey;
    const activeWalletAddress = publicKey?.toBase58() || passkeyWalletAddress;
    
    const [copied, setCopied] = useState(false);
    const [amount, setAmount] = useState('0.5');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [txHash, setTxHash] = useState('');
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [walletModalMode, setWalletModalMode] = useState<'reconnect' | 'connect'>('connect');
    const [contributorName, setContributorName] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    const walletAddress = "FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm";

    // Helper function to create memo instruction
    const createMemoInstruction = (message: string, signer: PublicKey): TransactionInstruction => {
        return new TransactionInstruction({
            keys: [{ pubkey: signer, isSigner: true, isWritable: false }],
            programId: MEMO_PROGRAM_ID,
            data: Buffer.from(message, 'utf-8'),
        });
    };

    // Shorten wallet address for display
    const shortenAddress = (address: string) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(walletAddress);
        setCopied(true);
        toast.success("Wallet address copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    // Initiate donation - show preview first
    const initiateDonate = () => {
        if (!user) {
            openConnectReminder();
            return;
        }

        if (!isWalletConnected) {
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

        setShowPreview(true);
    };

    const handleDonate = async () => {
        setShowPreview(false);
        const amountNum = Number(amount);
        
        setIsProcessing(true);

        try {
            const recipientPubKey = new PublicKey(walletAddress);
            const lamports = Math.floor(amountNum * LAMPORTS_PER_SOL);
            
            // Create memo for transaction context
            const memoText = `Gimme Idea: Donation to Treasury`;

            let signature: string;

            if (isUsingPasskey && smartWalletPubkey) {
                // Use Lazorkit passkey for transaction
                const transferInstruction = SystemProgram.transfer({
                    fromPubkey: smartWalletPubkey,
                    toPubkey: recipientPubKey,
                    lamports,
                });

                const memoInstruction = createMemoInstruction(memoText, smartWalletPubkey);

                signature = await signAndSendPasskeyTransaction({
                    instructions: [memoInstruction, transferInstruction],
                });
            } else if (publicKey) {
                // Use standard Solana wallet adapter with proper setup
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
                
                const transaction = new Transaction();
                
                // Add memo instruction first (explains the transaction purpose)
                transaction.add(createMemoInstruction(memoText, publicKey));
                
                // Add transfer instruction
                transaction.add(
                    SystemProgram.transfer({
                        fromPubkey: publicKey,
                        toPubkey: recipientPubKey,
                        lamports,
                    })
                );

                // Set transaction metadata explicitly
                transaction.recentBlockhash = blockhash;
                transaction.feePayer = publicKey;

                signature = await sendTransaction(transaction, connection);

                await connection.confirmTransaction({
                    signature,
                    blockhash,
                    lastValidBlockHeight,
                }, 'confirmed');
            } else {
                throw new Error('No wallet connected');
            }

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
            }, 8000);
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
        <div className="min-h-screen pt-20 sm:pt-24 pb-12 px-4 sm:px-6 relative overflow-hidden flex items-center">
            <div className="max-w-6xl mx-auto w-full">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8 sm:mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                        <Heart className="w-4 h-4 text-blue-400 fill-blue-400" />
                        <span className="text-xs font-mono text-blue-400 uppercase tracking-wide">Support Open Source</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-display font-bold mb-4">
                        Fuel the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Revolution</span>
                    </h1>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        Your contribution directly supports server costs, development, and keeping Gimme Idea free for the Solana community.
                    </p>
                </motion.div>

                {/* Main Grid */}
                <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
                    {/* Donation Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <Wallet className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg">Send Donation</h2>
                                    <p className="text-xs text-gray-500">SOL on Solana Network</p>
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {isSuccess ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="text-center py-8"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                                            <Check className="w-8 h-8 text-green-400" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Thank You! 🎉</h3>
                                        <p className="text-gray-400 text-sm mb-4">
                                            You sent <span className="text-white font-bold">{amount} SOL</span>
                                        </p>
                                        <a
                                            href={`https://solscan.io/tx/${txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                                        >
                                            View on Solscan <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </motion.div>
                                ) : showPreview ? (
                                    /* Transaction Preview Step */
                                    <motion.div
                                        key="preview"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="py-4"
                                    >
                                        <div className="flex items-center gap-2 mb-4">
                                            <Shield className="w-5 h-5 text-green-400" />
                                            <h3 className="font-bold text-lg">Confirm Transaction</h3>
                                        </div>
                                        
                                        <div className="bg-black/30 border border-white/10 rounded-xl p-4 mb-4">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400 text-sm">Action</span>
                                                    <span className="text-white font-medium">Donation</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400 text-sm">Amount</span>
                                                    <span className="text-white font-bold text-lg">{amount} SOL</span>
                                                </div>
                                                <div className="h-px bg-white/10" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400 text-sm">From</span>
                                                    <span className="text-white font-mono text-sm">
                                                        {activeWalletAddress ? shortenAddress(activeWalletAddress) : 'Your Wallet'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400 text-sm">To</span>
                                                    <div className="text-right">
                                                        <span className="text-white font-medium block">Gimme Idea Treasury</span>
                                                        <span className="text-gray-500 font-mono text-xs">
                                                            {shortenAddress(walletAddress)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4">
                                            <div className="flex items-start gap-2">
                                                <Shield className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-green-400 text-xs">
                                                    This is a verified Gimme Idea transaction. Your wallet will show the exact amount being sent.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setShowPreview(false)}
                                                className="flex-1 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors text-sm"
                                            >
                                                Back
                                            </button>
                                            <button 
                                                onClick={handleDonate}
                                                disabled={isProcessing}
                                                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-colors text-sm disabled:opacity-50"
                                            >
                                                {isProcessing ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Sending...
                                                    </div>
                                                ) : (
                                                    'Confirm & Send'
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="form"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {/* Amount Selection */}
                                        <div className="mb-5">
                                            <label className="block text-xs font-medium text-gray-400 mb-2">Select Amount</label>
                                            <div className="grid grid-cols-4 gap-2 mb-3">
                                                {['0.1', '0.5', '1', '2'].map((val) => (
                                                    <button
                                                        key={val}
                                                        onClick={() => setAmount(val)}
                                                        className={`py-2.5 rounded-xl font-mono text-sm font-bold transition-all ${
                                                            amount === val
                                                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                                                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                                                        }`}
                                                    >
                                                        {val}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    step="0.1"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-white outline-none focus:border-blue-500 transition-colors pr-16"
                                                    placeholder="Custom"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-mono">SOL</span>
                                            </div>
                                        </div>

                                        {/* Name (optional) */}
                                        <div className="mb-5">
                                            <label className="block text-xs font-medium text-gray-400 mb-2">Your Name (optional)</label>
                                            <input
                                                type="text"
                                                value={contributorName}
                                                onChange={(e) => setContributorName(e.target.value)}
                                                placeholder="Anonymous Hero"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors text-sm"
                                            />
                                        </div>

                                        {/* Wallet Address */}
                                        <div className="mb-6">
                                            <label className="block text-xs font-medium text-gray-400 mb-2">Or send directly</label>
                                            <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl p-3">
                                                <code className="text-xs text-gray-400 font-mono truncate flex-1">{walletAddress}</code>
                                                <button
                                                    onClick={handleCopy}
                                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                                                >
                                                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Buttons */}
                                        <div className="space-y-3">
                                            <button
                                                onClick={initiateDonate}
                                                disabled={isProcessing}
                                                className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-bold text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" /> Continue with {amount} SOL
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const amountNum = Number(amount);
                                                    if (isNaN(amountNum) || amountNum <= 0) {
                                                        toast.error('Please enter a valid amount');
                                                        return;
                                                    }
                                                    const message = contributorName || 'Supporting GimmeIdea';
                                                    const solanaUrl = `solana:${walletAddress}?amount=${amountNum}&label=GimmeIdea&message=${encodeURIComponent(message)}`;
                                                    window.open(solanaUrl, '_blank');
                                                }}
                                                className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-medium text-gray-300 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <ExternalLink className="w-4 h-4" /> Open in Wallet App
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Right Column: Builders + Social */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col gap-6"
                    >
                        {/* Builders */}
                        <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <span className="text-xl">👨‍🍳</span> We Cooked This
                            </h2>
                            
                            <div className="space-y-4">
                                {/* ZAH */}
                                <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/30 flex-shrink-0">
                                        <img src="/asset/zah.png" alt="ZAH" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">ZAH</span>
                                            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px] font-mono">FOUNDER</span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">President @ DUT Superteam UC</p>
                                    </div>
                                </div>

                                {/* THODIUM */}
                                <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500/30 flex-shrink-0">
                                        <img src="/asset/thodium.png" alt="THODIUM" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">THODIUM</span>
                                            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-mono">CO-FOUNDER</span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">Vice President @ DUT Superteam UC</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* What Your Donation Supports */}
                        <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <h2 className="font-bold text-lg mb-4">Your Support Powers</h2>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 rounded-xl bg-white/5">
                                    <Coffee className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                                    <p className="text-xs text-gray-400">Coffee Fund</p>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-white/5">
                                    <Zap className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                                    <p className="text-xs text-gray-400">Servers</p>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-white/5">
                                    <Sparkles className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                                    <p className="text-xs text-gray-400">Features</p>
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="flex gap-3">
                            <a
                                href="https://twitter.com/intent/tweet?text=Just%20supported%20Gimme%20Idea!&url=https://gimmeidea.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-white/5 hover:bg-[#1DA1F2]/10 border border-white/10 hover:border-[#1DA1F2]/30 rounded-xl p-3 flex items-center justify-center gap-2 transition-all group"
                            >
                                <Twitter className="w-4 h-4 text-gray-400 group-hover:text-[#1DA1F2]" />
                                <span className="text-sm text-gray-400 group-hover:text-white">Tweet</span>
                            </a>
                            <a
                                href="https://t.me/+s7KW91Nf4G1iZWVl"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-white/5 hover:bg-[#0088cc]/10 border border-white/10 hover:border-[#0088cc]/30 rounded-xl p-3 flex items-center justify-center gap-2 transition-all group"
                            >
                                <Send className="w-4 h-4 text-gray-400 group-hover:text-[#0088cc]" />
                                <span className="text-sm text-gray-400 group-hover:text-white">Telegram</span>
                            </a>
                        </div>
                    </motion.div>
                </div>
            </div>

            <WalletRequiredModal
                isOpen={showWalletModal}
                onClose={() => setShowWalletModal(false)}
                mode={walletModalMode}
                onSuccess={() => setShowWalletModal(false)}
            />
        </div>
    );
};
