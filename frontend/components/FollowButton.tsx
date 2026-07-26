'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, UserMinus, Loader2, UserCheck } from 'lucide-react';
import { useFollow } from '../hooks/useFollow';
import { useAppStore } from '../lib/store';
import toast from 'react-hot-toast';
import type { FollowStats as FollowStatsData } from '../lib/types';

interface FollowButtonProps {
  targetUserId: string;
  targetUsername?: string;
  variant?: 'default' | 'compact' | 'icon';
  className?: string;
  initialStats?: FollowStatsData;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  targetUsername,
  variant = 'default',
  className = '',
  initialStats,
}) => {
  const { user } = useAppStore();
  const { isFollowing, isLoading, toggleFollow } = useFollow({
    targetUserId,
    initialStats,
  });

  // Don't show follow button for own profile
  if (user?.id === targetUserId) {
    return null;
  }

  // User must be logged in to follow
  const handleClick = () => {
    if (!user) {
      toast.error('Please connect your wallet to follow users');
      return;
    }
    toggleFollow();
  };

  // Icon only variant
  if (variant === 'icon') {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        disabled={isLoading}
        className={`p-2 rounded-full transition-all ${
          isFollowing
            ? 'bg-purple-500/20 text-purple-400 hover:bg-red-500/20 hover:text-red-400'
            : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
        } ${className}`}
        title={isFollowing ? 'Unfollow' : 'Follow'}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isFollowing ? (
          <UserCheck className="w-5 h-5" />
        ) : (
          <UserPlus className="w-5 h-5" />
        )}
      </motion.button>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        disabled={isLoading}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
          isFollowing
            ? 'bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400 border border-white/20'
            : 'bg-purple-500 text-white hover:bg-purple-600'
        } ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isFollowing ? (
          <>
            <UserCheck className="w-3.5 h-3.5" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="w-3.5 h-3.5" />
            Follow
          </>
        )}
      </motion.button>
    );
  }

  // Default variant - Pill shape purple button
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      disabled={isLoading}
      className={`px-6 py-2.5 rounded-full font-semibold transition-all flex items-center gap-2 shadow-lg ${
        isFollowing
          ? 'bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400 border border-white/20 group backdrop-blur-sm'
          : 'bg-gradient-to-r from-purple-600 via-purple-500 to-violet-500 text-white hover:from-purple-700 hover:via-purple-600 hover:to-violet-600 shadow-purple-500/25'
      } ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : isFollowing ? (
        <>
          <UserCheck className="w-4 h-4 group-hover:hidden" />
          <UserMinus className="w-4 h-4 hidden group-hover:block" />
          <span className="group-hover:hidden">Following</span>
          <span className="hidden group-hover:block">Unfollow</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span>Follow</span>
        </>
      )}
    </motion.button>
  );
};

// Follow stats display component
interface FollowStatsProps {
  followersCount: number;
  followingCount: number;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  className?: string;
}

export const FollowStats: React.FC<FollowStatsProps> = ({
  followersCount,
  followingCount,
  onFollowersClick,
  onFollowingClick,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <button
        onClick={onFollowersClick}
        className="flex items-center gap-1.5 hover:text-purple-400 transition-colors"
      >
        <span className="font-bold text-white">{followersCount}</span>
        <span className="text-gray-400 text-sm">Followers</span>
      </button>
      <button
        onClick={onFollowingClick}
        className="flex items-center gap-1.5 hover:text-purple-400 transition-colors"
      >
        <span className="font-bold text-white">{followingCount}</span>
        <span className="text-gray-400 text-sm">Following</span>
      </button>
    </div>
  );
};
