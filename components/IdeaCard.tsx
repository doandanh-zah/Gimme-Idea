'use client';

import { motion } from 'framer-motion';
import { ThumbsUp, MessageSquare, DollarSign, User } from 'lucide-react';
import Link from 'next/link';

interface IdeaCardProps {
  idea: {
    id: string;
    title: string;
    description: string;
    category: string;
    votes: number;
    feedbackCount: number;
    author?: {
      username: string;
      avatar?: string;
    };
    createdAt: string;
  };
  onVote?: () => void;
  onTip?: () => void;
}

export function IdeaCard({ idea, onVote, onTip }: IdeaCardProps) {
  const categoryColors: Record<string, string> = {
    DeFi: 'bg-blue-500/20 text-blue-400',
    NFT: 'bg-purple-500/20 text-purple-400',
    Gaming: 'bg-green-500/20 text-green-400',
    Infrastructure: 'bg-orange-500/20 text-orange-400',
    DAO: 'bg-pink-500/20 text-pink-400',
    DePIN: 'bg-cyan-500/20 text-cyan-400',
    Social: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 hover:border-primary/30 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/50 to-secondary/50 flex items-center justify-center">
            {idea.author?.avatar ? (
              <img src={idea.author.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {idea.author?.username || 'Anonymous'}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(idea.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[idea.category] || 'bg-gray-500/20 text-gray-400'}`}>
          {idea.category}
        </span>
      </div>

      {/* Content */}
      <Link href={`/idea/${idea.id}`}>
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary transition-colors">
          {idea.title}
        </h3>
        <p className="text-gray-400 text-sm line-clamp-3 mb-4">
          {idea.description}
        </p>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-white/5">
        <button
          onClick={onVote}
          className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors"
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="text-sm">{idea.votes}</span>
        </button>

        <Link
          href={`/idea/${idea.id}`}
          className="flex items-center gap-2 text-gray-400 hover:text-secondary transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm">{idea.feedbackCount}</span>
        </Link>

        <button
          onClick={onTip}
          className="flex items-center gap-2 text-gray-400 hover:text-accent transition-colors ml-auto"
        >
          <DollarSign className="w-4 h-4" />
          <span className="text-sm">Tip</span>
        </button>
      </div>
    </motion.div>
  );
}
