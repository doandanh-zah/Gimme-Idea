'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

interface AdminDeleteButtonProps {
  projectId: string;
  projectTitle: string;
  onDeleted?: () => void;
  variant?: 'icon' | 'button' | 'menu-item';
  className?: string;
}

export default function AdminDeleteButton({
  projectId,
  projectTitle,
  onDeleted,
  variant = 'button',
  className = ''
}: AdminDeleteButtonProps) {
  const { isAdmin } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAdmin) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await apiClient.adminDeleteProject(projectId);
      if (response.success) {
        setShowConfirm(false);
        onDeleted?.();
      } else {
        setError(response.error || 'Failed to delete project');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderButton = () => {
    if (variant === 'icon') {
      return (
        <button
          onClick={() => setShowConfirm(true)}
          className={`p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${className}`}
          title="Admin: Delete this post"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      );
    }

    if (variant === 'menu-item') {
      return (
        <button
          onClick={() => setShowConfirm(true)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ${className}`}
        >
          <Trash2 className="w-4 h-4" />
          Delete (Admin)
        </button>
      );
    }

    return (
      <button
        onClick={() => setShowConfirm(true)}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors ${className}`}
      >
        <Trash2 className="w-4 h-4" />
        Admin Delete
      </button>
    );
  };

  return (
    <>
      {renderButton()}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            onClick={() => !isDeleting && setShowConfirm(false)}
          >
            <div className="absolute inset-0 modal-overlay" aria-hidden="true" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="modal-frame max-w-md p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-delete-title"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="border border-red-500/25 bg-red-500/15 p-2">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 id="admin-delete-title" className="text-lg font-semibold text-white">Admin Delete</h3>
                  <p className="text-sm text-gray-400">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-300 mb-2">
                  You are about to delete:
                </p>
                <div className="modal-section">
                  <p className="font-medium text-white truncate">{projectTitle}</p>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  As an admin, this will permanently remove this project from the platform.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isDeleting}
                  className="btn-ghost flex-1 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 border border-red-400/30 bg-red-400/10 px-4 text-sm font-medium text-red-100 transition hover:bg-red-400/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Project
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
