'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Sparkles, Lock, History, Plus, Trash2, MessageCircle, ThumbsUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Project } from '../lib/types';
import toast from 'react-hot-toast';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createUniqueSlug } from '../lib/slug-utils';
import { useAuth } from '../contexts/AuthContext';
import { WalletRequiredModal } from './WalletRequiredModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const RECIPIENT_WALLET = 'FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm';
const MIN_DONATION_USD = 1;
const SOL_PRICE_USD = 145; // Approximate price, update periodically

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
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletModalMode, setWalletModalMode] = useState<'reconnect' | 'connect'>('connect');
  const [pendingUnlock, setPendingUnlock] = useState(false); // Track if user wants to unlock after connecting
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const { user } = useAuth();

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          messages: s.messages.map((m: any) => ({ 
            ...m, 
            timestamp: new Date(m.timestamp),
            // Ensure recommendedIdeas is preserved
            recommendedIdeas: m.recommendedIdeas || undefined
          }))
        })));
      } catch (e) {
        console.error('Failed to load chat sessions:', e);
      }
    }
  }, []);

  // Save sessions to localStorage (with debounce to prevent excessive writes)
  useEffect(() => {
    if (sessions.length > 0) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [sessions]);

  // Reset loading state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setInput('');
    }
  }, [isOpen]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId]);

  // Auto open donate modal after wallet connected (if pending unlock)
  useEffect(() => {
    if (pendingUnlock && connected && publicKey) {
      setPendingUnlock(false);
      setShowDonateModal(true);
    }
  }, [connected, publicKey, pendingUnlock]);

  // Get active session
  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Handle Unlock Chat button click - check wallet first
  const handleUnlockClick = () => {
    if (connected && publicKey) {
      // Wallet already connected, show donate modal directly
      setShowDonateModal(true);
    } else {
      // Need to connect wallet first
      setPendingUnlock(true);
      if (user?.wallet) {
        // User has wallet linked but not connected (needs reconnect)
        setWalletModalMode('reconnect');
      } else {
        // User doesn't have wallet linked
        setWalletModalMode('connect');
      }
      setShowWalletModal(true);
    }
  };

  // Create new session
  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
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
    // Reset conversation state BEFORE setting the new session
    setConversationStep(0);
    setUserContext({ interest: '', context: '' });
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
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

  // Reset conversation state when switching sessions
  useEffect(() => {
    if (activeSessionId && activeSession) {
      // Analyze the session to determine current step
      const messages = activeSession.messages;
      const userMessages = messages.filter(m => m.role === 'user');
      const hasRecommendations = messages.some(m => m.recommendedIdeas && m.recommendedIdeas.length > 0);
      
      if (activeSession.isLocked) {
        // Session is locked, conversation was at step 2
        setConversationStep(2);
      } else if (hasRecommendations) {
        // Has recommendations and unlocked means step 3+
        setConversationStep(3);
      } else if (userMessages.length >= 2) {
        // User has sent 2 messages, step 2 (awaiting or showing results)
        setConversationStep(2);
      } else if (userMessages.length === 1) {
        // User has sent 1 message about interest, now at step 1
        setConversationStep(1);
        // Extract interest from first user message
        const firstUserMsg = userMessages[0];
        if (firstUserMsg) {
          setUserContext(prev => ({ ...prev, interest: firstUserMsg.content }));
        }
      } else {
        // Fresh session
        setConversationStep(0);
        setUserContext({ interest: '', context: '' });
      }
    }
  }, [activeSessionId]);

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
    const currentSessionId = activeSessionId; // Capture current session ID
    const currentInterest = userContext.interest; // Capture current context
    
    addMessage({ role: 'user', content: userMessage });
    setInput('');
    setIsLoading(true);

    try {
      // Step 0: User describes what they want to build
      if (conversationStep === 0) {
        setUserContext(prev => ({ ...prev, interest: userMessage }));
        updateSessionTitle(userMessage);

        setTimeout(() => {
          // Check if still on the same session
          if (activeSessionId !== currentSessionId) return;
          
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
            interest: currentInterest || userContext.interest, // Use captured or current
            strengths: userMessage,
          });

          // Check if still on the same session before updating
          if (activeSessionId !== currentSessionId) {
            setIsLoading(false);
            return;
          }

          if (response.data.success && response.data.data.ideas?.length > 0) {
            const ideas = response.data.data.ideas;
            
            // Add recommendations message directly without setTimeout to prevent race conditions
            setSessions(prev => prev.map(s => 
              s.id === currentSessionId 
                ? { 
                    ...s, 
                    messages: [...s.messages, {
                      id: Date.now().toString(),
                      role: 'ai' as const,
                      content: response.data.data.reasoning || "Here are my top 3 recommendations based on your interests and background! Click any idea to learn more:",
                      recommendedIdeas: ideas,
                      timestamp: new Date()
                    }]
                  }
                : s
            ));
            setIsLoading(false);
            setConversationStep(2);
            
            // Lock the session after showing recommendations
            setTimeout(() => {
              setSessions(prev => prev.map(s =>
                s.id === currentSessionId
                  ? { ...s, isLocked: true }
                  : s
              ));
            }, 500);
          } else {
            throw new Error('No ideas found');
          }
        } catch (error) {
          console.error('Failed to fetch ideas:', error);
          if (activeSessionId === currentSessionId) {
            addMessage({
              role: 'ai',
              content: "I couldn't find matching ideas right now. Please try again with different criteria."
            });
            setConversationStep(0);
          }
          setIsLoading(false);
        }
      }
      // Step 3+: Continued chat after unlock
      else if (conversationStep >= 3) {
        try {
          // Format history properly for the API (role must be 'user' or 'assistant')
          const formattedHistory = activeSession.messages
            .slice(-10)
            .filter(m => m.content && !m.recommendedIdeas) // Skip recommendation messages
            .map(m => ({
              role: m.role === 'ai' ? 'assistant' : 'user',
              content: m.content
            }));

          const response = await axios.post(`${API_URL}/ai/chat`, {
            message: userMessage,
            context: {
              interest: userContext.interest || '',
              strengths: userContext.context || ''
            },
            history: formattedHistory
          });

          // Check if still on the same session
          if (activeSessionId !== currentSessionId) {
            setIsLoading(false);
            return;
          }

          if (response.data.success && response.data.data.reply) {
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
    // Create clean URL slug from title + short ID
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

      // Use connection from wallet adapter (already configured with proper RPC)
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
        className="relative w-full max-w-5xl h-[90vh] sm:h-[85vh] bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:flex-row mx-2"
      >
        {/* Sidebar - History (slide from left on mobile, fixed width on desktop) */}
        <AnimatePresence>
          {showHistory && (
            <>
              {/* Mobile backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="sm:hidden absolute inset-0 bg-black/50 z-10"
              />
              <motion.div
                initial={{ x: -280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute sm:relative left-0 top-0 bottom-0 w-[280px] z-20 border-r border-white/10 bg-[#0d0d12] flex flex-col overflow-hidden"
              >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <button
                  onClick={createNewSession}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#FFD700] text-black rounded-xl font-bold hover:bg-[#FFD700]/90 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Chat
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  className="sm:hidden ml-2 p-2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
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
            </>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex items-center justify-between bg-[#0d0d12]">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-[#FFD700]/20 text-[#FFD700]' : 'bg-white/5 text-gray-400 hover:text-white'}`}
              >
                <History className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden flex items-center justify-center bg-[#0d0d12]">
                  <img src="/logo-gmi.png" alt="Gimme Idea" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-lg font-bold text-white">Gimme Sensei</h2>
                  <p className="text-[10px] sm:text-xs text-gray-500">AI Idea Finder</p>
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
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
            {activeSession?.messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'ai' && (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg overflow-hidden flex-shrink-0 mt-1">
                    <img src="/logo-gmi.png" alt="AI" className="w-full h-full object-cover" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 sm:px-5 py-2 sm:py-3 ${
                    msg.role === 'user'
                      ? 'bg-[#FFD700] text-black'
                      : 'bg-[#1a1a22] text-white border border-white/5'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">{msg.content}</p>

                  {/* Recommended Ideas Cards */}
                  {msg.recommendedIdeas && msg.recommendedIdeas.length > 0 && (
                    <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 overflow-visible">
                      {msg.recommendedIdeas.map((idea, idx) => (
                        <div
                          key={idea.id}
                          onClick={() => handleIdeaClick(idea)}
                          className="glitch-card p-3 sm:p-4 bg-[#12131a] border border-[#FFD700]/30 rounded-xl cursor-pointer group relative overflow-visible"
                        >
                          <div className="flex items-start gap-2 sm:gap-3 relative z-10">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700] font-bold text-xs sm:text-sm flex-shrink-0">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 
                                className="glitch-title font-bold text-[#FFD700] line-clamp-1 text-sm"
                                data-text={idea.title}
                              >
                                {idea.title}
                              </h4>
                              <p className="text-[10px] sm:text-xs text-gray-400 mt-1 line-clamp-2">
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
              <div className="flex gap-2 sm:gap-3 justify-start">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg overflow-hidden flex-shrink-0 mt-1">
                  <img src="/logo-gmi.png" alt="AI" className="w-full h-full object-cover" />
                </div>
                <div className="bg-[#1a1a22] border border-white/5 rounded-2xl px-3 sm:px-5 py-2 sm:py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#FFD700]" />
                    <span className="text-xs sm:text-sm text-gray-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Locked Overlay */}
          {activeSession?.isLocked && (
            <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/95 to-transparent border-t border-[#FFD700]/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFD700]" />
                  <div>
                    <p className="text-white font-medium text-xs sm:text-sm">Chat locked</p>
                    <p className="text-gray-400 text-[10px] sm:text-xs">Donate min $1 to continue</p>
                  </div>
                </div>
                <button
                  onClick={handleUnlockClick}
                  className="w-full sm:w-auto px-4 py-2 bg-[#FFD700] text-black rounded-lg font-bold text-xs sm:text-sm hover:bg-[#FFD700]/90 transition-colors"
                >
                  Unlock Chat
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          {!activeSession?.isLocked && (
            <div className="p-3 sm:p-4 border-t border-white/10 bg-[#0d0d12]">
              <div className="flex gap-2 sm:gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 bg-[#1a1a22] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-xs sm:text-sm placeholder:text-gray-600 outline-none focus:border-[#FFD700]/30 transition-colors"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="px-3 sm:px-5 py-2.5 sm:py-3 bg-[#FFD700] text-black rounded-xl font-bold hover:bg-[#FFD700]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Unlock Chat</h3>
              <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">
                Support Gimme Idea with a small donation to continue your conversation with AI.
              </p>

              <div className="mb-4 sm:mb-6">
                <label className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-2 block">Amount (USD)</label>
                <div className="flex gap-1.5 sm:gap-2 mb-3">
                  {[1, 2, 5, 10].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setDonationAmount(amt)}
                      className={`flex-1 py-2 sm:py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                        donationAmount === amt
                          ? 'bg-[#FFD700] text-black'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500">
                  ≈ {(donationAmount / SOL_PRICE_USD).toFixed(4)} SOL
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={handleDonation}
                  disabled={isProcessingPayment}
                  className="flex-1 py-2.5 sm:py-3 bg-[#FFD700] text-black rounded-xl font-bold hover:bg-[#FFD700]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send ${donationAmount}
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDonateModal(false)}
                  className="px-4 py-2.5 sm:py-3 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>

              <p className="text-[10px] text-gray-600 text-center mt-4">
                Wallet: {RECIPIENT_WALLET.slice(0, 6)}...{RECIPIENT_WALLET.slice(-6)}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet Required Modal */}
      <WalletRequiredModal
        isOpen={showWalletModal}
        onClose={() => {
          setShowWalletModal(false);
          setPendingUnlock(false); // Cancel pending unlock if user closes
        }}
        mode={walletModalMode}
        onSuccess={() => {
          setShowWalletModal(false);
          // pendingUnlock useEffect will handle opening donate modal
        }}
      />
    </div>
  );
};
