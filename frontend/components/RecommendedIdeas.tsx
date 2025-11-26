'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Award } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { Project } from '../lib/types';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const RecommendedIdeas = () => {
  const [recommendedIdeas, setRecommendedIdeas] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setSelectedProjectId, setView } = useAppStore();

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const response = await axios.get(`${API_URL}/projects/recommended?limit=3`);
        if (response.data.success) {
          setRecommendedIdeas(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch recommended ideas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommended();
  }, []);

  const handleViewIdea = (id: string) => {
    setSelectedProjectId(id);
    setView('idea-detail');
  };

  if (isLoading) {
    return (
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-[#FFD700]" />
          <h2 className="text-2xl font-bold text-white">AI Recommended Ideas</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-panel p-6 rounded-2xl animate-pulse">
              <div className="h-6 bg-white/10 rounded mb-4" />
              <div className="h-4 bg-white/10 rounded mb-2" />
              <div className="h-4 bg-white/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendedIdeas.length === 0) {
    return null;
  }

  const medals = [
    { icon: <Award className="w-6 h-6 text-[#FFD700]" />, color: 'from-[#FFD700] to-[#FDB931]', label: '🥇 Top Pick' },
    { icon: <Award className="w-6 h-6 text-gray-300" />, color: 'from-gray-300 to-gray-400', label: '🥈 2nd' },
    { icon: <Award className="w-6 h-6 text-[#CD7F32]" />, color: 'from-[#CD7F32] to-[#B8860B]', label: '🥉 3rd' },
  ];

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-[#FFD700] animate-pulse" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-transparent bg-clip-text">
          AI Recommended Ideas
        </h2>
        <TrendingUp className="w-5 h-5 text-[#FFD700]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendedIdeas.map((idea, index) => (
          <motion.div
            key={idea.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleViewIdea(idea.id)}
            className="relative glass-panel p-6 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group border border-[#FFD700]/20 hover:border-[#FFD700]/50"
          >
            {/* Medal Badge */}
            <div className="absolute top-4 right-4">
              <div className={`bg-gradient-to-br ${medals[index].color} rounded-full p-2 shadow-lg`}>
                {medals[index].icon}
              </div>
            </div>

            {/* Rank Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-white">#{index + 1}</span>
              <span className="text-xs text-gray-400 font-mono">AI TOP PICK</span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 group-hover:text-[#FFD700] transition-colors">
              {idea.title}
            </h3>

            {/* Category & Stats */}
            <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
              <span className="px-2 py-1 bg-[#FFD700]/20 text-[#FFD700] rounded-full font-mono">
                {idea.category}
              </span>
              <span>💬 {idea.feedbackCount || 0}</span>
              <span>👍 {idea.votes || 0}</span>
            </div>

            {/* Problem Preview */}
            <p className="text-sm text-gray-300 line-clamp-2 mb-4">
              {idea.problem}
            </p>

            {/* View Button */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#FFD700] font-mono group-hover:underline">
                View Details →
              </span>
              {idea.author && !idea.isAnonymous && (
                <span className="text-xs text-gray-500">
                  by {idea.author.username}
                </span>
              )}
            </div>

            {/* Glow Effect on Hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#FFD700]/0 via-[#FFD700]/5 to-[#FFD700]/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.div>
        ))}
      </div>

      {/* Divider */}
      <div className="mt-12 border-t border-white/10" />
    </div>
  );
};
