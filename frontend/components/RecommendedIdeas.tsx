'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { Project } from '../lib/types';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { AuthorLink } from './AuthorLink';
import { createUniqueSlug } from '../lib/slug-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const RecommendedIdeas = () => {
  const [recommendedIdeas, setRecommendedIdeas] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const router = useRouter();

  const categories = ['All', 'DeFi', 'NFT', 'Gaming', 'Infrastructure', 'DAO', 'DePIN', 'Social', 'Mobile', 'Security', 'Payment', 'Developer Tooling', 'ReFi', 'Content', 'Dapp', 'Blinks'];

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const categoryParam = selectedCategory === 'All' ? '' : `&category=${selectedCategory}`;
        const response = await axios.get(`${API_URL}/projects/recommended?limit=3${categoryParam}`);
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
  }, [selectedCategory]);

  const handleViewIdea = (idea: Project) => {
    const slug = createUniqueSlug(idea.title, idea.id);
    router.push(`/idea/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white">Top 3 of {selectedCategory}</h2>
          </div>
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
    { emoji: '🥇', label: 'Top Pick', watermark: '1' },
    { emoji: '🥈', label: '2nd Best', watermark: '2' },
    { emoji: '🥉', label: '3rd Best', watermark: '3' },
  ];

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-transparent bg-clip-text">
            Top 3 of {selectedCategory}
          </h2>
        </div>

        {/* Category Selector */}
        <div className="relative">
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-mono text-white hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            {selectedCategory}
            <ChevronDown className={`w-4 h-4 transition-transform ${showCategoryMenu ? 'rotate-180' : ''}`} />
          </button>

          {showCategoryMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-[#14151C] border border-white/20 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setShowCategoryMenu(false);
                    setIsLoading(true);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors ${
                    selectedCategory === cat ? 'text-[#FFD700] bg-white/5' : 'text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {recommendedIdeas.map((idea, index) => (
          <motion.div
            key={idea.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.25, ease: "easeOut" }}
            onClick={() => handleViewIdea(idea)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="relative p-6 rounded-2xl transition-all duration-200 cursor-pointer group border border-[#FFD700]/10 bg-gradient-to-br from-[#FFD700]/[0.03] to-transparent hover:shadow-[0_8px_40px_rgba(255,215,0,0.12)] min-h-[320px] flex flex-col overflow-hidden"
          >
            {/* Faded Watermark Number */}
            <div className="absolute top-6 right-6 text-[120px] font-black text-[#FFD700]/[0.03] leading-none pointer-events-none select-none">
              {medals[index].watermark}
            </div>

            {/* Premium Medal Badge */}
            <div className="relative z-10 flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{medals[index].emoji}</span>
                <div>
                  <div className="text-xs font-mono text-[#FFD700]/60 uppercase tracking-wider">AI Recommended</div>
                  <div className="text-sm font-bold text-[#FFD700]">{medals[index].label}</div>
                </div>
              </div>
            </div>

            {/* Large Title */}
            <h3 className="relative z-10 text-2xl font-bold text-white mb-4 line-clamp-2 group-hover:text-[#FFD700] transition-colors duration-200">
              {idea.title}
            </h3>

            {/* Problem Preview */}
            <p className="relative z-10 text-sm text-gray-400 line-clamp-3 mb-5 flex-grow">
              {idea.problem}
            </p>

            {/* Footer Stats */}
            <div className="relative z-10 flex items-center justify-between pt-4 border-t border-[#FFD700]/10 mt-auto">
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2 py-1 bg-[#FFD700]/10 text-[#FFD700] rounded-full font-mono text-[10px]">
                  {idea.category}
                </span>
                <span className="text-gray-500">💬 {idea.feedbackCount || 0}</span>
                <span className="text-gray-500">👍 {idea.votes || 0}</span>
              </div>
              <AuthorLink
                username={idea.author?.username || 'Anonymous'}
                avatar={idea.author?.avatar}
                isAnonymous={idea.isAnonymous || !idea.author}
                showAvatar={false}
                className="text-xs text-gray-600 font-mono"
              >
                {idea.author && !idea.isAnonymous ? `@${idea.author.username}` : undefined}
              </AuthorLink>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Divider */}
      <div className="mt-12 border-t border-white/10" />
    </div>
  );
};
