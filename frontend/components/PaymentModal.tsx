
'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, ExternalLink, AlertTriangle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { LoadingLightbulb, LoadingStatus } from './LoadingLightbulb';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { usePasskeyWallet } from '@/contexts/LazorkitContext';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js';
import { apiClient } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import { WalletRequiredModal } from './WalletRequiredModal';

// Memo Program ID for adding transaction context
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientWallet?: string;
  context: 'project' | 'comment';
  commentId?: string;
  projectId?: string;
  onConfirm?: (amount: number) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  recipientName,
  recipientWallet,
  context,
  commentId,
  projectId,
  onConfirm
}) => {
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
  
  const { user } = useAuth();
  const [amount, setAmount] = useState('10');
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<LoadingStatus>('loading');
  const [txHash, setTxHash] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletModalMode, setWalletModalMode] = useState<'reconnect' | 'connect'>('connect');
  const [showPreview, setShowPreview] = useState(false);

  // Check if any wallet is connected (standard or passkey)
  const isWalletConnected = (connected && publicKey) || (isPasskeyConnected && passkeyWalletAddress);
  const activeWalletAddress = publicKey?.toBase58() || passkeyWalletAddress;
  const isUsingPasskey = isPasskeyConnected && passkeyWalletAddress && !publicKey;

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
        setProcessing(false);
        setStatus('loading');
        setTxHash('');
        setShowPreview(false);
    }
  }, [isOpen]);

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

  // Initiate payment - show preview first
  const initiatePayment = () => {
    // Check if any wallet is connected
    if (!isWalletConnected) {
      // Determine the right message and action based on user's wallet status
      if (user?.wallet) {
        // User has wallet linked but not connected (needs reconnect)
        setWalletModalMode('reconnect');
        setShowWalletModal(true);
      } else {
        // User doesn't have wallet linked
        setWalletModalMode('connect');
        setShowWalletModal(true);
      }
      return;
    }

    // Verify connected wallet matches user's linked wallet
    if (user?.wallet && activeWalletAddress !== user.wallet) {
      toast.error('Connected wallet does not match your profile. Please reconnect with the correct wallet.');
      setWalletModalMode('reconnect');
      setShowWalletModal(true);
      return;
    }

    if (!recipientWallet) {
      toast.error('Recipient wallet address not available');
      return;
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Show preview before sending
    setShowPreview(true);
  };

  // Execute the actual payment after preview confirmation
  const handlePayment = async () => {
    if (!recipientWallet || !isWalletConnected) return;

    const amountNum = Number(amount);
    setShowPreview(false);
    setProcessing(true);
    setStatus('loading');

    try {
      const recipientPubKey = new PublicKey(recipientWallet);
      const lamports = Math.floor(amountNum * LAMPORTS_PER_SOL);

      // Create memo for transaction context
      const memoText = context === 'comment' 
        ? `Gimme Idea: Tip to ${recipientName}`
        : `Gimme Idea: Support ${recipientName}`;

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

        // Wait for confirmation
        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        }, 'confirmed');
      } else {
        throw new Error('No wallet connected');
      }

      setTxHash(signature);
      setStatus('success');

      // Verify transaction with backend
      try {
        await apiClient.verifyTransaction({
          signature,
          type: context === 'comment' ? 'tip' : 'bounty',
          amount: amountNum,
          commentId,
          projectId,
        });
      } catch (backendError) {
        console.error('Failed to verify transaction with backend:', backendError);
        // Transaction succeeded on-chain but backend verification failed
        // This is not critical - the blockchain is the source of truth
      }

      if (onConfirm) {
        setTimeout(() => {
          onConfirm(amountNum);
        }, 500);
      }
    } catch (error: any) {
      console.error('Payment failed:', error);
      setStatus('error');

      // Provide user-friendly error messages
      let errorMessage = 'Transaction failed';
      if (error.message?.includes('User rejected') || error.message?.includes('cancelled')) {
        errorMessage = 'Transaction cancelled';
      } else if (error.message?.includes('insufficient funds') || error.message?.includes('Insufficient')) {
        errorMessage = 'Insufficient SOL balance';
      }

      toast.error(errorMessage);

      setTimeout(() => {
        setProcessing(false);
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <button
            type="button"
            aria-label="Close payment dialog"
            tabIndex={-1}
            className="absolute inset-0 modal-overlay"
            onClick={processing ? undefined : onClose}
        />
        
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ 
                scale: 1, 
                opacity: 1,
                borderColor: status === 'success' ? 'rgba(20, 241, 149, 0.5)' : 'rgba(255, 255, 255, 0.1)'
            }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="modal-frame max-w-md p-4 sm:p-6 overflow-hidden min-h-[350px] sm:min-h-[400px] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-title"
            style={{
                boxShadow: status === 'success' ? '0 0 40px rgba(20, 241, 149, 0.1)' : '0 0 20px rgba(0,0,0,0.5)'
            }}
        >
            {/* Close Button */}
            <button 
                type="button"
                onClick={onClose} 
                className="modal-close"
                aria-label="Close payment dialog"
            >
                <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <AnimatePresence mode="wait">
                {processing ? (
                    status === 'success' ? (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-grow flex flex-col items-center justify-center h-full text-center"
                        >
                            {/* Elegant Success Animation */}
                            <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50"
                                >
                                    <svg className="w-10 h-10 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <motion.path
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.5, delay: 0.2 }}
                                            d="M20 6L9 17l-5-5"
                                        />
                                    </svg>
                                </motion.div>
                                <motion.div 
                                    className="absolute inset-0 rounded-full border border-green-500/30"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1.5, opacity: 0 }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            </div>

                            <motion.h2 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-xl sm:text-2xl font-bold text-white mb-2"
                            >
                                Transfer Complete
                            </motion.h2>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="modal-section w-full max-w-[280px] mx-auto mt-4"
                            >
                                <div className="flex justify-between text-xs sm:text-sm mb-2">
                                    <span className="text-gray-400">Amount</span>
                                    <span className="font-bold text-white">{amount} SOL</span>
                                </div>
                                <div className="flex justify-between text-xs sm:text-sm">
                                    <span className="text-gray-400">To</span>
                                    <span className="font-bold text-white truncate max-w-[100px] sm:max-w-[120px]">{recipientName}</span>
                                </div>
                                <div className="w-full h-px bg-white/10 my-3" />
                                <a 
                                    href={`https://solscan.io/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex justify-center items-center gap-2 text-[10px] sm:text-xs font-mono text-green-400 hover:text-green-300 hover:underline transition-colors"
                                >
                                    View on Solscan <ExternalLink className="w-3 h-3" />
                                </a>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="loading"
                            exit={{ opacity: 0 }}
                            className="flex-grow flex flex-col items-center justify-center h-full"
                        >
                             <LoadingLightbulb 
                                text={status === 'error' ? "Transaction Failed" : "Confirming Transaction..."} 
                                status={status}
                            />
                        </motion.div>
                    )
                ) : showPreview ? (
                    /* Transaction Preview Step */
                    <motion.div 
                        key="preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-5 h-5 text-green-400" />
                            <h2 id="payment-title" className="text-xl sm:text-2xl font-bold">Confirm Transaction</h2>
                        </div>
                        
                        <div className="modal-section mb-4">
                            <p className="text-gray-400 text-xs mb-3 uppercase font-mono">Transaction Details</p>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Action</span>
                                    <span className="text-white font-medium">{context === 'comment' ? 'Tip' : 'Support'}</span>
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
                                        <span className="text-white font-medium block">{recipientName}</span>
                                        <span className="text-gray-500 font-mono text-xs">
                                            {recipientWallet ? shortenAddress(recipientWallet) : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border border-green-500/20 bg-green-500/10 p-3 mb-4">
                            <div className="flex items-start gap-2">
                                <Shield className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <p className="text-green-400 text-xs">
                                    This is a verified Gimme Idea transaction. Your wallet will show the exact amount being sent.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-auto">
                            <button 
                                type="button"
                                onClick={() => setShowPreview(false)}
                                className="btn-ghost flex-1 text-sm"
                            >
                                Back
                            </button>
                            <button 
                                type="button"
                                onClick={handlePayment}
                                className="btn-primary flex-1 text-sm"
                            >
                                Confirm & Send
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col"
                    >
                        <p className="ui-eyebrow mb-3">{context === 'project' ? 'Support' : 'Tip'}</p>
                        <h2 id="payment-title" className="text-xl sm:text-2xl font-bold mb-1">
                            {context === 'project' ? 'Support Project' : 'Tip Contributor'}
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">Send SOL to <span className="text-white font-bold">{recipientName}</span></p>

                        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                            <div>
                                <label className="field-label" htmlFor="payment-amount">Amount (SOL)</label>
                                <div className="relative">
                                    <input
                                        id="payment-amount"
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        step="0.1"
                                        className="field-input pr-16 text-xl font-bold sm:text-2xl"
                                    />
                                    <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm sm:text-base">SOL</span>
                                </div>
                            </div>
                            <div className="flex gap-1.5 sm:gap-2">
                                {['0.1', '0.5', '1', '2', '5'].map((val) => (
                                    <button 
                                        type="button"
                                        key={val}
                                        onClick={() => setAmount(val)}
                                        className={`flex-1 min-h-[40px] border px-2 py-2 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] sm:text-sm ${
                                            amount === val ? 'border-[#FFD700]/55 bg-[#FFD700]/10 text-[#FFD700]' : 'border-white/10 bg-transparent text-gray-400 hover:bg-white/5'
                                        }`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            type="button"
                            onClick={initiatePayment}
                            className="btn-primary mt-auto w-full text-sm sm:text-base"
                        >
                            Continue
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>

        {/* Wallet Required Modal */}
        <WalletRequiredModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          mode={walletModalMode}
          onSuccess={() => setShowWalletModal(false)}
        />
    </div>
  );
};
