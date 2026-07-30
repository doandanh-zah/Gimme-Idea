'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Plus, Check, Bookmark, Rss } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Feed } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
}

export const BookmarkModal: React.FC<BookmarkModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [savingFeedId, setSavingFeedId] = useState<string | null>(null);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newFeedName, setNewFeedName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const bookmarkQueryKey = queryKeys.feeds.bookmark(projectId, user?.id || 'anonymous');
  const feedsQuery = useQuery({
    queryKey: bookmarkQueryKey,
    enabled: isOpen && Boolean(user?.id),
    queryFn: async ({ signal }) => {
      const response = await apiClient.getFeedsForBookmark(projectId, signal);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load feeds');
      }
      return response.data as (Feed & { hasItem: boolean })[];
    },
  });
  const feeds = feedsQuery.data || [];
  const isLoading = feedsQuery.isLoading;

  const handleToggleBookmark = async (feed: Feed & { hasItem: boolean }) => {
    setSavingFeedId(feed.id);
    try {
      if (feed.hasItem) {
        // Need to find the item ID first - for now just show message
        toast.error('To remove, go to the feed and remove from there');
      } else {
        const response = await apiClient.addItemToFeed(feed.id, { projectId });
        if (response.success) {
          queryClient.setQueryData<(Feed & { hasItem: boolean })[]>(bookmarkQueryKey, (current = []) =>
            current.map(f =>
              f.id === feed.id ? { ...f, hasItem: true, itemsCount: f.itemsCount + 1 } : f
            )
          );
          toast.success(`Added to "${feed.name}"`);
        } else {
          toast.error(response.error || 'Failed to add to feed');
        }
      }
    } catch (error) {
      toast.error('Failed to update bookmark');
    } finally {
      setSavingFeedId(null);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newFeedName.trim()) {
      toast.error('Please enter a feed name');
      return;
    }

    setIsCreating(true);
    try {
      // Create the feed
      const createRes = await apiClient.createFeed({
        name: newFeedName.trim(),
        visibility: 'private',
      });

      if (createRes.success && createRes.data) {
        // Add item to the new feed
        const addRes = await apiClient.addItemToFeed(createRes.data.id, { projectId });
        if (!addRes.success) {
          throw new Error(addRes.error || 'Failed to add idea to the new feed');
        }
        
        queryClient.setQueryData<(Feed & { hasItem: boolean })[]>(bookmarkQueryKey, (current = []) =>
          [{ ...createRes.data, hasItem: true }, ...current]
        );
        if (user?.id) {
          queryClient.setQueryData<Feed[]>(queryKeys.feeds.mine(user.id), (current = []) =>
            [createRes.data, ...current]
          );
        }
        setNewFeedName('');
        setShowCreateNew(false);
        toast.success(`Created "${createRes.data.name}" and added idea!`);
      } else {
        toast.error(createRes.error || 'Failed to create feed');
      }
    } catch (error) {
      toast.error('Failed to create feed');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
      >
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Close save to feed dialog"
          tabIndex={-1}
          className="absolute inset-0 modal-overlay"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="modal-frame max-w-md max-h-[82vh] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bookmark-title"
        >
          {/* Header */}
          <div className="modal-header flex-shrink-0">
            <div className="flex min-w-0 items-start gap-3">
              <div className="modal-icon">
                <Bookmark className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="ui-eyebrow mb-2">Save</p>
                <h2 id="bookmark-title" className="modal-title">Save to Feed</h2>
                <p className="modal-description line-clamp-1">
                  {projectTitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="modal-close"
              aria-label="Close save to feed dialog"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <div className="modal-body flex-grow overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#FFD700]" />
              </div>
            ) : (
              <>
                {/* Create new feed */}
                {showCreateNew ? (
                  <div className="modal-section mb-4">
                    <input
                      id="new-feed-name"
                      aria-label="New feed name"
                      type="text"
                      value={newFeedName}
                      onChange={(e) => setNewFeedName(e.target.value)}
                      placeholder="Feed name..."
                      maxLength={100}
                      autoFocus
                      className="field-input"
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={handleCreateAndAdd}
                        disabled={isCreating || !newFeedName.trim()}
                        className="btn-primary min-h-[40px] flex-1 px-3 py-2 text-sm disabled:cursor-not-allowed"
                      >
                        {isCreating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Create & Add
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateNew(false);
                          setNewFeedName('');
                        }}
                        className="btn-ghost min-h-[40px] px-3 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCreateNew(true)}
                    className="mb-4 flex min-h-[48px] w-full items-center justify-center gap-2 border border-dashed border-white/15 bg-white/[0.02] p-4 text-gray-400 transition-colors hover:border-[#FFD700]/50 hover:text-[#FFD700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                  >
                    <Plus className="w-5 h-5" />
                    Create new feed
                  </button>
                )}

                {/* Feeds list */}
                {feeds.length > 0 ? (
                  <div className="space-y-2">
                    <p className="field-label mb-3">Your feeds</p>
                    {feeds.map((feed) => (
                      <button
                        type="button"
                        key={feed.id}
                        onClick={() => handleToggleBookmark(feed)}
                        disabled={savingFeedId === feed.id}
                        className={`modal-option justify-between ${
                          feed.hasItem
                            ? 'modal-option-active'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center border ${
                            feed.hasItem ? 'bg-[#FFD700]/20' : 'bg-white/10'
                          }`}>
                            <Rss className={`w-5 h-5 ${feed.hasItem ? 'text-[#FFD700]' : 'text-gray-400'}`} />
                          </div>
                          <div className="text-left">
                            <p className={`font-medium ${feed.hasItem ? 'text-[#FFD700]' : 'text-white'}`}>
                              {feed.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {feed.itemsCount} ideas
                            </p>
                          </div>
                        </div>

                        {savingFeedId === feed.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        ) : feed.hasItem ? (
                          <Check className="w-5 h-5 text-[#FFD700]" />
                        ) : (
                          <Plus className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  !showCreateNew && (
                    <div className="text-center py-8">
                      <Rss className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">No feeds yet</p>
                      <p className="text-gray-500 text-xs mt-1">
                        Create your first feed to start saving ideas
                      </p>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
