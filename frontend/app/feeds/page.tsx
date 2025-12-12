'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rss, Plus, TrendingUp, Star, Sparkles, Gem, Users, 
  Bookmark, ChevronRight, Loader2, Search, X, Lock,
  Globe, Eye, MoreHorizontal, Link2, ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Feed } from '@/lib/types';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { CreateFeedModal } from '@/components/CreateFeedModal';

// Feed type icons and colors
const FEED_TYPE_CONFIG = {
  trending: { icon: TrendingUp, color: '#FF6B6B', label: '🔥 Trending' },
  staff_picks: { icon: Star, color: '#FFD700', label: '⭐ Staff Picks' },
  ai_top: { icon: Sparkles, color: '#9945FF', label: '🤖 AI Top Rated' },
  hidden_gems: { icon: Gem, color: '#14F195', label: '💎 Hidden Gems' },
  custom: { icon: Bookmark, color: '#3B82F6', label: 'Custom' },
};

// Visibility icons
const VISIBILITY_CONFIG = {
  public: { icon: Globe, color: '#FFD700', label: 'Public' },
  unlisted: { icon: Link2, color: '#3B82F6', label: 'Unlisted' },
  private: { icon: Lock, color: '#9945FF', label: 'Private' },
};

export default function FeedsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [discoverFeeds, setDiscoverFeeds] = useState<Feed[]>([]);
  const [allPublicFeeds, setAllPublicFeeds] = useState<Feed[]>([]);
  const [myFeeds, setMyFeeds] = useState<Feed[]>([]);
  const [followingFeeds, setFollowingFeeds] = useState<Feed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllPublicFeeds, setShowAllPublicFeeds] = useState(false);
  
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
    loadFeeds();
  }, [user]);

  const loadFeeds = async () => {
    setIsLoading(true);
    try {
      // Load all public feeds
      const publicRes = await apiClient.getFeeds({ limit: 50 });
      if (publicRes.success && publicRes.data) {
        setAllPublicFeeds(publicRes.data);
        // Top 3 for discover section
        setDiscoverFeeds(publicRes.data.slice(0, 3));
      }

      // Load user's feeds if logged in
      if (user) {
        const [myRes, followingRes] = await Promise.all([
          apiClient.getMyFeeds(),
          apiClient.getFollowingFeeds(),
        ]);

        if (myRes.success && myRes.data) {
          setMyFeeds(myRes.data);
        }
        if (followingRes.success && followingRes.data) {
          setFollowingFeeds(followingRes.data);
        }
      }
    } catch (error) {
      console.error('Failed to load feeds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowFeed = async (feedId: string, isFollowing: boolean) => {
    if (!user) {
      toast.error('Please login to follow feeds');
      return;
    }

    try {
      if (isFollowing) {
        await apiClient.unfollowFeed(feedId);
        toast.success('Unfollowed feed');
      } else {
        await apiClient.followFeed(feedId);
        toast.success('Following feed!');
      }
      loadFeeds(); // Reload to update state
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  const handleFeedCreated = (newFeed: Feed) => {
    setMyFeeds(prev => [newFeed, ...prev]);
    setShowCreateModal(false);
    toast.success('Feed created successfully!');
  };

  const FeedCard = ({ feed, showFollowButton = true, showVisibility = false }: { feed: Feed; showFollowButton?: boolean; showVisibility?: boolean }) => {
    const config = FEED_TYPE_CONFIG[feed.feedType] || FEED_TYPE_CONFIG.custom;
    const visConfig = VISIBILITY_CONFIG[feed.visibility] || VISIBILITY_CONFIG.public;
    const IconComponent = config.icon;
    const VisIcon = visConfig.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -4 }}
        onClick={() => router.push(`/feeds/${feed.slug}`)}
        className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-2xl p-5 cursor-pointer group overflow-hidden"
      >
        {/* Glow effect */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${config.color}20 0%, transparent 70%)`
          }}
        />

        {/* Header with icon */}
        <div className="flex items-start justify-between mb-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${config.color}20` }}
          >
            <IconComponent className="w-6 h-6" style={{ color: config.color }} />
          </div>
          
          <div className="flex items-center gap-2">
            {showVisibility && (
              <span className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-full bg-white/5 text-gray-400">
                <VisIcon className="w-3 h-3" />
                {visConfig.label}
              </span>
            )}
            {feed.isFeatured && (
              <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30">
                FEATURED
              </span>
            )}
          </div>
        </div>

        {/* Feed name */}
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all">
          {feed.name}
        </h3>

        {/* Description */}
        {feed.description && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-4">
            {feed.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Bookmark className="w-3.5 h-3.5" />
            {feed.itemsCount} ideas
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {feed.followersCount} followers
          </span>
        </div>

        {/* Creator & Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          {feed.creator && (
            <div className="flex items-center gap-2">
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
              <span className="text-xs text-gray-400">@{feed.creator.username}</span>
            </div>
          )}

          {showFollowButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFollowFeed(feed.id, feed.isFollowing || false);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                feed.isFollowing
                  ? 'bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400'
                  : 'bg-[#FFD700]/20 text-[#FFD700] hover:bg-[#FFD700]/30'
              }`}
            >
              {feed.isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {/* Arrow indicator */}
        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
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
        </div>
      </div>

      <div className="pt-24 sm:pt-32 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2 tracking-tight flex items-center gap-3">
              <Rss className="w-8 h-8 text-[#FFD700]" />
              <span>
                Gmi<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FDB931]">Feeds</span>
              </span>
            </h1>
            <p className="text-gray-400">
              Discover curated idea collections or create your own
            </p>
          </div>

          {user && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black rounded-full font-bold text-sm hover:shadow-lg hover:shadow-[#FFD700]/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Feed
            </button>
          )}
        </div>

        {/* Discover New Feeds */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-[#FFD700]" />
              Discover New Feeds
            </h2>
            {allPublicFeeds.length > 3 && (
              <button
                onClick={() => setShowAllPublicFeeds(!showAllPublicFeeds)}
                className="flex items-center gap-1 text-sm text-[#FFD700] hover:text-[#FFD700]/80 transition-colors"
              >
                {showAllPublicFeeds ? 'Show Less' : `More (${allPublicFeeds.length - 3})`}
                <ChevronDown className={`w-4 h-4 transition-transform ${showAllPublicFeeds ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
          
          {discoverFeeds.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(showAllPublicFeeds ? allPublicFeeds : discoverFeeds).map((feed) => (
                <FeedCard key={feed.id} feed={feed} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
              <Rss className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No public feeds yet</p>
              <p className="text-gray-500 text-sm mt-1">Be the first to create one!</p>
            </div>
          )}
        </section>

        {/* My Collections */}
        {user && myFeeds.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-blue-400" />
              My Collections
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {myFeeds.map((feed) => (
                <FeedCard key={feed.id} feed={feed} showFollowButton={false} showVisibility={true} />
              ))}
            </div>
          </section>
        )}

        {/* Following Feeds */}
        {user && followingFeeds.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Following
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {followingFeeds.map((feed) => (
                <FeedCard key={feed.id} feed={feed} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state for logged in users with no feeds */}
        {user && myFeeds.length === 0 && followingFeeds.length === 0 && discoverFeeds.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 flex items-center justify-center">
              <Rss className="w-10 h-10 text-[#FFD700]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No feeds yet</h3>
            <p className="text-gray-400 mb-6">Create your first feed to start collecting ideas</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black rounded-full font-bold hover:shadow-lg hover:shadow-[#FFD700]/20 transition-all"
            >
              Create Your First Feed
            </button>
          </div>
        )}

        {/* Empty state for guests */}
        {!user && discoverFeeds.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 flex items-center justify-center">
              <Lock className="w-10 h-10 text-[#FFD700]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Login to explore feeds</h3>
            <p className="text-gray-400">Sign in to discover curated idea collections and create your own</p>
          </div>
        )}
      </div>

      {/* Create Feed Modal */}
      <CreateFeedModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleFeedCreated}
      />
    </div>
  );
}
