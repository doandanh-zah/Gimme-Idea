'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Crown, Medal, Award, MessageCircle, ThumbsUp, Sparkles } from 'lucide-react';
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
    { icon: Crown, label: 'Top Pick', watermark: '1', color: 'from-[#FFD700] to-[#FDB931]', bgColor: 'bg-[#FFD700]' },
    { icon: Medal, label: '2nd Best', watermark: '2', color: 'from-[#C0C0C0] to-[#A8A8A8]', bgColor: 'bg-[#C0C0C0]' },
    { icon: Award, label: '3rd Best', watermark: '3', color: 'from-[#CD7F32] to-[#B87333]', bgColor: 'bg-[#CD7F32]' },
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendedIdeas.map((idea, index) => {
          const MedalIcon = medals[index].icon;
          
          return (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.25, ease: "easeOut" }}
              onClick={() => handleViewIdea(idea)}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="relative p-6 rounded-2xl transition-all duration-300 cursor-pointer group border border-white/10 bg-[#0D0D12] hover:border-[#FFD700]/30 hover:shadow-[0_8px_40px_rgba(255,215,0,0.15)] min-h-[340px] flex flex-col overflow-hidden"
            >
              {/* Subtle gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              
              {/* Faded Watermark Number */}
              <div className="absolute top-4 right-4 text-[100px] font-black text-white/[0.03] leading-none pointer-events-none select-none">
                {medals[index].watermark}
              </div>

              {/* Premium Medal Badge */}
              <div className="relative z-10 flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${medals[index].color} flex items-center justify-center shadow-lg`}>
                    <MedalIcon className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-[#FFD700]" />
                      AI Recommended
                    </div>
                    <div className={`text-sm font-bold bg-gradient-to-r ${medals[index].color} text-transparent bg-clip-text`}>
                      {medals[index].label}
                    </div>
                  </div>
                </div>
                
                {/* Category Badge */}
                <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-white/70 rounded-lg font-mono text-[10px] uppercase">
                  {idea.category}
                </span>
              </div>

              {/* Title */}
              <h3 className="relative z-10 text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-[#FFD700] transition-colors duration-200">
                {idea.title}
              </h3>

              {/* Problem Preview */}
              <p className="relative z-10 text-sm text-gray-400 line-clamp-3 mb-5 flex-grow leading-relaxed">
                {idea.problem || idea.description || 'No description available'}
              </p>

              {/* Footer Stats */}
              <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{idea.feedbackCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{idea.votes || 0}</span>
                  </div>
                </div>
                <AuthorLink
                  username={idea.author?.username || 'Anonymous'}
                  avatar={idea.author?.avatar}
                  isAnonymous={idea.isAnonymous || !idea.author}
                  showAvatar={false}
                  className="text-xs text-gray-500 font-mono hover:text-white transition-colors"
                >
                  {idea.author && !idea.isAnonymous ? `@${idea.author.username}` : undefined}
                </AuthorLink>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="mt-12 border-t border-white/10" />
    </div>
  );
};
