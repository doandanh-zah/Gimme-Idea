'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Coins } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Project } from '../lib/types';
import toast from 'react-hot-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const RECIPIENT_WALLET = 'your_wallet_address_here'; // TODO: Replace with your wallet address
const SOL_PRICE_USD = 150; // Approximate SOL price, should fetch from API in production

interface Message {
  role: 'ai' | 'user';
  content: string;
  recommendedIdeas?: Project[];
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationStep, setConversationStep] = useState(0);
  const [userContext, setUserContext] = useState({ interest: '', strengths: '' });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasUnlimitedAccess, setHasUnlimitedAccess] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(1); // USD amount
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { publicKey, sendTransaction } = useWallet();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize conversation
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'ai',
        content: 'Bạn đang cần tôi giúp bạn ý tưởng về gì?'
      }]);
      setConversationStep(0);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Step 1: User describes what they want
      if (conversationStep === 0) {
        setUserContext(prev => ({ ...prev, interest: input }));

        // Check if input is too short
        if (input.trim().length < 20) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'ai',
              content: `I need a bit more info to help you out — tell me your strengths and why you want to build in ${input.string()}?`
            }]);
            setIsLoading(false);
          }, 800);
        } else {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'ai',
              content: `What are your strengths and why do you want to build ${input.string()}?`
            }]);
            setIsLoading(false);
          }, 800);
        }
        setConversationStep(1);
      }
      // Step 2: User describes their strengths
      else if (conversationStep === 1) {
        setUserContext(prev => ({ ...prev, strengths: input }));

        // Fetch AI recommendations
        const response = await axios.post(`${API_URL}/ai/find-ideas`, {
          interest: userContext.interest,
          strengths: input,
        });

        if (response.data.success) {
          const recommendedIdeas = response.data.data.ideas;
          const reasoning = response.data.data.reasoning;

          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'ai',
              content: `Here are my top 3 recommendations for you!\n\n${reasoning}`,
              recommendedIdeas
            }]);
            setIsLoading(false);
          }, 1000);
        } else {
          throw new Error('Failed to get recommendations');
        }
        setConversationStep(2);
      }
      // Step 3+: Additional questions (requires payment)
      else {
        if (!hasUnlimitedAccess) {
          setShowPaymentModal(true);
          setIsLoading(false);
          return;
        }

        // Handle unlimited chat
        const response = await axios.post(`${API_URL}/ai/chat`, {
          message: input,
          context: userContext,
          history: messages
        });

        if (response.data.success) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'ai',
              content: response.data.data.reply
            }]);
            setIsLoading(false);
          }, 800);
        }
      }
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Opps. Something went wrong. Please try again later.'
      }]);
      setIsLoading(false);
    }
  };

  const handleIdeaClick = (ideaId: string) => {
    router.push(`/idea/${ideaId}`);
    onClose();
  };

  const handlePayment = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (paymentAmount < 1) {
      toast.error('Minimum payment is $1');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Calculate SOL amount
      const solAmount = paymentAmount / SOL_PRICE_USD;
      const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

      // Create connection
      const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com');

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(RECIPIENT_WALLET),
          lamports,
        })
      );

      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send transaction
      const signature = await sendTransaction(transaction, connection);

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      // Calculate messages granted (10 messages per dollar)
      const messagesGranted = paymentAmount * 10;

      toast.success(`Payment successful! You received ${messagesGranted} messages.`);
      setHasUnlimitedAccess(true);
      setShowPaymentModal(false);

      // TODO: Save transaction to backend for user's message credit
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl bg-[#121212] border border-[#FFD700]/30 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="relative px-8 py-6 border-b border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] to-[#FDB931] opacity-10" />
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden">
                <img src="/assets/logo-gmi.png" alt="Gimme Sensei" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display text-white">AI Idea Finder</h2>
                <p className="text-sm text-gray-400">Let Gimme Sensei help you find some crazyyy idea !</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-gradient-to-b from-[#121212] to-[#0A0A0A]">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black'
                    : 'bg-[#1A1A1A] text-white border border-white/10'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Recommended Ideas */}
                {msg.recommendedIdeas && msg.recommendedIdeas.length > 0 && (
                  <div className="mt-6 space-y-4">
                    {msg.recommendedIdeas.map(idea => (
                      <div
                        key={idea.id}
                        onClick={() => handleIdeaClick(idea.id)}
                        className="p-4 bg-white/5 border border-[#FFD700]/20 rounded-xl hover:border-[#FFD700]/50 transition-all cursor-pointer group"
                      >
                        <h4 className="font-bold text-[#FFD700] mb-2 group-hover:underline">
                          {idea.title}
                        </h4>
                        <p className="text-sm text-gray-400 line-clamp-2">{idea.problem}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-[#FFD700]/10 text-[#FFD700] rounded-full">
                            {idea.category}
                          </span>
                          <span className="text-xs text-gray-500">💬 {idea.feedbackCount || 0}</span>
                          <span className="text-xs text-gray-500">👍 {idea.votes || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#1A1A1A] text-white border border-white/10 rounded-2xl px-6 py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#FFD700]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-white/10 bg-[#0F0F0F]">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              placeholder="Write your answer..."
              className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-5 py-3 outline-none focus:border-[#FFD700]/30 text-white placeholder:text-gray-600"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </motion.div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center px-4"
          >
            <div className="absolute inset-0 bg-black/90 backdrop-blur-lg" onClick={() => setShowPaymentModal(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-[#1A1A1A] border border-[#FFD700]/30 rounded-3xl p-8 max-w-lg w-full"
            >
              {/* Header with Icon */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#FDB931] flex items-center justify-center text-black">
                  <Coins className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-white">Unlock More Messages</h3>
                  <p className="text-sm text-gray-400">Continue your conversation with AI</p>
                </div>
              </div>

              {/* Info */}
              <p className="text-gray-300 mb-6 font-mono text-sm">
                You've used your free questions. Purchase additional messages to keep chatting with the AI and get more personalized recommendations.
              </p>

              {/* Pricing Info */}
              <div className="bg-[#FFD700]/5 border border-[#FFD700]/20 rounded-xl p-4 mb-6">
                <p className="text-[#FFD700] text-sm font-mono font-bold mb-2">💡 Pricing</p>
                <p className="text-white font-mono">$1 USD = 10 AI messages</p>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-mono text-gray-400 mb-2">Amount (USD)</label>
                <input
                  type="number"
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#0F0F0F] border border-white/20 rounded-xl px-4 py-3 text-white font-mono text-lg outline-none focus:border-[#FFD700]/50 transition-colors"
                  placeholder="Enter amount"
                />

                {/* Quick Select Buttons */}
                <div className="flex gap-2 mt-3">
                  {[1, 2, 5, 10].map((val) => (
                    <button
                      key={val}
                      onClick={() => setPaymentAmount(val)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                        paymentAmount === val
                          ? 'bg-[#FFD700]/20 border-[#FFD700] text-white'
                          : 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>

                <div className="mt-3 space-y-1">
                  <p className="text-sm text-gray-400 font-mono">
                    ≈ <span className="text-[#FFD700]">{(paymentAmount / SOL_PRICE_USD).toFixed(4)} SOL</span>
                  </p>
                  <p className="text-sm text-gray-400 font-mono">
                    You'll receive: <span className="text-white font-bold">{paymentAmount * 10} messages</span>
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handlePayment}
                  disabled={isProcessingPayment}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black rounded-xl font-bold font-display hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay $${paymentAmount}`
                  )}
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  disabled={isProcessingPayment}
                  className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-bold font-display hover:bg-white/20 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-gray-500 text-center mt-4 font-mono">
                Payment will be processed via Solana blockchain
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
