'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useWallet } from '@/contexts/WalletContext';
import toast from 'react-hot-toast';

interface CreateIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES = ['DeFi', 'NFT', 'Gaming', 'Infrastructure', 'DAO', 'DePIN', 'Social'];

export function CreateIdeaModal({ isOpen, onClose, onSuccess }: CreateIdeaModalProps) {
  const { isConnected } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    problem: '',
    solution: '',
    category: 'DeFi',
    tags: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.createIdea({
        title: form.title.trim(),
        description: form.description.trim(),
        problem: form.problem.trim(),
        solution: form.solution.trim(),
        category: form.category,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });

      if (response.success) {
        toast.success('Idea submitted successfully!');
        setForm({ title: '', description: '', problem: '', solution: '', category: 'DeFi', tags: '' });
        onSuccess?.();
        onClose();
      } else {
        throw new Error(response.error || 'Failed to submit idea');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit idea');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-xl bg-dark border border-white/10 rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Share Your Idea</h2>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Your idea title"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary/50 focus:outline-none"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-dark">{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of your idea"
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none resize-none"
                />
              </div>

              {/* Problem */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Problem</label>
                <textarea
                  value={form.problem}
                  onChange={e => setForm({ ...form, problem: e.target.value })}
                  placeholder="What problem does this solve?"
                  rows={2}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none resize-none"
                />
              </div>

              {/* Solution */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Solution</label>
                <textarea
                  value={form.solution}
                  onChange={e => setForm({ ...form, solution: e.target.value })}
                  placeholder="How does your idea solve it?"
                  rows={2}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                  placeholder="solana, web3, defi (comma separated)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !isConnected}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Idea</span>
                )}
              </button>

              {!isConnected && (
                <p className="text-center text-sm text-yellow-400">
                  Connect your wallet to submit ideas
                </p>
              )}
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
