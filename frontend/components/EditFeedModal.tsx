'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Globe, Link2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Feed } from '@/lib/types';
import toast from 'react-hot-toast';

interface EditFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  feed: Feed;
  onUpdate: (updatedFeed: Feed) => void;
}

export const EditFeedModal: React.FC<EditFeedModalProps> = ({
  isOpen,
  onClose,
  feed,
  onUpdate,
}) => {
  const [name, setName] = useState(feed.name);
  const [description, setDescription] = useState(feed.description || '');
  const [visibility, setVisibility] = useState<'public' | 'unlisted'>(
    feed.visibility === 'private' ? 'unlisted' : feed.visibility
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(feed.name);
      setDescription(feed.description || '');
      setVisibility(feed.visibility === 'private' ? 'unlisted' : feed.visibility);
    }
  }, [isOpen, feed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a feed name');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.updateFeed(feed.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        visibility,
      });

      if (response.success && response.data) {
        onUpdate(response.data);
        onClose();
        toast.success('Feed updated successfully!');
      } else {
        toast.error(response.error || 'Failed to update feed');
      }
    } catch (error) {
      toast.error('Failed to update feed');
    } finally {
      setIsLoading(false);
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
          className="relative w-full max-w-md bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Edit Feed</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Feed Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., DeFi Ideas to Watch"
                maxLength={100}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]/50 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">{name.length}/100</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What kind of ideas will you collect here?"
                maxLength={500}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]/50 transition-colors resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Visibility
              </label>
              <div className="space-y-2">
                {/* Public */}
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    visibility === 'public'
                      ? 'bg-[#FFD700]/20 border-[#FFD700]/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Globe className={`w-5 h-5 ${visibility === 'public' ? 'text-[#FFD700]' : 'text-gray-400'}`} />
                  <div>
                    <p className={`font-medium ${visibility === 'public' ? 'text-[#FFD700]' : 'text-white'}`}>Public</p>
                    <p className="text-xs text-gray-500">Shown in Discover, anyone can see</p>
                  </div>
                </button>

                {/* Unlisted */}
                <button
                  type="button"
                  onClick={() => setVisibility('unlisted')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    visibility === 'unlisted'
                      ? 'bg-blue-500/20 border-blue-500/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Link2 className={`w-5 h-5 ${visibility === 'unlisted' ? 'text-blue-400' : 'text-gray-400'}`} />
                  <div>
                    <p className={`font-medium ${visibility === 'unlisted' ? 'text-blue-400' : 'text-white'}`}>Unlisted</p>
                    <p className="text-xs text-gray-500">Not in Discover, but anyone with link can view</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="w-full py-3 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black rounded-xl font-bold hover:shadow-lg hover:shadow-[#FFD700]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
