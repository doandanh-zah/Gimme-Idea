'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Globe, Link2, Rss } from 'lucide-react';
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
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
      >
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Close edit feed dialog"
          tabIndex={-1}
          className="absolute inset-0 modal-overlay"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="modal-frame max-w-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-feed-title"
        >
          {/* Header */}
          <div className="modal-header">
            <div className="flex min-w-0 items-start gap-3">
              <div className="modal-icon">
                <Rss className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="ui-eyebrow mb-2">GmiFeeds</p>
                <h2 id="edit-feed-title" className="modal-title">Edit Feed</h2>
                <p className="modal-description">Update the title, description, and discoverability.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="modal-close"
              aria-label="Close edit feed dialog"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="modal-body space-y-5">
            {/* Name */}
            <div>
              <label className="field-label" htmlFor="edit-feed-name">
                Feed Name *
              </label>
              <input
                id="edit-feed-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., DeFi Ideas to Watch"
                maxLength={100}
                className="field-input"
              />
              <p className="field-help">{name.length}/100</p>
            </div>

            {/* Description */}
            <div>
              <label className="field-label" htmlFor="edit-feed-description">
                Description
              </label>
              <textarea
                id="edit-feed-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What kind of ideas will you collect here?"
                maxLength={500}
                rows={3}
                className="field-input field-textarea"
              />
              <p className="field-help">{description.length}/500</p>
            </div>

            {/* Visibility */}
            <div>
              <p className="field-label">
                Visibility
              </p>
              <div className="space-y-2">
                {/* Public */}
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`modal-option ${
                    visibility === 'public'
                      ? 'modal-option-active'
                      : ''
                  }`}
                  aria-pressed={visibility === 'public'}
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
                  className={`modal-option ${
                    visibility === 'unlisted'
                      ? 'modal-option-active'
                      : ''
                  }`}
                  aria-pressed={visibility === 'unlisted'}
                >
                  <Link2 className={`w-5 h-5 ${visibility === 'unlisted' ? 'text-[#FFD700]' : 'text-gray-400'}`} />
                  <div>
                    <p className={`font-medium ${visibility === 'unlisted' ? 'text-[#FFD700]' : 'text-white'}`}>Unlisted</p>
                    <p className="text-xs text-gray-500">Not in Discover, but anyone with link can view</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="btn-primary w-full disabled:cursor-not-allowed"
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
