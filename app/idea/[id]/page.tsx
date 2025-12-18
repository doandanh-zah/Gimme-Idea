'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ThumbsUp, MessageSquare, DollarSign, User, Send, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useWallet } from '@/contexts/WalletContext';
import { TipModal } from '@/components/TipModal';
import toast from 'react-hot-toast';

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isConnected } = useWallet();
  const [idea, setIdea] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!params.id) return;
      
      setIsLoading(true);
      try {
        const [ideaRes, commentsRes] = await Promise.all([
          api.getIdea(params.id as string),
          api.getComments(params.id as string),
        ]);

        if (ideaRes.success && ideaRes.data) {
          setIdea(ideaRes.data);
        }

        if (commentsRes.success && commentsRes.data) {
          setComments(commentsRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch idea:', error);
        toast.error('Failed to load idea');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleVote = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet to vote');
      return;
    }

    try {
      const response = await api.voteIdea(idea.id);
      if (response.success) {
        setIdea({ ...idea, votes: response.data?.votes || idea.votes + 1 });
        toast.success('Voted!');
      }
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error('Please connect your wallet to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsSubmittingComment(true);

    try {
      const response = await api.createComment({
        projectId: idea.id,
        content: newComment.trim(),
      });

      if (response.success && response.data) {
        setComments([response.data, ...comments]);
        setNewComment('');
        toast.success('Comment posted!');
      } else {
        throw new Error(response.error || 'Failed to post comment');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Idea not found</h1>
        <button
          onClick={() => router.push('/')}
          className="text-primary hover:underline"
        >
          Go back home
        </button>
      </div>
    );
  }

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Ideas</span>
      </button>

      {/* Idea Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 md:p-8 mb-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/50 to-secondary/50 flex items-center justify-center">
              {idea.author?.avatar ? (
                <img src={idea.author.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <p className="text-white font-medium">{idea.author?.username || 'Anonymous'}</p>
              <p className="text-sm text-gray-500">
                {new Date(idea.created_at || idea.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${categoryColors[idea.category] || 'bg-gray-500/20 text-gray-400'}`}>
            {idea.category}
          </span>
        </div>

        {/* Title & Description */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{idea.title}</h1>
        <p className="text-gray-300 mb-6 whitespace-pre-wrap">{idea.description}</p>

        {/* Problem & Solution */}
        {(idea.problem || idea.solution) && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {idea.problem && (
              <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                <h3 className="text-red-400 font-semibold mb-2">🎯 Problem</h3>
                <p className="text-gray-300 text-sm">{idea.problem}</p>
              </div>
            )}
            {idea.solution && (
              <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                <h3 className="text-green-400 font-semibold mb-2">💡 Solution</h3>
                <p className="text-gray-300 text-sm">{idea.solution}</p>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {idea.tags && idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {idea.tags.map((tag: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-400">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-white/10">
          <button
            onClick={handleVote}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{idea.votes || 0} Votes</span>
          </button>

          <div className="flex items-center gap-2 text-gray-400">
            <MessageSquare className="w-4 h-4" />
            <span>{comments.length} Comments</span>
          </div>

          <button
            onClick={() => setShowTipModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors ml-auto"
          >
            <DollarSign className="w-4 h-4" />
            <span>Send Tip</span>
          </button>
        </div>
      </motion.div>

      {/* Comments Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6"
      >
        <h2 className="text-xl font-bold text-white mb-6">Comments ({comments.length})</h2>

        {/* New Comment Form */}
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/50 to-secondary/50 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder={isConnected ? "Share your thoughts..." : "Connect wallet to comment"}
                disabled={!isConnected}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none resize-none disabled:opacity-50"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={isSubmittingComment || !isConnected || !newComment.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingComment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Post</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-3 p-4 bg-white/5 rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center flex-shrink-0">
                  {comment.author?.avatar ? (
                    <img src={comment.author.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium text-sm">
                      {comment.author?.username || 'Anonymous'}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(comment.created_at || comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to share your thoughts!
            </div>
          )}
        </div>
      </motion.div>

      {/* Tip Modal */}
      <TipModal
        isOpen={showTipModal}
        onClose={() => setShowTipModal(false)}
        idea={{
          id: idea.id,
          title: idea.title,
          author: idea.author,
        }}
      />
    </div>
  );
}
