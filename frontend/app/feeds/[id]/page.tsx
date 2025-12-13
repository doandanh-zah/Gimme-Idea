'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Users, Bookmark, Share2, MoreHorizontal, 
  Loader2, Trash2, Edit2, Globe, Lock, ExternalLink,
  TrendingUp, Star, Sparkles, Gem, ChevronRight, Link as LinkIcon,
  ShieldOff, Copy, AlertTriangle
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Feed, FeedItem, Project } from '@/lib/types';
import { ProjectCard } from '@/components/ProjectCard';
import { EditFeedModal } from '@/components/EditFeedModal';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { createUsernameSlug } from '@/lib/slug-utils';

// Feed type icons
const FEED_TYPE_CONFIG = {
  trending: { icon: TrendingUp, color: '#FF6B6B' },
  staff_picks: { icon: Star, color: '#FFD700' },
  ai_top: { icon: Sparkles, color: '#9945FF' },
  hidden_gems: { icon: Gem, color: '#14F195' },
  custom: { icon: Bookmark, color: '#3B82F6' },
};

export default function FeedDetailPage() {
  const router = useRouter();
  const params = useParams();
  const feedId = params.id as string;
  const { user } = useAuth();

  const [feed, setFeed] = useState<Feed | null>(null);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Background stars
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: number; duration: string; opacity: number }[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      duration: `${Math.random() * 3 + 2}s`,
      opacity: Math.random()
    }));
    setStars(newStars);
  }, []);

  useEffect(() => {
    if (feedId) {
      loadFeed();
    }
  }, [feedId, user?.id]);

  const loadFeed = async () => {
    setIsLoading(true);
    try {
      const [feedRes, itemsRes] = await Promise.all([
        apiClient.getFeed(feedId),
        apiClient.getFeedItems(feedId),
      ]);

      if (feedRes.success && feedRes.data) {
        setFeed(feedRes.data);
        setIsFollowing(feedRes.data.isFollowing || false);
      }

      if (itemsRes.success && itemsRes.data) {
        setItems(itemsRes.data);
      }
    } catch (error) {
      console.error('Failed to load feed:', error);
      toast.error('Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !feed) {
      toast.error('Please login to follow feeds');
      return;
    }

    try {
      if (isFollowing) {
        await apiClient.unfollowFeed(feed.id); // Use actual UUID
        setIsFollowing(false);
        setFeed(prev => prev ? { ...prev, followersCount: prev.followersCount - 1 } : null);
        toast.success('Unfollowed feed');
      } else {
        await apiClient.followFeed(feed.id); // Use actual UUID
        setIsFollowing(true);
        setFeed(prev => prev ? { ...prev, followersCount: prev.followersCount + 1 } : null);
        toast.success('Following feed!');
      }
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  // Share dropdown state
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShareToX = () => {
    if (!feed) return;
    const feedUrl = window.location.href;
    const tweetText = `Check out "${feed.name}" feed on Gimme Idea!\n\n${feed.description ? feed.description.substring(0, 80) + '...' : ''}\n\n`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(feedUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    setShowShareMenu(false);
    toast.success('Opening X...');
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShowShareMenu(false);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleDeleteFeed = async () => {
    if (!feed) return;
    
    setIsDeleting(true);
    try {
      const response = await apiClient.deleteFeed(feed.id); // Use actual UUID, not slug
      if (response.success) {
        toast.success('Feed deleted');
        router.push('/feeds');
      } else {
        toast.error(response.error || 'Failed to delete feed');
      }
    } catch (error) {
      toast.error('Failed to delete feed');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!feed) return;
    try {
      const response = await apiClient.removeItemFromFeed(feed.id, itemId); // Use actual UUID
      if (response.success) {
        setItems(prev => prev.filter(i => i.id !== itemId));
        setFeed(prev => prev ? { ...prev, itemsCount: prev.itemsCount - 1 } : null);
        toast.success('Idea removed from feed');
      } else {
        toast.error(response.error || 'Failed to remove idea');
      }
    } catch (error) {
      toast.error('Failed to remove idea');
    }
  };

  const isOwner = user && feed && feed.creatorId === user.id;
  const config = feed ? (FEED_TYPE_CONFIG[feed.feedType] || FEED_TYPE_CONFIG.custom) : FEED_TYPE_CONFIG.custom;
  const IconComponent = config.icon;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
      </div>
    );
  }

  if (!feed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <ShieldOff className="w-16 h-16 text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Feed not available</h1>
        <p className="text-gray-400 mb-4">This feed may be private or doesn't exist</p>
        <button
          onClick={() => router.push('/feeds')}
          className="text-[#FFD700] hover:underline"
        >
          Back to GmiFeeds
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="bg-grid opacity-40"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#2e1065] rounded-full blur-[120px] animate-pulse-slow opacity-40 mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#422006] rounded-full blur-[120px] animate-pulse-slow opacity-40 mix-blend-screen" style={{animationDelay: '2s'}} />
        <div className="stars-container">
          {stars.map((star) => (
            <div
              key={star.id}
              className="star"
              style={{
                top: star.top,
                left: star.left,
                width: `${star.size}px`,
                height: `${star.size}px`,
                '--duration': star.duration,
                '--opacity': star.opacity
              } as React.CSSProperties}
            />
          ))}
          <div className="shooting-star" style={{ top: '20%', left: '80%' }} />
          <div className="shooting-star" style={{ top: '60%', left: '10%', animationDelay: '2s' }} />
          <div className="shooting-star" style={{ top: '40%', left: '50%', animationDelay: '4s' }} />
        </div>
      </div>

      <div className="pt-24 sm:pt-32 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push('/feeds')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to GmiFeeds
        </button>

        {/* Feed Header */}
        <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-2xl overflow-hidden mb-8">
          {/* Cover Image */}
          {feed.coverImage && (
            <div className="relative h-48 sm:h-64 w-full">
              <Image
                src={feed.coverImage}
                alt={feed.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </div>
          )}
          
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Icon */}
              <div 
                className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 ${feed.coverImage ? '-mt-16 sm:-mt-12 border-4 border-[#0a0a0f]' : ''}`}
                style={{ backgroundColor: `${config.color}20` }}
              >
                <IconComponent className="w-10 h-10" style={{ color: config.color }} />
              </div>

              {/* Info */}
              <div className="flex-grow">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl sm:text-3xl font-bold text-white">{feed.name}</h1>
                      {feed.visibility === 'public' ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30">
                          <Globe className="w-3 h-3 text-green-400" />
                          <span className="text-[10px] font-medium text-green-400">Public</span>
                        </div>
                      ) : feed.visibility === 'unlisted' ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30">
                          <LinkIcon className="w-3 h-3 text-blue-400" />
                          <span className="text-[10px] font-medium text-blue-400">Unlisted</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30">
                        <Lock className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] font-medium text-purple-400">Private</span>
                      </div>
                    )}
                    {feed.isFeatured && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30">
                        FEATURED
                      </span>
                    )}
                  </div>
                  
                  {feed.description && (
                    <p className="text-gray-400 mb-4">{feed.description}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <span className="flex items-center gap-2 text-gray-400">
                      <Bookmark className="w-4 h-4" />
                      <span className="text-white font-medium">{feed.itemsCount}</span> ideas
                    </span>
                    <span className="flex items-center gap-2 text-gray-400">
                      <Users className="w-4 h-4" />
                      <span className="text-white font-medium">{feed.followersCount}</span> followers
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!isOwner && (
                    <button
                      onClick={handleFollow}
                      className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                        isFollowing
                          ? 'bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400'
                          : 'bg-[#FFD700] text-black hover:bg-[#FFD700]/90'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}

                  {/* Share dropdown */}
                  <div ref={shareMenuRef} className="relative">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Share2 className="w-5 h-5 text-gray-400" />
                    </button>
                    
                    <AnimatePresence>
                      {showShareMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-1 w-40 bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50"
                        >
                          <button
                            onClick={handleShareToX}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            Share on X
                          </button>
                          <button
                            onClick={handleCopyLink}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors border-t border-white/5"
                          >
                            <Copy className="w-4 h-4" />
                            Copy Link
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {isOwner && (
                    <div className="relative">
                      <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5 text-gray-400" />
                      </button>

                      <AnimatePresence>
                        {showMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-10"
                          >
                            <button
                              onClick={() => {
                                setShowMenu(false);
                                setShowEditModal(true);
                              }}
                              className="w-full px-4 py-3 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" /> Edit Feed
                            </button>
                            <button
                              onClick={() => {
                                setShowMenu(false);
                                setShowDeleteModal(true);
                              }}
                              className="w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> Delete Feed
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>

              {/* Creator */}
              {feed.creator && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                  <span className="text-xs text-gray-500">Created by</span>
                  <button
                    onClick={() => router.push(`/profile/${createUsernameSlug(feed.creator?.username || '')}`)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    {feed.creator.avatar ? (
                      <Image
                        src={feed.creator.avatar}
                        alt={feed.creator.username}
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded-full"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
                    )}
                    <span className="text-sm text-[#FFD700]">@{feed.creator.username}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Ideas Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">
            Ideas in this feed ({feed.itemsCount})
          </h2>

          {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div key={item.id} className="relative group">
                  {item.project && (
                    <ProjectCard 
                      project={{
                        ...item.project,
                        type: item.project.type || 'idea',
                      } as Project} 
                    />
                  )}
                  
                  {/* Remove button for owner/member */}
                  {(isOwner || (user && item.addedBy === user.id)) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(item.id);
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  )}

                  {/* Note if exists */}
                  {item.note && (
                    <div className="mt-2 px-3 py-2 bg-white/5 rounded-lg">
                      <p className="text-xs text-gray-400 italic">"{item.note}"</p>
                      {item.addedByUser && (
                        <p className="text-[10px] text-gray-500 mt-1">
                          — @{item.addedByUser.username}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl">
              <Bookmark className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No ideas yet</h3>
              <p className="text-gray-400 text-sm">
                {isOwner
                  ? 'Start adding ideas to this feed by bookmarking them'
                  : 'This feed is empty'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Feed Modal */}
      {feed && (
        <EditFeedModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          feed={feed}
          onUpdate={(updatedFeed) => setFeed(updatedFeed)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#1a1a2e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Feed</h3>
                <p className="text-gray-400">
                  Are you sure you want to delete <span className="text-white font-medium">"{feed?.name}"</span>? 
                  This action cannot be undone.
                </p>
              </div>

              {/* Actions */}
              <div className="flex border-t border-white/10">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-4 text-gray-300 hover:bg-white/5 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteFeed}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-4 text-red-500 hover:bg-red-500/10 transition-colors font-medium border-l border-white/10 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
