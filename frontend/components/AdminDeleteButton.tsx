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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => !isDeleting && setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md mx-4 p-6 bg-[#111] border border-red-500/30 rounded-2xl shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-red-500/20">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Admin Delete</h3>
                  <p className="text-sm text-gray-400">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-300 mb-2">
                  You are about to delete:
                </p>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
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
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
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
