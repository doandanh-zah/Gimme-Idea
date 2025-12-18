'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Crown, Medal, Award, ThumbsUp, MessageCircle, Sparkles } from 'lucide-react';
import { Project } from '../lib/types';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { AuthorLink } from './AuthorLink';
import { createUniqueSlug } from '../lib/slug-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Helper to create AI summary from problem and solution
const createSummary = (problem?: string, solution?: string): string => {
  if (!problem && !solution) return 'No description available';
  
  // Clean and truncate
  const cleanProblem = problem?.replace(/[#*_`]/g, '').trim() || '';
  const cleanSolution = solution?.replace(/[#*_`]/g, '').trim() || '';
  
  // Get first sentence or first 60 chars of each
  const getFirstPart = (text: string, maxLen: number = 60) => {
    const firstSentence = text.split(/[.!?]/)[0];
    if (firstSentence.length <= maxLen) return firstSentence;
    return text.substring(0, maxLen).trim() + '...';
  };
  
  const shortProblem = getFirstPart(cleanProblem, 50);
  const shortSolution = getFirstPart(cleanSolution, 50);
  
  if (shortProblem && shortSolution) {
    return `${shortProblem} → ${shortSolution}`;
  }
  return shortProblem || shortSolution || 'No description available';
};

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
    // Create clean URL slug from title + short ID
    const slug = createUniqueSlug(idea.title, idea.id);
    router.push(`/idea/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Top 3 of {selectedCategory}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-panel p-6 rounded-2xl animate-pulse h-[300px]">
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
    { 
      icon: Crown, 
      label: 'Top Pick', 
      watermark: '1', 
      color: '#FFD700',
      borderColor: 'border-[#FFD700]/40',
      hoverBorder: 'group-hover:border-[#FFD700]/80',
      hoverShadow: 'group-hover:shadow-[0_0_30px_rgba(255,215,0,0.3)]',
      glowColor: 'rgba(255,215,0,0.4)'
    },
    { 
      icon: Medal, 
      label: '2nd Best', 
      watermark: '2', 
      color: '#C0C0C0',
      borderColor: 'border-[#C0C0C0]/40',
      hoverBorder: 'group-hover:border-[#C0C0C0]/80',
      hoverShadow: 'group-hover:shadow-[0_0_30px_rgba(192,192,192,0.3)]',
      glowColor: 'rgba(192,192,192,0.4)'
    },
    { 
      icon: Award, 
      label: '3rd Best', 
      watermark: '3', 
      color: '#CD7F32',
      borderColor: 'border-[#CD7F32]/40',
      hoverBorder: 'group-hover:border-[#CD7F32]/80',
      hoverShadow: 'group-hover:shadow-[0_0_30px_rgba(205,127,50,0.3)]',
      glowColor: 'rgba(205,127,50,0.4)'
    },
  ];

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-[#FFD700]" />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-transparent bg-clip-text">
            Top 3 of {selectedCategory}
          </h2>
        </div>

        {/* Category Selector */}
        <div className="relative">
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            className="px-4 py-2 bg-white/5 border border-white/15 rounded-full text-sm font-mono text-white hover:bg-white/10 transition-colors flex items-center gap-2"
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
          const medal = medals[index];
          const MedalIcon = medal.icon;
          const summary = createSummary(idea.problem, idea.solution);
          
          return (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                boxShadow: [
                  `0 0 20px ${medal.color}30, inset 0 0 20px ${medal.color}05`,
                  `0 0 35px ${medal.color}50, inset 0 0 30px ${medal.color}10`,
                  `0 0 20px ${medal.color}30, inset 0 0 20px ${medal.color}05`,
                ]
              }}
              transition={{ 
                delay: index * 0.1, 
                duration: 0.3, 
                ease: "easeOut",
                boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              onClick={() => handleViewIdea(idea)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-6 rounded-2xl cursor-pointer group min-h-[300px] flex flex-col overflow-hidden
                bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-sm
                border ${medal.borderColor} ${medal.hoverBorder} ${medal.hoverShadow}
                transition-all duration-500`}
            >
              {/* Continuous Glitch Scanline */}
              <motion.div
                className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-20"
                initial={{ opacity: 0.3 }}
              >
                <motion.div
                  className="absolute w-full h-[2px]"
                  style={{ 
                    background: `linear-gradient(90deg, transparent, ${medal.color}80, transparent)`,
                    boxShadow: `0 0 10px ${medal.color}60`
                  }}
                  animate={{ top: ['-10%', '110%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                />
              </motion.div>

              {/* Continuous Glitch Border Effects */}
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ border: `1px solid ${medal.color}` }}
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  x: [0, -2, 2, 0],
                }}
                transition={{ duration: 0.3, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ borderTop: `1px solid ${medal.color}`, borderBottom: `1px solid ${medal.color}` }}
                animate={{
                  opacity: [0.2, 0.5, 0.2],
                  x: [0, 3, -3, 0],
                }}
                transition={{ duration: 0.25, repeat: Infinity, delay: 0.1 }}
              />

              {/* Glitch Color Overlay */}
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none mix-blend-overlay"
                style={{ background: `linear-gradient(45deg, ${medal.color}10, transparent)` }}
                animate={{
                  opacity: [0.1, 0.3, 0.1],
                  x: [0, -3, 3, 0],
                }}
                transition={{ duration: 0.4, repeat: Infinity }}
              />

              {/* Random Glitch Slices */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute left-0 right-0 pointer-events-none overflow-hidden"
                  style={{
                    top: `${20 + i * 25}%`,
                    height: '3px',
                    background: `linear-gradient(90deg, transparent 20%, ${medal.color}40 50%, transparent 80%)`,
                  }}
                  animate={{
                    opacity: [0, 0.6, 0],
                    x: [0, i % 2 === 0 ? 5 : -5, 0],
                    scaleX: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 0.15,
                    repeat: Infinity,
                    repeatDelay: 1.5 + i * 0.3,
                  }}
                />
              ))}
              
              {/* Sparkle border animation on hover */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, ${medal.color}20, transparent 50%, ${medal.color}20)`,
                }}
              />
              
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden rounded-2xl">
                <div 
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${medal.color}15, transparent)`,
                  }}
                />
              </div>

              {/* Large watermark number */}
              <div 
                className="absolute top-2 right-4 text-[120px] font-black leading-none pointer-events-none select-none transition-opacity duration-300"
                style={{ color: `${medal.color}08` }}
              >
                {medal.watermark}
              </div>

              {/* Header with medal */}
              <div className="relative z-10 flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: medal.color }}
                  >
                    <MedalIcon className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <div 
                      className="text-lg font-extrabold tracking-tight"
                      style={{ color: medal.color }}
                    >
                      {medal.label}
                    </div>
                  </div>
                </div>
                
                <span className="px-2 py-1 bg-black/30 border border-white/10 text-gray-400 rounded-lg font-mono text-[9px] uppercase">
                  {idea.category}
                </span>
              </div>

              {/* Title with Glitch Effect */}
              <motion.h3 
                className="relative z-10 text-lg font-bold text-white mb-3 line-clamp-2"
                animate={{
                  textShadow: [
                    `0 0 8px ${medal.color}60`,
                    `-2px 0 ${medal.color}80, 2px 0 ${medal.color}40`,
                    `2px 0 ${medal.color}80, -2px 0 ${medal.color}40`,
                    `0 0 8px ${medal.color}60`,
                  ]
                }}
                transition={{ duration: 0.25, repeat: Infinity }}
              >
                <span className="group-hover:brightness-125 transition-all duration-300" style={{ color: medal.color }}>
                  {idea.title}
                </span>
              </motion.h3>

              {/* AI Summary - Problem → Solution */}
              <p className="relative z-10 text-sm text-gray-400 line-clamp-2 mb-4 flex-grow leading-relaxed">
                {summary}
              </p>

              {/* Footer */}
              <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
                <div className="flex items-center gap-4 text-xs">
                  {/* Like first */}
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{idea.votes || 0}</span>
                  </div>
                  {/* Comment second */}
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{idea.feedbackCount || 0}</span>
                  </div>
                </div>
                {/* Author last */}
                <AuthorLink
                  username={idea.author?.username || 'Anonymous'}
                  avatar={idea.author?.avatar}
                  isAnonymous={idea.isAnonymous || !idea.author}
                  showAvatar={false}
                  className="text-xs text-gray-500 font-mono hover:text-white transition-colors"
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-12 border-t border-white/10" />
    </div>
  );
};
