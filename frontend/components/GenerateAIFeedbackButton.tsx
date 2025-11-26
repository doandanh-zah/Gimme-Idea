'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { apiClient } from '../lib/api-client';
import { useAppStore } from '../lib/store';
import type { AIFeedback, AIQuota } from '../lib/types';

interface GenerateAIFeedbackButtonProps {
  projectId: string;
  ideaData: {
    title: string;
    problem: string;
    solution: string;
    opportunity?: string;
    goMarket?: string;
    teamInfo?: string;
  };
  onFeedbackGenerated: (feedback: AIFeedback) => void;
}

export const GenerateAIFeedbackButton: React.FC<GenerateAIFeedbackButtonProps> = ({
  projectId,
  ideaData,
  onFeedbackGenerated,
}) => {
  const { user, openConnectReminder } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState<AIQuota | null>(null);
  const [error, setError] = useState('');

  // Check quota when component mounts
  useEffect(() => {
    if (user) {
      loadQuota();
    }
  }, [user, projectId]);

  const loadQuota = async () => {
    try {
      const result = await apiClient.checkAIQuota(projectId);
      if (result.success && result.data) {
        setQuota(result.data);
      }
    } catch (err) {
      console.error('Failed to check quota:', err);
    }
  };

  const handleGenerate = async () => {
    // Check if user is logged in
    if (!user) {
      openConnectReminder();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await apiClient.generateAIFeedback({
        projectId,
        ...ideaData,
      });

      if (result.success && result.data) {
        toast.success('AI feedback generated successfully! 🎉');
        onFeedbackGenerated(result.data);

        // Refresh quota after generating
        await loadQuota();
      } else {
        const errorMsg = result.error || 'Failed to generate feedback';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Something went wrong';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // If not logged in
  if (!user) {
    return (
      <motion.button
        onClick={() => openConnectReminder()}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Sparkles className="w-5 h-5" />
        Connect Wallet to Get AI Feedback
      </motion.button>
    );
  }

  // If no credits remaining
  if (quota && !quota.canUse) {
    return (
      <div className="space-y-3">
        <button
          disabled
          className="w-full px-6 py-3 bg-gray-300 text-gray-600 rounded-xl font-medium flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
        >
          <Sparkles className="w-5 h-5" />
          No AI Credits Remaining
        </button>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <CreditCard className="w-5 h-5 text-purple-600 mx-auto mb-2" />
          <p className="text-sm text-purple-700 font-medium mb-1">
            You've used all your free AI interactions
          </p>
          <p className="text-xs text-purple-600">
            Purchase more credits to continue using AI features
          </p>
          <button className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
            Buy AI Credits
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <motion.button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        whileHover={!loading ? { scale: 1.02 } : {}}
        whileTap={!loading ? { scale: 0.98 } : {}}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating AI Feedback...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Get AI Feedback
          </>
        )}
      </motion.button>

      {/* Show remaining credits */}
      {quota && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600">
              {quota.freeRemaining} free interactions left
            </span>
          </div>
          {quota.paidCredits > 0 && (
            <span className="text-purple-600 font-medium">
              + {quota.paidCredits} paid credits
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};
