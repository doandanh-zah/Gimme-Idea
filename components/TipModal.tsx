'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Loader2, CheckCircle } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { api } from '@/lib/api';
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import toast from 'react-hot-toast';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: {
    id: string;
    title: string;
    author?: {
      username: string;
      wallet?: string;
    };
  };
}

const TIP_AMOUNTS = [0.01, 0.05, 0.1, 0.5, 1];

export function TipModal({ isOpen, onClose, idea }: TipModalProps) {
  const { isConnected, walletAddress, signAndSendTransaction } = useWallet();
  const [amount, setAmount] = useState(0.1);
  const [customAmount, setCustomAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const recipientWallet = idea.author?.wallet || 'FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm'; // Default treasury

  const handleTip = async () => {
    if (!isConnected || !walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    const tipAmount = customAmount ? parseFloat(customAmount) : amount;
    if (!tipAmount || tipAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSending(true);
    setTxSignature(null);

    try {
      // Create transfer instruction
      const fromPubkey = new PublicKey(walletAddress);
      const toPubkey = new PublicKey(recipientWallet);
      const lamports = Math.floor(tipAmount * LAMPORTS_PER_SOL);

      const transferInstruction = SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      });

      // Send transaction via Lazorkit
      const signature = await signAndSendTransaction({
        instructions: [transferInstruction],
      });

      setTxSignature(signature);

      // Record transaction in Supabase
      await api.recordTip({
        signature,
        amount: tipAmount,
        projectId: idea.id,
        recipientAddress: recipientWallet,
      });

      toast.success(`Tipped ${tipAmount} SOL successfully!`);
    } catch (error: any) {
      console.error('Tip error:', error);
      toast.error(error.message || 'Failed to send tip');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setTxSignature(null);
    setCustomAmount('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-dark border border-white/10 rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/40 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-accent" />
                </div>
                <h2 className="text-xl font-bold text-white">Send Tip</h2>
              </div>
              <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {txSignature ? (
                // Success state
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Tip Sent!</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Your tip has been sent to {idea.author?.username || 'the creator'}
                  </p>
                  <a
                    href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    View on Explorer →
                  </a>
                </div>
              ) : (
                // Tip form
                <>
                  <p className="text-gray-400 mb-4">
                    Tip <span className="text-white font-medium">{idea.author?.username || 'Anonymous'}</span> for{' '}
                    <span className="text-white font-medium">"{idea.title}"</span>
                  </p>

                  {/* Preset amounts */}
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {TIP_AMOUNTS.map(preset => (
                      <button
                        key={preset}
                        onClick={() => { setAmount(preset); setCustomAmount(''); }}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${
                          amount === preset && !customAmount
                            ? 'bg-primary text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {preset} SOL
                      </button>
                    ))}
                  </div>

                  {/* Custom amount */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-1">Custom amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={customAmount}
                        onChange={e => setCustomAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none pr-16"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">SOL</span>
                    </div>
                  </div>

                  {/* Send button */}
                  <button
                    onClick={handleTip}
                    disabled={isSending || !isConnected}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-accent/80 to-accent text-dark font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Send {customAmount || amount} SOL</span>
                    )}
                  </button>

                  {!isConnected && (
                    <p className="text-center text-sm text-yellow-400 mt-2">
                      Connect your wallet to send tips
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
