'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Plus, Check, Bookmark, Rss } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Feed } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

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
  const [feeds, setFeeds] = useState<(Feed & { hasItem: boolean })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingFeedId, setSavingFeedId] = useState<string | null>(null);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newFeedName, setNewFeedName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadFeeds();
    }
  }, [isOpen, user, projectId]);

  const loadFeeds = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getFeedsForBookmark(projectId);
      if (response.success && response.data) {
        setFeeds(response.data);
      }
    } catch (error) {
      console.error('Failed to load feeds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBookmark = async (feed: Feed & { hasItem: boolean }) => {
    setSavingFeedId(feed.id);
    try {
      if (feed.hasItem) {
        // Need to find the item ID first - for now just show message
        toast.error('To remove, go to the feed and remove from there');
      } else {
        const response = await apiClient.addItemToFeed(feed.id, { projectId });
        if (response.success) {
          setFeeds(prev =>
            prev.map(f =>
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
        await apiClient.addItemToFeed(createRes.data.id, { projectId });
        
        // Update local state
        setFeeds(prev => [{ ...createRes.data, hasItem: true }, ...prev]);
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#FFD700]" />
                Save to Feed
              </h2>
              <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                {projectTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-grow overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#FFD700]" />
              </div>
            ) : (
              <>
                {/* Create new feed */}
                {showCreateNew ? (
                  <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <input
                      type="text"
                      value={newFeedName}
                      onChange={(e) => setNewFeedName(e.target.value)}
                      placeholder="Feed name..."
                      maxLength={100}
                      autoFocus
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]/50 text-sm"
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleCreateAndAdd}
                        disabled={isCreating || !newFeedName.trim()}
                        className="flex-1 py-2 bg-[#FFD700] text-black rounded-lg font-medium text-sm hover:bg-[#FFD700]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                        onClick={() => {
                          setShowCreateNew(false);
                          setNewFeedName('');
                        }}
                        className="px-4 py-2 bg-white/10 text-gray-300 rounded-lg text-sm hover:bg-white/20"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCreateNew(true)}
                    className="w-full mb-4 p-4 border-2 border-dashed border-white/10 rounded-xl text-gray-400 hover:border-[#FFD700]/50 hover:text-[#FFD700] transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create new feed
                  </button>
                )}

                {/* Feeds list */}
                {feeds.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 mb-3">Your feeds</p>
                    {feeds.map((feed) => (
                      <button
                        key={feed.id}
                        onClick={() => handleToggleBookmark(feed)}
                        disabled={savingFeedId === feed.id}
                        className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${
                          feed.hasItem
                            ? 'bg-[#FFD700]/10 border-[#FFD700]/30'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
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
