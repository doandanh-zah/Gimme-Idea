'use client';

import React, { useState } from 'react';
import { TrendingUp, Target, Users, AlertCircle, Lightbulb, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { apiClient } from '../lib/api-client';
import { useAppStore } from '../lib/store';
import type { MarketAssessment as MarketAssessmentType } from '../lib/types';

interface MarketAssessmentProps {
  projectId: string;
  ideaData: {
    title: string;
    problem: string;
    solution: string;
    opportunity?: string;
  };
}

export const MarketAssessment: React.FC<MarketAssessmentProps> = ({
  projectId,
  ideaData,
}) => {
  const { user, openConnectReminder } = useAppStore();
  const [assessment, setAssessment] = useState<MarketAssessmentType | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const loadAssessment = async () => {
    if (!user) {
      openConnectReminder();
      return;
    }

    setLoading(true);

    try {
      const result = await apiClient.generateMarketAssessment({
        projectId,
        ...ideaData,
      });

      if (result.success && result.data) {
        setAssessment(result.data);
        toast.success('Market assessment generated! 📊');
      } else {
        toast.error(result.error || 'Failed to generate assessment');
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'from-green-500 to-emerald-500';
    if (score >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  const getMarketSizeBadge = (size: string) => {
    const colors = {
      large: 'bg-green-100 text-green-700 border-green-300',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      small: 'bg-orange-100 text-orange-700 border-orange-300',
    };
    return colors[size as keyof typeof colors] || colors.small;
  };

  const getCompetitionBadge = (level: string) => {
    const colors = {
      low: 'bg-green-100 text-green-700 border-green-300',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      high: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[level as keyof typeof colors] || colors.medium;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
      >
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
          <p className="text-sm text-gray-500">Analyzing market potential...</p>
          <p className="text-xs text-gray-400 mt-1">This may take a few seconds</p>
        </div>
      </motion.div>
    );
  }

  if (!assessment) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Market Assessment
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Get AI-powered insights on your idea's market potential
          </p>
          <button
            onClick={loadAssessment}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Generate Market Assessment
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Market Assessment
            </h3>
            <p className="text-xs text-gray-500">AI-powered market analysis</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold bg-gradient-to-r ${getScoreColor(assessment.score)} bg-clip-text text-transparent`}>
            {assessment.score}
          </div>
          <p className="text-xs text-gray-500">out of 100</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${assessment.score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${getScoreColor(assessment.score)} rounded-full`}
        />
      </div>

      {/* Summary Text */}
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {assessment.assessmentText}
      </p>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getMarketSizeBadge(assessment.marketSize)}`}>
          <Target className="w-4 h-4" />
          <span className="text-sm font-medium capitalize">
            Market: {assessment.marketSize}
          </span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getCompetitionBadge(assessment.competitionLevel)}`}>
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium capitalize">
            Competition: {assessment.competitionLevel}
          </span>
        </div>
      </div>

      {/* Expandable Details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-purple-600 hover:text-purple-700 transition-colors py-2"
      >
        <span className="text-sm font-medium">
          {expanded ? 'Hide' : 'Show'} detailed analysis
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            {/* Strengths */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Market Strengths
                </h4>
              </div>
              <ul className="space-y-2">
                {assessment.strengths.map((strength, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{strength}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Risks & Weaknesses
                </h4>
              </div>
              <ul className="space-y-2">
                {assessment.weaknesses.map((weakness, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-red-500 mt-0.5">!</span>
                    <span>{weakness}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Recommendations
                </h4>
              </div>
              <ul className="space-y-2">
                {assessment.recommendations.map((rec, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-blue-500 mt-0.5">→</span>
                    <span>{rec}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
