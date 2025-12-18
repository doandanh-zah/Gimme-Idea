'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Loader2, Lightbulb, Sparkles } from 'lucide-react';
import { IdeaCard } from '@/components/IdeaCard';
import { CreateIdeaModal } from '@/components/CreateIdeaModal';
import { TipModal } from '@/components/TipModal';
import { useWallet } from '@/contexts/WalletContext';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function Home() {
  const { isConnected } = useWallet();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tipIdea, setTipIdea] = useState<any>(null);

  const fetchIdeas = async () => {
    setIsLoading(true);
    try {
      const response = await api.getIdeas({ limit: 20, search: searchQuery || undefined });
      if (response.success && response.data) {
        setIdeas(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch ideas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchIdeas();
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleVote = async (ideaId: string) => {
    if (!isConnected) {
      toast.error('Please connect your wallet to vote');
      return;
    }

    try {
      const response = await api.voteIdea(ideaId);
      if (response.success) {
        setIdeas(ideas.map(idea =>
          idea.id === ideaId ? { ...idea, votes: response.data?.votes || idea.votes + 1 } : idea
        ));
        toast.success('Voted!');
      }
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Lightbulb className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="text-white">Gimme</span>
            <span className="text-accent">Idea</span>
          </h1>
        </div>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
          Share your Web3 ideas, get feedback from the community, and earn tips for your creativity.
        </p>

        {/* Search & Create */}
        <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search ideas..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            <span>Share Idea</span>
          </button>
        </div>
      </motion.div>

      {/* Ideas Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : ideas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea, index) => (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <IdeaCard
                idea={{
                  id: idea.id,
                  title: idea.title,
                  description: idea.description,
                  category: idea.category,
                  votes: idea.votes || 0,
                  feedbackCount: idea.feedback_count || idea.feedbackCount || 0,
                  author: idea.author,
                  createdAt: idea.created_at || idea.createdAt,
                }}
                onVote={() => handleVote(idea.id)}
                onTip={() => setTipIdea(idea)}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No ideas yet</h3>
          <p className="text-gray-500">Be the first to share your idea!</p>
        </div>
      )}

      {/* Modals */}
      <CreateIdeaModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchIdeas}
      />

      {tipIdea && (
        <TipModal
          isOpen={!!tipIdea}
          onClose={() => setTipIdea(null)}
          idea={{
            id: tipIdea.id,
            title: tipIdea.title,
            author: tipIdea.author,
          }}
        />
      )}
    </div>
  );
}
