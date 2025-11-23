
'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { LoadingLightbulb, LoadingStatus } from './LoadingLightbulb';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  context: 'project' | 'comment';
  onConfirm?: (amount: number) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  recipientName, 
  context,
  onConfirm 
}) => {
  const [amount, setAmount] = useState('10');
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<LoadingStatus>('loading');
  const [txHash, setTxHash] = useState('');

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
        setProcessing(false);
        setStatus('loading');
        setTxHash('');
    }
  }, [isOpen]);

  const handlePayment = async () => {
    setProcessing(true);
    setStatus('loading');

    try {
        // Simulate transaction time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate mock transaction hash
        const mockHash = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
        setTxHash(mockHash);

        setStatus('success');
        
        if (onConfirm) {
            setTimeout(() => {
                onConfirm(Number(amount));
            }, 500);
        }
        
        // Wait longer before closing so user can click the link
        // User will close manually or it closes after a long delay
    } catch (e) {
        setStatus('error');
        setTimeout(() => {
            setProcessing(false);
        }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={processing ? undefined : onClose} />
        
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ 
                scale: 1, 
                opacity: 1,
                borderColor: status === 'success' ? 'rgba(20, 241, 149, 0.5)' : 'rgba(255, 255, 255, 0.1)'
            }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-md bg-[#0F0F0F] border rounded-2xl p-6 shadow-2xl overflow-hidden min-h-[400px] flex flex-col"
            style={{
                boxShadow: status === 'success' ? '0 0 40px rgba(20, 241, 149, 0.1)' : '0 0 20px rgba(0,0,0,0.5)'
            }}
        >
            {/* Close Button */}
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-gray-400 hover:text-white z-20"
            >
                <X className="w-5 h-5" />
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
                                className="text-2xl font-bold text-white mb-2"
                            >
                                Transfer Complete
                            </motion.h2>

                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-white/5 border border-white/10 rounded-xl p-4 w-full max-w-[280px] mx-auto mt-4"
                            >
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">Amount</span>
                                    <span className="font-bold text-white">{amount} USDC</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">To</span>
                                    <span className="font-bold text-white truncate max-w-[120px]">{recipientName}</span>
                                </div>
                                <div className="w-full h-px bg-white/10 my-3" />
                                <a 
                                    href={`https://solscan.io/tx/${txHash}?cluster=devnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex justify-center items-center gap-2 text-xs font-mono text-green-400 hover:text-green-300 hover:underline transition-colors"
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
                ) : (
                    <motion.div 
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col"
                    >
                        <h2 className="text-2xl font-bold mb-1">
                            {context === 'project' ? 'Support Project' : 'Tip Contributor'}
                        </h2>
                        <p className="text-gray-400 text-sm mb-6">Send USDC to <span className="text-white font-bold">{recipientName}</span></p>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 font-mono uppercase">Amount (USDC)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-2xl font-bold outline-none focus:border-primary transition-colors text-white"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">USDC</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {['5', '10', '25', '50', '100'].map((val) => (
                                    <button 
                                        key={val}
                                        onClick={() => setAmount(val)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                                            amount === val ? 'bg-primary/20 border-primary text-white' : 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5'
                                        }`}
                                    >
                                        ${val}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handlePayment}
                            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-accent transition-colors flex items-center justify-center gap-2 mt-auto"
                        >
                            Send Contribution
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    </div>
  );
};
