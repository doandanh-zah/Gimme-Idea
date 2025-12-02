'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Project } from '../lib/types';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
              content: `Tôi cần thêm thông tin để giúp bạn tốt hơn. Hãy mô tả về lợi thế của bạn và lý do bạn muốn build về ${input.toLowerCase()}?`
            }]);
            setIsLoading(false);
          }, 800);
        } else {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'ai',
              content: `Hãy mô tả về lợi thế của bạn và lý do bạn muốn build về ${input.toLowerCase()}?`
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
              content: `Đây là top 3 idea mình nghĩ là phù hợp nhất với bạn!\n\n${reasoning}`,
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
        content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.'
      }]);
      setIsLoading(false);
    }
  };

  const handleIdeaClick = (ideaId: string) => {
    router.push(`/idea/${ideaId}`);
    onClose();
  };

  const handlePayment = () => {
    // TODO: Implement actual payment logic with Solana transaction
    toast.success('Payment successful! You now have unlimited access.');
    setHasUnlimitedAccess(true);
    setShowPaymentModal(false);
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
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#FFD700] to-[#FDB931] text-black shadow-lg">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display text-white">AI Idea Finder</h2>
                <p className="text-sm text-gray-400">Tìm ý tưởng phù hợp với bạn</p>
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
              placeholder="Nhập câu trả lời của bạn..."
              className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-5 py-3 outline-none focus:border-[#FFD700]/30 text-white placeholder:text-gray-600"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Gửi
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
            <div className="absolute inset-0 bg-black/90 backdrop-blur-lg" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-[#1A1A1A] border border-white/10 rounded-2xl p-8 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Mở khóa trò chuyện không giới hạn</h3>
              <p className="text-gray-400 mb-6">
                Bạn đã hết lượt hỏi miễn phí. Nạp tiền để tiếp tục trò chuyện với AI và nhận thêm gợi ý.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handlePayment}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black rounded-full font-bold hover:shadow-lg transition-all"
                >
                  OK - Nạp tiền
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-all"
                >
                  Từ chối
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
