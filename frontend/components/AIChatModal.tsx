'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Sparkles, Lock, History, Plus, Trash2, MessageCircle, ThumbsUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Project } from '../lib/types';
import toast from 'react-hot-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createUniqueSlug } from '../lib/slug-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const RECIPIENT_WALLET = 'FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm';
const MIN_DONATION_USD = 1;
const SOL_PRICE_USD = 220; // Approximate, should fetch from API

interface Message {
  id: string;
  role: 'ai' | 'user';
  content: string;
  recommendedIdeas?: Project[];
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  isLocked: boolean;
  createdAt: Date;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'gimme_ai_chat_sessions';

export const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState(1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [conversationStep, setConversationStep] = useState(0);
  const [userContext, setUserContext] = useState({ interest: '', context: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { publicKey, sendTransaction, connected } = useWallet();

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        })));
      } catch (e) {
        console.error('Failed to load chat sessions:', e);
      }
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId]);

  // Get active session
  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Create new session
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [{
        id: '1',
        role: 'ai',
        content: "Hey there! 👋 I'm Gimme Sensei, your AI idea finder. What kind of project are you looking to build? Tell me about your interests - DeFi, NFTs, Gaming, Social, or something else entirely!",
        timestamp: new Date()
      }],
      isLocked: false,
      createdAt: new Date()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setConversationStep(0);
    setUserContext({ interest: '', context: '' });
    setShowHistory(false);
  };

  // Initialize with new session if none exists
  useEffect(() => {
    if (isOpen && sessions.length === 0) {
      createNewSession();
    } else if (isOpen && !activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
  }, [isOpen]);

  // Delete session
  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      const remaining = sessions.filter(s => s.id !== sessionId);
      setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Add message to active session
  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    if (!activeSessionId) return;
    
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    setSessions(prev => prev.map(s => 
      s.id === activeSessionId 
        ? { ...s, messages: [...s.messages, newMessage] }
        : s
    ));
  };

  // Update session title based on first user message
  const updateSessionTitle = (title: string) => {
    if (!activeSessionId) return;
    setSessions(prev => prev.map(s =>
      s.id === activeSessionId
        ? { ...s, title: title.substring(0, 30) + (title.length > 30 ? '...' : '') }
        : s
    ));
  };

  // Lock session after recommendations
  const lockSession = () => {
    if (!activeSessionId) return;
    setSessions(prev => prev.map(s =>
      s.id === activeSessionId
        ? { ...s, isLocked: true }
        : s
    ));
  };

  // Unlock session after donation
  const unlockSession = () => {
    if (!activeSessionId) return;
    setSessions(prev => prev.map(s =>
      s.id === activeSessionId
        ? { ...s, isLocked: false }
        : s
    ));
    setConversationStep(3); // Allow continued chat
  };

  const handleSend = async () => {
    if (!input.trim() || !activeSession || activeSession.isLocked) return;

    const userMessage = input.trim();
    addMessage({ role: 'user', content: userMessage });
    setInput('');
    setIsLoading(true);

    try {
      // Step 0: User describes what they want to build
      if (conversationStep === 0) {
        setUserContext(prev => ({ ...prev, interest: userMessage }));
        updateSessionTitle(userMessage);

        setTimeout(() => {
          addMessage({
            role: 'ai',
            content: `Interesting! "${userMessage}" sounds exciting. 🎯\n\nNow tell me more about your situation - what's your background, skills, or unique advantage? Why do you want to build in this space?`
          });
          setIsLoading(false);
          setConversationStep(1);
        }, 1000);
      }
      // Step 1: User describes their context/advantages
      else if (conversationStep === 1) {
        setUserContext(prev => ({ ...prev, context: userMessage }));

        // Show "searching" message first
        addMessage({
          role: 'ai',
          content: "Got it! I understand your situation now. Let me find the 3 most suitable ideas for you... 🔍"
        });

        // Fetch AI recommendations
        try {
          const response = await axios.post(`${API_URL}/ai/find-ideas`, {
            interest: userContext.interest,
            strengths: userMessage,
          });

          if (response.data.success && response.data.data.ideas?.length > 0) {
            const ideas = response.data.data.ideas;
            
            setTimeout(() => {
              addMessage({
                role: 'ai',
                content: "Here are my top 3 recommendations based on your interests and background! Click any idea to learn more:",
                recommendedIdeas: ideas
              });
              setIsLoading(false);
              setConversationStep(2);
              
              // Lock the session after showing recommendations
              setTimeout(() => {
                lockSession();
              }, 500);
            }, 1500);
          } else {
            throw new Error('No ideas found');
          }
        } catch (error) {
          console.error('Failed to fetch ideas:', error);
          addMessage({
            role: 'ai',
            content: "I couldn't find matching ideas right now. Please try again with different criteria."
          });
          setIsLoading(false);
          setConversationStep(0);
        }
      }
      // Step 3+: Continued chat after unlock
      else if (conversationStep >= 3) {
        try {
          const response = await axios.post(`${API_URL}/ai/chat`, {
            message: userMessage,
            context: userContext,
            history: activeSession.messages.slice(-10)
          });

          if (response.data.success) {
            addMessage({
              role: 'ai',
              content: response.data.data.reply
            });
          } else {
            throw new Error('Chat failed');
          }
        } catch (error) {
          addMessage({
            role: 'ai',
            content: "Sorry, I encountered an error. Please try again."
          });
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      addMessage({
        role: 'ai',
        content: 'Something went wrong. Please try again later.'
      });
      setIsLoading(false);
    }
  };

  const handleIdeaClick = (idea: Project) => {
    const slug = createUniqueSlug(idea.title, idea.id);
    router.push(`/idea/${slug}`);
    onClose();
  };

  const handleDonation = async () => {
    if (!publicKey || !connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (donationAmount < MIN_DONATION_USD) {
      toast.error(`Minimum donation is $${MIN_DONATION_USD}`);
      return;
    }

    setIsProcessingPayment(true);

    try {
      const solAmount = donationAmount / SOL_PRICE_USD;
      const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

      const connection = new Connection(
        process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com',
        'confirmed'
      );

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(RECIPIENT_WALLET),
          lamports,
        })
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);

      // Wait for confirmation with timeout
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }

      // Verify the transaction
      const txInfo = await connection.getTransaction(signature, { maxSupportedTransactionVersion: 0 });
      if (!txInfo) {
        throw new Error('Could not verify transaction');
      }

      toast.success('Thank you for your donation! Chat unlocked! 🎉');
      unlockSession();
      setShowDonateModal(false);

      // Add unlock message
      addMessage({
        role: 'ai',
        content: "Thanks for your support! 💛 Feel free to continue our conversation. What else would you like to know about these ideas or explore other options?"
      });

    } catch (error: any) {
      console.error('Donation error:', error);
      toast.error(error.message || 'Transaction failed. Please try again.');
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
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-5xl h-[85vh] bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex"
      >
        {/* Sidebar - History */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-white/10 bg-[#0d0d12] flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-white/10">
                <button
                  onClick={createNewSession}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FFD700] text-black rounded-xl font-bold hover:bg-[#FFD700]/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Chat
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => {
                      setActiveSessionId(session.id);
                      setShowHistory(false);
                    }}
                    className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      session.id === activeSessionId
                        ? 'bg-[#FFD700]/20 text-white'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate text-sm">{session.title}</span>
                    {session.isLocked && <Lock className="w-3 h-3 text-[#FFD700]" />}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0d0d12]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-[#FFD700]/20 text-[#FFD700]' : 'bg-white/5 text-gray-400 hover:text-white'}`}
              >
                <History className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#FDB931] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Gimme Sensei</h2>
                  <p className="text-xs text-gray-500">AI Idea Finder</p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeSession?.messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                    msg.role === 'user'
                      ? 'bg-[#FFD700] text-black'
                      : 'bg-[#1a1a22] text-white border border-white/5'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>

                  {/* Recommended Ideas Cards */}
                  {msg.recommendedIdeas && msg.recommendedIdeas.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {msg.recommendedIdeas.map((idea, idx) => (
                        <div
                          key={idea.id}
                          onClick={() => handleIdeaClick(idea)}
                          className="p-4 bg-white/5 border border-[#FFD700]/20 rounded-xl hover:border-[#FFD700]/50 hover:bg-white/10 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700] font-bold text-sm flex-shrink-0">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-[#FFD700] group-hover:underline line-clamp-1">
                                {idea.title}
                              </h4>
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                {idea.problem || idea.description}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-[10px] px-2 py-0.5 bg-[#FFD700]/10 text-[#FFD700] rounded-full">
                                  {idea.category}
                                </span>
                                <div className="flex items-center gap-1 text-gray-500 text-xs">
                                  <ThumbsUp className="w-3 h-3" />
                                  {idea.votes || 0}
                                </div>
                                <div className="flex items-center gap-1 text-gray-500 text-xs">
                                  <MessageCircle className="w-3 h-3" />
                                  {idea.feedbackCount || 0}
                                </div>
                              </div>
                            </div>
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
                <div className="bg-[#1a1a22] border border-white/5 rounded-2xl px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#FFD700]" />
                    <span className="text-sm text-gray-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Locked Overlay */}
          {activeSession?.isLocked && (
            <div className="px-6 py-4 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/95 to-transparent border-t border-[#FFD700]/20">
              <div className="flex items-center justify-between gap-4 p-4 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-[#FFD700]" />
                  <div>
                    <p className="text-white font-medium text-sm">Chat locked</p>
                    <p className="text-gray-400 text-xs">Donate minimum $1 to continue the conversation</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDonateModal(true)}
                  className="px-4 py-2 bg-[#FFD700] text-black rounded-lg font-bold text-sm hover:bg-[#FFD700]/90 transition-colors"
                >
                  Unlock Chat
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          {!activeSession?.isLocked && (
            <div className="p-4 border-t border-white/10 bg-[#0d0d12]">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 bg-[#1a1a22] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 outline-none focus:border-[#FFD700]/30 transition-colors"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="px-5 py-3 bg-[#FFD700] text-black rounded-xl font-bold hover:bg-[#FFD700]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Donation Modal */}
      <AnimatePresence>
        {showDonateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center px-4"
          >
            <div className="absolute inset-0 bg-black/90" onClick={() => setShowDonateModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-[#12131a] border border-[#FFD700]/30 rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-white mb-2">Unlock Chat</h3>
              <p className="text-gray-400 text-sm mb-6">
                Support Gimme Idea with a small donation to continue your conversation with AI.
              </p>

              <div className="mb-6">
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Amount (USD)</label>
                <div className="flex gap-2 mb-3">
                  {[1, 2, 5, 10].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setDonationAmount(amt)}
                      className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${
                        donationAmount === amt
                          ? 'bg-[#FFD700] text-black'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  ≈ {(donationAmount / SOL_PRICE_USD).toFixed(4)} SOL
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDonation}
                  disabled={isProcessingPayment || !connected}
                  className="flex-1 py-3 bg-[#FFD700] text-black rounded-xl font-bold hover:bg-[#FFD700]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : !connected ? (
                    'Connect Wallet First'
                  ) : (
                    `Donate $${donationAmount}`
                  )}
                </button>
                <button
                  onClick={() => setShowDonateModal(false)}
                  className="px-4 py-3 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <p className="text-[10px] text-gray-600 text-center mt-4">
                Wallet: {RECIPIENT_WALLET.slice(0, 8)}...{RECIPIENT_WALLET.slice(-8)}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
