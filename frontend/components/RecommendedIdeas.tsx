'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ThumbsUp, MessageCircle, User } from 'lucide-react';
import { Project } from '../lib/types';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { createUniqueSlug } from '../lib/slug-utils';
import { LoadingSpinner } from './LoadingSpinner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const createSummary = (problem?: string, solution?: string): string => {
  if (!problem && !solution) return 'No description available';
  const cleanProblem = problem?.replace(/[#*_`]/g, '').trim() || '';
  const cleanSolution = solution?.replace(/[#*_`]/g, '').trim() || '';
  const getFirstPart = (text: string, maxLen = 60) => {
    const firstSentence = text.split(/[.!?]/)[0];
    if (firstSentence.length <= maxLen) return firstSentence;
    return text.substring(0, maxLen).trim() + '...';
  };
  const shortProblem = getFirstPart(cleanProblem, 50);
  const shortSolution = getFirstPart(cleanSolution, 50);
  if (shortProblem && shortSolution) return `${shortProblem} → ${shortSolution}`;
  return shortProblem || shortSolution || 'No description available';
};

export const RecommendedIdeas = () => {
  const [recommendedIdeas, setRecommendedIdeas] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const router = useRouter();

  const categories = [
    'All',
    'DeFi',
    'NFT',
    'Gaming',
    'Infrastructure',
    'DAO',
    'DePIN',
    'Social',
    'Mobile',
    'Security',
    'Payment',
    'Developer Tooling',
    'ReFi',
    'Content',
    'Dapp',
    'Blinks',
  ];

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
        <div className="ui-eyebrow mb-4">Featured</div>
        <LoadingSpinner isLoading={true} size="md" text="Loading recommendations..." />
      </div>
    );
  }

  if (recommendedIdeas.length === 0) return null;

  const ranks = [
    { num: '01', label: 'Top pick', color: '#FFD700' },
    { num: '02', label: 'Runner-up', color: '#C0C0C0' },
    { num: '03', label: 'Rising', color: '#CD7F32' },
  ];

  return (
    <section className="mb-12">
      <div className="flex items-end justify-between gap-4 mb-5 pb-3 border-b border-white/10">
        <div>
          <div className="ui-eyebrow mb-2">Leaderboard</div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Top 3 of <span className="text-[#FFD700]">{selectedCategory}</span>
          </h2>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            className="btn-ghost !min-h-[36px] !px-3 !text-xs font-mono"
          >
            {selectedCategory}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCategoryMenu ? 'rotate-180' : ''}`} />
          </button>
          {showCategoryMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0a] border border-white/10 z-50 max-h-72 overflow-y-auto">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setShowCategoryMenu(false);
                    setIsLoading(true);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs font-mono hover:bg-white/5 ${
                    selectedCategory === cat ? 'text-[#FFD700]' : 'text-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {recommendedIdeas.map((idea, index) => {
          const rank = ranks[index] || ranks[2];
          const summary = createSummary(idea.problem, idea.solution);

          return (
            <article
              key={idea.id}
              role="button"
              tabIndex={0}
              onClick={() => handleViewIdea(idea)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleViewIdea(idea);
                }
              }}
              className="rank-card group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FFD700]"
              style={{ borderTop: `2px solid ${rank.color}` }}
            >
              <span className="rank-card-num" style={{ WebkitTextStrokeColor: `${rank.color}55` }}>
                {rank.num}
              </span>

              <div className="relative z-[1] flex flex-col flex-1">
                <span
                  className="font-mono text-[10px] tracking-[0.14em] uppercase mb-3"
                  style={{ color: rank.color }}
                >
                  {rank.label}
                </span>

                <span className="font-mono text-[10px] tracking-wider uppercase text-gray-500 mb-2">
                  {idea.category}
                </span>

                <h3 className="font-display text-lg font-semibold tracking-tight text-white group-hover:text-[#FFD700] transition-colors line-clamp-2 mb-2 pr-12">
                  {idea.title}
                </h3>

                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1 mb-4">
                  {summary}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-sm bg-gradient-to-br from-[#9945FF] to-[#14F195] overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {idea.author?.avatar ? (
                        <img src={idea.author.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500 font-mono truncate">
                      {idea.author?.username || 'Anonymous'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-500 font-mono tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {idea.votes || 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {idea.feedbackCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
