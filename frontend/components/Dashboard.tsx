
'use client';

import { useState, useEffect, useRef } from 'react';
import { ProjectCard } from './ProjectCard';
import { IdeaCard } from './IdeaCard';
import { RecommendedIdeas } from './RecommendedIdeas';
import { useAppStore } from '../lib/store';
import { useRouter } from 'next/navigation';
import { Filter, Plus, TrendingUp, Activity, X, Lightbulb, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeProjects } from '../hooks/useRealtimeProjects';
import { ComingSoonModal } from './ComingSoonModal';
import { AIChatModal } from './AIChatModal';
import { LoadingSpinner } from './LoadingSpinner';

interface DashboardProps {
    mode: 'project' | 'idea';
}

export default function Dashboard({ mode }: DashboardProps) {
  const {
    projects,
    searchQuery,
    setSearchQuery,
    openSubmitModal,
    fetchProjects,
    fetchMoreProjects,
    hasMoreProjects,
    isLoading,
    isLoadingMore,
    handleRealtimeNewProject,
    handleRealtimeUpdateProject,
    handleRealtimeDeleteProject,
  } = useAppStore();
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showOpenPoolsOnly, setShowOpenPoolsOnly] = useState(false);

  // Show coming soon modal for projects mode
  useEffect(() => {
    if (mode === 'project') {
      setShowComingSoon(true);
    }
  }, [mode]);

  // Fetch projects on mount or when mode changes (skip for project mode)
  // Using ref to track if initial fetch was done to prevent double fetching
  const hasFetchedRef = useRef(false);
  const lastModeRef = useRef(mode);
  
  useEffect(() => {
    // Only fetch if mode changed or first mount
    if (mode !== 'project' && (!hasFetchedRef.current || lastModeRef.current !== mode)) {
      hasFetchedRef.current = true;
      lastModeRef.current = mode;
      fetchProjects({ type: mode });
    }
  }, [mode]); // Remove fetchProjects from dependencies to prevent re-fetching

  // Subscribe to realtime project updates
  useRealtimeProjects({
    onNewProject: handleRealtimeNewProject,
    onUpdateProject: handleRealtimeUpdateProject,
    onDeleteProject: handleRealtimeDeleteProject,
  });

  const categories = ['All', 'DeFi', 'NFT', 'Gaming', 'Infrastructure', 'DAO', 'DePIN', 'Social', 'Mobile', 'Security', 'Payment', 'Developer Tooling', 'ReFi', 'Content', 'Dapp', 'Blinks'];

  // Filter logic with improved search (title > description > author name)
  const filteredProjects = projects
    .filter(project => {
      const matchesType = project.type === mode;
      const matchesCategory = categoryFilter === 'All' ||
        project.category === categoryFilter ||
        project.tags.some(tag => tag === categoryFilter);

      const matchesPoolFilter = !showOpenPoolsOnly || (
        project.poolStatus === 'pool_open' && !!project.governanceTreasuryAddress
      );
      
      if (searchQuery === '') return matchesType && matchesCategory && matchesPoolFilter;
      
      const query = searchQuery.toLowerCase();
      const matchesTitle = project.title.toLowerCase().includes(query);
      const matchesDescription = project.description?.toLowerCase().includes(query);
      const matchesAuthor = project.author?.username?.toLowerCase().includes(query);
      const matchesTags = project.tags.some(tag => tag.toLowerCase().includes(query));
      
      const matchesSearch = matchesTitle || matchesDescription || matchesAuthor || matchesTags;
      
      return matchesType && matchesCategory && matchesPoolFilter && matchesSearch;
    })
    .sort((a, b) => {
      // If no search query, keep original order
      if (searchQuery === '') return 0;
      
      const query = searchQuery.toLowerCase();
      
      // Calculate search score (higher = better match)
      const getScore = (project: typeof a) => {
        let score = 0;
        // Priority 1: Title match (highest)
        if (project.title.toLowerCase().includes(query)) {
          score += 100;
          // Bonus for exact start match
          if (project.title.toLowerCase().startsWith(query)) score += 50;
        }
        // Priority 2: Description match
        if (project.description?.toLowerCase().includes(query)) score += 30;
        // Priority 3: Author name match
        if (project.author?.username?.toLowerCase().includes(query)) score += 10;
        // Priority 4: Tags match (lowest)
        if (project.tags.some(tag => tag.toLowerCase().includes(query))) score += 5;
        return score;
      };
      
      return getScore(b) - getScore(a);
    });

  const accentColor = mode === 'project' ? '#9945FF' : '#FFD700';
  const accentText = mode === 'project' ? 'text-[#9945FF]' : 'text-[#FFD700]';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-20 relative"
    >
      <div className="pt-24 sm:pt-32 px-4 sm:px-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold mb-2 tracking-tight">
              Explore <span className={`text-transparent bg-clip-text bg-gradient-to-r ${mode === 'project' ? 'from-[#9945FF] to-[#7c3aed]' : 'from-[#FFD700] to-[#FDB931]'}`}>
                {mode === 'project' ? 'Projects' : 'Ideas'}
              </span>
            </h1>
            <p className="text-gray-300 text-sm sm:text-base">
                {mode === 'project' 
                    ? "Discover live protocols and beta dApps." 
                    : "Raw concepts seeking feedback and co-founders."}
            </p>
          </div>
          
          <div className="flex gap-2 sm:gap-3 flex-wrap">
             {mode === 'idea' && (
               <>
                 <button
                   onClick={() => setShowAIChat(true)}
                   className="px-3 sm:px-4 py-2 border border-[#FFD700]/30 bg-[#FFD700]/10 rounded-full text-xs sm:text-sm font-mono transition-colors flex items-center gap-2 hover:bg-[#FFD700]/20 text-white"
                 >
                   Find by AI
                 </button>
                 <button
                   onClick={() => setShowOpenPoolsOnly((v) => !v)}
                   className={`px-3 sm:px-4 py-2 border rounded-full text-xs sm:text-sm font-mono transition-colors flex items-center gap-2 ${
                     showOpenPoolsOnly
                       ? 'border-green-500/40 bg-green-500/15 text-white'
                       : 'border-white/15 bg-white/5 text-white hover:bg-white/10'
                   }`}
                   title="Show only ideas with an open funding pool"
                 >
                   <Activity className="w-4 h-4" />
                   Pool Open
                 </button>
               </>
             )}
             <button
               onClick={() => openSubmitModal(mode)}
               className={`px-4 sm:px-6 py-2 bg-gradient-to-r ${mode === 'project' ? 'from-[#9945FF] to-[#8035e0] text-white' : 'from-[#FFD700] to-[#FDB931] text-black'} rounded-full text-xs sm:text-sm font-bold hover:shadow-lg transition-all flex items-center gap-2`}
             >
               {mode === 'project' ? <Rocket className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
               <span className="hidden sm:inline">Submit</span> {mode === 'project' ? 'Project' : 'Idea'}
             </button>
          </div>
        </div>

        {/* Recommended Ideas Section (only for ideas mode) */}
        {mode === 'idea' && !searchQuery && (
          <RecommendedIdeas />
        )}

        {/* Search & Categories */}
        {searchQuery && (
            <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-gray-400">Search results for:</span>
                <span className="text-white font-bold">"{searchQuery}"</span>
                <button onClick={() => setSearchQuery('')} className="ml-2 p-1 hover:bg-white/10 rounded-full"><X className="w-4 h-4" /></button>
            </div>
        )}

        <div className="flex overflow-x-auto gap-2 mb-6 sm:mb-10 pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm whitespace-nowrap border transition-all duration-300 ${
                categoryFilter === cat 
                  ? 'bg-white text-black border-white font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                  : 'bg-white/10 text-gray-300 border-white/10 hover:border-white/30 hover:bg-white/20 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <LoadingSpinner 
            isLoading={isLoading} 
            size="lg" 
            text={`Loading ${mode}s...`}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-10 mt-6 sm:mt-10">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{
                    duration: 0.25,
                    delay: index * 0.03,
                    ease: "easeOut"
                  }}
                >
                  {mode === 'idea' ? (
                    <IdeaCard project={project} />
                  ) : (
                    <ProjectCard project={project} />
                  )}
                </motion.div>
              ))}
            </div>

            {filteredProjects.length === 0 && (
               <div className="text-center py-32 bg-white/[0.02] rounded-3xl border border-white/5 mt-8">
                 <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Filter className="w-8 h-8 text-gray-500" />
                 </div>
                 <p className="text-gray-400 text-lg mb-2">No {mode}s found.</p>
                 <button
                    onClick={() => { setCategoryFilter('All'); setSearchQuery(''); }}
                    className={`${accentText} hover:text-white underline underline-offset-4 transition-colors`}
                 >
                    Clear all filters
                 </button>
               </div>
            )}

            {/* Load More Button */}
            {filteredProjects.length > 0 && hasMoreProjects && !searchQuery && categoryFilter === 'All' && (
              <div className="flex justify-center mt-8 sm:mt-10">
                <button
                  onClick={fetchMoreProjects}
                  disabled={isLoadingMore}
                  className="px-5 sm:px-6 py-2 sm:py-2.5 bg-white/5 hover:bg-[#FFD700] border border-white/20 hover:border-[#FFD700] rounded-full text-sm text-white hover:text-black font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
                >
                  {isLoadingMore ? (
                    <>
                      <motion.div
                        className="relative w-4 h-4"
                      >
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-transparent"
                          style={{
                            borderTopColor: '#FFD700',
                            borderRightColor: '#9945FF',
                          }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        />
                      </motion.div>
                      <span className="text-sm">Loading...</span>
                    </>
                  ) : (
                    <>
                      Load More
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Coming Soon Modal for Projects */}
      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => {
          setShowComingSoon(false);
          router.push('/idea');
        }}
      />

      {/* AI Chat Modal for Ideas */}
      <AIChatModal
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
      />
    </motion.div>
  );
}
