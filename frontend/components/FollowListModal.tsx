'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Loader2 } from 'lucide-react';
import { useFollowList } from '../hooks/useFollow';
import { FollowButton } from './FollowButton';
import { AuthorLink, AuthorAvatar } from './AuthorLink';
import { FollowUser } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  initialTab?: 'followers' | 'following';
}

export const FollowListModal: React.FC<FollowListModalProps> = ({
  isOpen,
  onClose,
  userId,
  username,
  initialTab = 'followers',
}) => {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const { user: currentUser } = useAuth();
  const isOwnProfileList = Boolean(currentUser?.id && currentUser.id === userId);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 modal-overlay" aria-hidden="true" />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="modal-frame max-w-md max-h-[80vh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="follow-list-title"
        >
          {/* Header */}
          <div className="modal-header">
            <div>
              <p className="ui-eyebrow mb-2">Network</p>
              <h2 id="follow-list-title" className="modal-title">{username}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="modal-close"
              aria-label="Close follow list"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 px-4">
            <button
              type="button"
              onClick={() => setActiveTab('followers')}
              className={`ui-tab ${activeTab === 'followers' ? 'ui-tab-active' : ''}`}
            >
              Followers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('following')}
              className={`ui-tab ${activeTab === 'following' ? 'ui-tab-active' : ''}`}
            >
              Following
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh]">
            <FollowListContent
              userId={userId}
              type={activeTab}
              isOwnProfileList={isOwnProfileList}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

interface FollowListContentProps {
  userId: string;
  type: 'followers' | 'following';
  isOwnProfileList: boolean;
}

const FollowListContent: React.FC<FollowListContentProps> = ({
  userId,
  type,
  isOwnProfileList,
}) => {
  const { users, isLoading, hasMore, loadMore } = useFollowList({
    userId,
    type,
    limit: 20,
  });

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#FFD700]" aria-hidden="true" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Users className="w-12 h-12 mb-3 text-[#FFD700]" aria-hidden="true" />
        <p className="text-sm">
          {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {users.map((user) => (
        <FollowUserItem
          key={user.userId}
          user={user}
          showFollowBack={type === 'followers' && isOwnProfileList}
        />
      ))}
      
      {hasMore && (
        <div className="p-4 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoading}
            className="btn-ghost !min-h-[40px] !px-4 !py-2 !text-xs disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

interface FollowUserItemProps {
  user: FollowUser;
  showFollowBack?: boolean;
}

const FollowUserItem: React.FC<FollowUserItemProps> = ({ user, showFollowBack }) => {
  return (
    <div className="flex items-center justify-between p-4 transition-colors hover:bg-white/[0.04]">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <AuthorAvatar
          username={user.username}
          avatar={user.avatar || undefined}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <AuthorLink
            username={user.username}
            className="font-medium text-white hover:text-[#FFD700] truncate block"
          />
          {user.bio && (
            <p className="text-sm text-gray-400 truncate">{user.bio}</p>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span>{user.followersCount} followers</span>
            {showFollowBack && user.isFollowingBack && (
              <span className="text-[#FFD700]">Follows you</span>
            )}
          </div>
        </div>
      </div>
      <FollowButton
        targetUserId={user.userId}
        variant="compact"
        initialStats={{
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          isFollowing: Boolean(user.isFollowing),
          // isFollowingBack is profile-owner-relative, not viewer-relative
          isFollowedBy: false,
        }}
      />
    </div>
  );
};
