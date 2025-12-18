'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Crown, Medal, Award, ThumbsUp, MessageCircle, Sparkles, User } from 'lucide-react';
import { Project } from '../lib/types';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { AuthorLink } from './AuthorLink';
import { createUniqueSlug } from '../lib/slug-utils';
import { LoadingSpinner } from './LoadingSpinner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Medal type
interface MedalType {
  icon: any;
  label: string;
  watermark: string;
  color: string;
  borderColor: string;
  hoverBorder: string;
  hoverShadow: string;
  glowColor: string;
}

// RecommendedCard Component - similar style to IdeaCard but with medal colors
const RecommendedCard = ({ 
  idea, 
  medal, 
  MedalIcon, 
  summary, 
  index, 
  onViewIdea 
}: { 
  idea: Project; 
  medal: MedalType; 
  MedalIcon: any; 
  summary: string; 
  index: number;
  onViewIdea: (idea: Project) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewIdea(idea)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      {/* Card Container */}
      <div 
        className="relative bg-gradient-to-br from-[#1a1a2e]/95 to-[#0d0d1a]/98 backdrop-blur-xl rounded-xl overflow-hidden transition-all duration-300 h-[300px] flex flex-col"
        style={{
          border: `1px solid ${medal.color}30`,
          boxShadow: isHovered 
            ? `0 0 30px ${medal.color}40, 0 0 60px ${medal.color}20`
            : `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 15px ${medal.color}15`
        }}
      >
        {/* Large watermark number */}
        <div 
          className="absolute top-0 right-2 text-[100px] font-black leading-none pointer-events-none select-none transition-opacity duration-300"
          style={{ color: isHovered ? `${medal.color}15` : `${medal.color}08` }}
        >
          {medal.watermark}
        </div>

        {/* Scanline Effect - Only on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
            >
              <div 
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
                }}
              />
              <motion.div
                className="absolute left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(to right, transparent, ${medal.color}80, transparent)` }}
                animate={{ top: ['0%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Glitch Border Effects - Only on hover */}
        <AnimatePresence>
          {isHovered && (
            <>
              {/* Top border */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                exit={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute top-0 left-0 right-0 h-[2px] origin-left"
                style={{ background: `linear-gradient(to right, transparent, ${medal.color}, transparent)` }}
              />
              {/* Bottom border */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                exit={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="absolute bottom-0 left-0 right-0 h-[2px] origin-right"
                style={{ background: `linear-gradient(to right, transparent, ${medal.color}, transparent)` }}
              />
              {/* Left border */}
              <motion.div
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                exit={{ scaleY: 0, opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="absolute top-0 bottom-0 left-0 w-[2px] origin-top"
                style={{ background: `linear-gradient(to bottom, ${medal.color}, transparent, ${medal.color})` }}
              />
              {/* Right border */}
              <motion.div
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                exit={{ scaleY: 0, opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="absolute top-0 bottom-0 right-0 w-[2px] origin-bottom"
                style={{ background: `linear-gradient(to bottom, ${medal.color}, transparent, ${medal.color})` }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Card Content */}
        <div className="p-5 relative z-[5] flex flex-col flex-1">
          {/* Header with medal */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg transition-transform duration-300"
                style={{ 
                  backgroundColor: medal.color,
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                <MedalIcon className="w-5 h-5 text-black" />
              </div>
              <div 
                className="text-base font-bold tracking-tight"
                style={{ color: medal.color }}
              >
                {medal.label}
              </div>
            </div>
            
            <span className="px-2 py-0.5 bg-black/30 border border-white/10 text-gray-400 rounded-full font-mono text-[9px] uppercase">
              {idea.category}
            </span>
          </div>

          {/* Title */}
          <h3 
            className="font-bold text-base mb-2 line-clamp-2 transition-all duration-300"
            style={{
              color: isHovered ? medal.color : '#ffffff',
              textShadow: isHovered 
                ? `0 0 10px ${medal.color}60, 2px 0 ${medal.color}40, -2px 0 ${medal.color}40`
                : 'none'
            }}
          >
            {idea.title}
          </h3>

          {/* Summary */}
          <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed flex-1">
            {summary}
          </p>

          {/* Author */}
          <div className="flex items-center gap-2 mb-3">
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${medal.color}, ${medal.color}80)` }}
            >
              {idea.author?.avatar ? (
                <img src={idea.author.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-3 h-3 text-black" />
              )}
            </div>
            <span className="text-xs text-gray-500">
              {idea.author?.username || 'Anonymous'}
            </span>
          </div>

          {/* Footer Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-gray-400">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{idea.votes || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{idea.feedbackCount || 0}</span>
              </div>
            </div>

            {/* Terminal Hint - Only on hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="text-[10px] font-mono"
                  style={{ color: `${medal.color}90` }}
                >
                  CLICK_TO_VIEW
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

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
        <LoadingSpinner isLoading={true} size="md" text="Loading recommendations..." />
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
            <RecommendedCard 
              key={idea.id}
              idea={idea}
              medal={medal}
              MedalIcon={MedalIcon}
              summary={summary}
              index={index}
              onViewIdea={handleViewIdea}
            />
          );
        })}
      </div>

      <div className="mt-12 border-t border-white/10" />
    </div>
  );
};
