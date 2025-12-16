'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  ChevronDown,
  Loader2,
  Lightbulb,
  Plus,
  Users,
  Sparkles,
  Bot
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { formatDistanceToNow } from 'date-fns';

interface IdeaPost {
  id: string;
  title: string;
  description?: string;
  problem?: string;
  solution?: string;
  opportunity?: string;
  category: string;
  tags: string[];
  votes: number;
  feedbackCount: number;
  createdAt: string;
  isAnonymous: boolean;
  author?: {
    id?: string;
    username: string;
    wallet: string;
    avatar?: string;
    slug?: string;
  };
  isFollowing?: boolean;
}

// Expandable text component
function ExpandableText({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = text && text.length > 200;

  if (!text) return null;

  return (
    <div>
      <p className={`text-gray-300 whitespace-pre-wrap ${!isExpanded && shouldTruncate ? 'line-clamp-3' : ''}`}>
        {text}
      </p>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-purple-400 hover:text-purple-300 text-sm mt-1 font-medium"
        >
          {isExpanded ? 'Show less' : 'See more'}
        </button>
      )}
    </div>
  );
}

// Single Post Card Component
function PostCard({ post, onVote }: { post: IdeaPost; onVote: (id: string) => void }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const { user } = useAuth();

  const handleLike = async () => {
    if (!user) return;
    setIsLiked(!isLiked);
    onVote(post.id);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/idea/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description || post.problem,
          url: url,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      setShowShareMenu(true);
      setTimeout(() => setShowShareMenu(false), 2000);
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {post.isAnonymous ? (
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-400" />
            </div>
          ) : (
            <Link href={post.author?.slug ? `/profile/${post.author.slug}` : '#'}>
              {post.author?.avatar ? (
                <Image
                  src={post.author.avatar}
                  alt={post.author.username || 'User'}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {post.author?.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </Link>
          )}
          <div>
            <div className="flex items-center gap-2">
              {post.isAnonymous ? (
                <span className="font-medium text-gray-400">Anonymous</span>
              ) : (
                <Link 
                  href={post.author?.slug ? `/profile/${post.author.slug}` : '#'}
                  className="font-medium text-white hover:text-purple-400 transition-colors"
                >
                  {post.author?.username || 'Unknown'}
                </Link>
              )}
              {post.isFollowing && (
                <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">Following</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{timeAgo}</span>
              <span>•</span>
              <span className="text-purple-400">{post.category}</span>
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {/* Title */}
        <Link href={`/idea/${post.id}`}>
          <h2 className="text-xl font-bold text-white mb-3 hover:text-purple-400 transition-colors">
            {post.title}
          </h2>
        </Link>

        {/* Problem */}
        {post.problem && (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-sm text-amber-400 mb-1">
              <span className="font-semibold">💡 Problem</span>
            </div>
            <ExpandableText text={post.problem} />
          </div>
        )}

        {/* Solution */}
        {post.solution && (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-sm text-green-400 mb-1">
              <span className="font-semibold">✅ Solution</span>
            </div>
            <ExpandableText text={post.solution} />
          </div>
        )}

        {/* Opportunity */}
        {post.opportunity && (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-sm text-blue-400 mb-1">
              <span className="font-semibold">🚀 Opportunity</span>
            </div>
            <ExpandableText text={post.opportunity} />
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.slice(0, 5).map((tag, i) => (
              <span key={i} className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isLiked ? 'text-red-400 bg-red-500/10' : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{post.votes + (isLiked ? 1 : 0)}</span>
          </button>

          {/* Comment */}
          <Link
            href={`/idea/${post.id}#comments`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.feedbackCount}</span>
          </Link>

          {/* Share */}
          <div className="relative">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            {showShareMenu && (
              <div className="absolute bottom-full left-0 mb-2 px-3 py-1 bg-green-500 text-white text-xs rounded-lg whitespace-nowrap">
                Link copied!
              </div>
            )}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className={`p-2 rounded-lg transition-colors ${
            isSaved ? 'text-yellow-400 bg-yellow-500/10' : 'text-gray-400 hover:bg-white/5'
          }`}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* AI Feedback indicator */}
      {post.feedbackCount > 0 && (
        <div className="px-4 py-2 bg-purple-500/5 border-t border-white/5">
          <Link 
            href={`/idea/${post.id}#comments`}
            className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
          >
            <Bot className="w-4 h-4" />
            <span>AI Sensei has feedback on this idea</span>
          </Link>
        </div>
      )}
    </motion.div>
  );
}

export default function HomeFeed() {
  const { user } = useAuth();
  const { openSubmitModal } = useAppStore();
  const [posts, setPosts] = useState<IdeaPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch ideas
      const ideasRes = await apiClient.getProjects({ type: 'idea', limit: 50 });
      
      // Fetch following list if user is logged in
      let followingList: string[] = [];
      if (user?.id) {
        try {
          const followRes = await apiClient.getFollowing(user.id);
          if (followRes.success && followRes.data) {
            followingList = followRes.data.map((f: { id: string }) => f.id);
          }
        } catch (err) {
          console.error('Failed to fetch following:', err);
        }
      }

      if (ideasRes.success && ideasRes.data) {
        // Sort: following first, then by date
        const sortedPosts = [...ideasRes.data].sort((a: IdeaPost, b: IdeaPost) => {
          const aFollowing = followingList.includes(a.author?.id || '');
          const bFollowing = followingList.includes(b.author?.id || '');
          
          if (aFollowing && !bFollowing) return -1;
          if (!aFollowing && bFollowing) return 1;
          
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        // Mark posts from following
        const postsWithFollowing = sortedPosts.map((post: IdeaPost) => ({
          ...post,
          isFollowing: followingList.includes(post.author?.id || '')
        }));

        setPosts(postsWithFollowing);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleVote = async (id: string) => {
    if (!user) return;
    try {
      await apiClient.voteProject(id);
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="sticky top-16 z-30 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              Feed
            </h1>
            <button
              onClick={() => openSubmitModal('idea')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-full hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Post Idea</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Create Post Prompt */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111] border border-white/5 rounded-2xl p-4 mb-6"
          >
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.username || 'You'}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {user.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <button
                onClick={() => openSubmitModal('idea')}
                className="flex-grow text-left px-4 py-3 bg-white/5 rounded-full text-gray-400 hover:bg-white/10 transition-colors"
              >
                Share your idea with the community...
              </button>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
            <p className="text-gray-400">Loading feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <Lightbulb className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No ideas yet</h3>
            <p className="text-gray-400 mb-6">Be the first to share an idea!</p>
            <button
              onClick={() => openSubmitModal('idea')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-full hover:opacity-90 transition-opacity"
            >
              Share Your Idea
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onVote={handleVote} />
            ))}
          </div>
        )}

        {/* Load More */}
        {posts.length > 0 && posts.length >= 50 && (
          <div className="text-center py-8">
            <button className="flex items-center gap-2 px-6 py-3 bg-white/5 text-gray-400 rounded-full hover:bg-white/10 transition-colors mx-auto">
              <ChevronDown className="w-4 h-4" />
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
