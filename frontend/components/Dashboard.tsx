
'use client';

import { useState, useEffect } from 'react';
import { ProjectCard } from './ProjectCard';
import { useAppStore } from '../lib/store';
import { Filter, Plus, TrendingUp, Activity, X, Lightbulb, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardProps {
    mode: 'project' | 'idea';
}

export default function Dashboard({ mode }: DashboardProps) {
  const { projects, searchQuery, setSearchQuery, openSubmitModal, fetchProjects } = useAppStore();
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects({ type: mode });
  }, [mode, fetchProjects]);

  const categories = ['All', 'DeFi', 'NFT', 'Gaming', 'Infrastructure', 'DAO', 'DePIN', 'Social', 'Mobile', 'Security'];

  // Filter logic
  const filteredProjects = projects.filter(project => {
    const matchesType = project.type === mode;
    const matchesCategory = categoryFilter === 'All' || project.category === categoryFilter;
    const matchesSearch = searchQuery === '' || 
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesType && matchesCategory && matchesSearch;
  });

  const accentColor = mode === 'project' ? '#9945FF' : '#FFD700';
  const accentText = mode === 'project' ? 'text-[#9945FF]' : 'text-[#FFD700]';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-20 relative"
    >
      {/* Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f111a] via-[#13131f] to-[#0f111a]" />
          <div className={`absolute top-[-10%] left-[10%] w-[600px] h-[600px] ${mode === 'project' ? 'bg-purple-900/30' : 'bg-yellow-900/30'} rounded-full blur-[120px] mix-blend-screen`} />
          <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-blue-900/30 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      <div className="pt-32 px-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-display font-bold mb-2 tracking-tight">
              Explore <span className={`text-transparent bg-clip-text bg-gradient-to-r ${mode === 'project' ? 'from-[#9945FF] to-[#7c3aed]' : 'from-[#FFD700] to-[#FDB931]'}`}>
                {mode === 'project' ? 'Projects' : 'Ideas'}
              </span>
            </h1>
            <p className="text-gray-300">
                {mode === 'project' 
                    ? "Discover live protocols and beta dApps." 
                    : "Raw concepts seeking feedback and co-founders."}
            </p>
          </div>
          
          <div className="flex gap-3 flex-wrap">
             <button 
               onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
               className={`px-4 py-2 border rounded-full text-sm font-mono transition-colors flex items-center gap-2 backdrop-blur-md ${showAdvancedFilters ? 'bg-white text-black border-white' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
             >
               <Filter className="w-4 h-4" /> {showAdvancedFilters ? 'Hide Filters' : 'Filter'}
             </button>
             <button 
               onClick={() => openSubmitModal(mode)}
               className={`px-6 py-2 bg-gradient-to-r ${mode === 'project' ? 'from-[#9945FF] to-[#8035e0] text-white' : 'from-[#FFD700] to-[#FDB931] text-black'} rounded-full text-sm font-bold hover:shadow-lg transition-all flex items-center gap-2`}
             >
               {mode === 'project' ? <Rocket className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
               Submit {mode === 'project' ? 'Project' : 'Idea'}
             </button>
          </div>
        </div>

        {/* Stats Row (Simplified) */}
        {!searchQuery && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                    <h3 className="text-gray-400 text-sm font-mono mb-1">Total {mode === 'project' ? 'Value' : 'Ideas'}</h3>
                    <p className="text-3xl font-display font-bold text-white">{mode === 'project' ? '$14.2M' : '1,240'}</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                    <h3 className="text-gray-400 text-sm font-mono mb-1">Weekly Feedback</h3>
                    <p className="text-3xl font-display font-bold text-white">2,450</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                    <h3 className="text-gray-400 text-sm font-mono mb-1">Active Categories</h3>
                    <p className="text-3xl font-display font-bold text-white">8</p>
                </div>
            </div>
        )}

        {/* Search & Categories */}
        {searchQuery && (
            <div className="mb-6 flex items-center gap-2">
                <span className="text-gray-400">Search results for:</span>
                <span className="text-white font-bold">"{searchQuery}"</span>
                <button onClick={() => setSearchQuery('')} className="ml-2 p-1 hover:bg-white/10 rounded-full"><X className="w-4 h-4" /></button>
            </div>
        )}

        <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-5 py-2 rounded-full text-sm whitespace-nowrap border transition-all duration-300 ${
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <ProjectCard project={project} />
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
      </div>
    </motion.div>
  );
}
