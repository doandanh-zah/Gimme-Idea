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
  onFollowChange?: (isFollowing: boolean) => void;
  initialStats?: FollowStatsData;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  targetUsername,
  variant = 'default',
  className = '',
  onFollowChange,
  initialStats,
}) => {
  const user = useAppStore((state) => state.user);
  const { isFollowing, isLoading, toggleFollow } = useFollow({
    targetUserId,
    initialStats,
    onFollowChange,
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
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        aria-busy={isLoading}
        className={`inline-flex min-h-[40px] min-w-[40px] items-center justify-center border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] ${
          isFollowing
            ? 'border-white/15 bg-white/[0.04] text-white hover:border-red-400/50 hover:text-red-300'
            : 'border-[#FFD700] bg-[#FFD700] text-black hover:bg-[#FDB931]'
        } ${className}`}
        aria-label={`${isFollowing ? 'Unfollow' : 'Follow'} ${targetUsername || 'user'}`}
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
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        aria-busy={isLoading}
        className={`inline-flex min-h-[40px] items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] ${
          isFollowing
            ? 'border border-white/15 bg-white/[0.04] text-white hover:border-red-400/50 hover:text-red-300'
            : 'border border-[#FFD700] bg-[#FFD700] text-black hover:bg-[#FDB931]'
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

  // Default variant
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-busy={isLoading}
      className={`group ${
        isFollowing
          ? 'btn-ghost hover:!border-red-400/50 hover:!text-red-300'
          : 'btn-primary'
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
        type="button"
        onClick={onFollowersClick}
        className="inline-flex min-h-[40px] items-baseline gap-1.5 transition hover:text-[#FFD700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
      >
        <span className="font-bold text-white">{followersCount}</span>
        <span className="text-gray-400 text-sm">Followers</span>
      </button>
      <button
        type="button"
        onClick={onFollowingClick}
        className="inline-flex min-h-[40px] items-baseline gap-1.5 transition hover:text-[#FFD700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
      >
        <span className="font-bold text-white">{followingCount}</span>
        <span className="text-gray-400 text-sm">Following</span>
      </button>
    </div>
  );
};
