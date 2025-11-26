
'use client';

import { useState, useEffect } from 'react';
import { ProjectCard } from './ProjectCard';
import { useAppStore } from '../lib/store';
import { Filter, Plus, TrendingUp, Activity, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const { projects, setView, searchQuery, setSearchQuery } = useAppStore();
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
    'Security'
  ];

  const stages = ['All', 'Idea', 'Prototype', 'Devnet', 'Mainnet'];

  // Filter logic
  const filteredProjects = projects.filter(project => {
    const matchesCategory = categoryFilter === 'All' || project.category === categoryFilter;
    const matchesStage = stageFilter === 'All' || project.stage === stageFilter;
    const matchesSearch = searchQuery === '' || 
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesStage && matchesSearch;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-20 relative"
    >
      {/* Fixed Background to prevent cut-off during scroll */}
      <div className="fixed inset-0 z-[-1] bg-black bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(153,69,255,0.15),rgba(255,255,255,0)),radial-gradient(circle_at_80%_20%,rgba(255,215,0,0.08),transparent_40%)]" />

      <div className="pt-32 px-6 max-w-7xl mx-auto">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">Explore Projects</h1>
            <p className="text-gray-400">Discover the next unicorn on Solana.</p>
          </div>
          
          <div className="flex gap-3 flex-wrap">
             <button 
               onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
               className={`px-4 py-2 border rounded-full text-sm font-mono transition-colors flex items-center gap-2 ${showAdvancedFilters ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
             >
               <Filter className="w-4 h-4" /> {showAdvancedFilters ? 'Hide Filters' : 'Filter'}
             </button>
             <button 
               onClick={() => setView('upload')}
               className="px-4 py-2 bg-[#9945FF] text-white rounded-full text-sm font-bold hover:bg-[#7c3aed] transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(153,69,255,0.3)]"
             >
               <Plus className="w-4 h-4" /> Submit Project
             </button>
          </div>
        </div>

        {/* Stats Row */}
        {!searchQuery && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass-panel p-6 rounded-xl relative overflow-hidden group border border-white/5 bg-white/[0.02]">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                <TrendingUp className="w-16 h-16 text-accent" />
                </div>
                <h3 className="text-gray-400 text-sm font-mono mb-1">Total Value Locked</h3>
                <p className="text-2xl font-bold text-white">$14.2M <span className="text-xs text-success ml-2">+12%</span></p>
            </div>
            <div className="glass-panel p-6 rounded-xl relative overflow-hidden group border border-white/5 bg-white/[0.02]">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                <Activity className="w-16 h-16 text-primary" />
                </div>
                <h3 className="text-gray-400 text-sm font-mono mb-1">Weekly Feedback</h3>
                <p className="text-2xl font-bold text-white">2,450 <span className="text-xs text-success ml-2">+5%</span></p>
            </div>
            <div className="glass-panel p-6 rounded-xl relative overflow-hidden group border border-white/5 bg-white/[0.02]">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                <Activity className="w-16 h-16 text-blue-500" />
                </div>
                <h3 className="text-gray-400 text-sm font-mono mb-1">Active Bounties</h3>
                <p className="text-2xl font-bold text-white">84 <span className="text-xs text-gray-500 ml-2">Open</span></p>
            </div>
            </div>
        )}

        {/* Search Results Indicator */}
        {searchQuery && (
            <div className="mb-6 flex items-center gap-2">
                <span className="text-gray-400">Search results for:</span>
                <span className="text-white font-bold">"{searchQuery}"</span>
                <button onClick={() => setSearchQuery('')} className="ml-2 p-1 hover:bg-white/10 rounded-full"><X className="w-4 h-4" /></button>
            </div>
        )}

        {/* Categories */}
        <div className="flex overflow-x-auto gap-2 mb-4 pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap border transition-all ${
                categoryFilter === cat 
                  ? 'bg-white text-black border-white font-bold' 
                  : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Advanced Filters (Stages) */}
        <AnimatePresence>
            {showAdvancedFilters && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide items-center">
                         <span className="text-xs font-mono text-gray-500 mr-2 uppercase">Stage:</span>
                        {stages.map(stage => (
                            <button
                            key={stage}
                            onClick={() => setStageFilter(stage)}
                            className={`px-3 py-1 rounded text-xs whitespace-nowrap border transition-all ${
                                stageFilter === stage 
                                ? 'bg-accent/20 text-accent border-accent font-bold' 
                                : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'
                            }`}
                            >
                            {stage}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
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
           <div className="text-center py-20">
             <p className="text-gray-500 text-lg mb-2">No projects found.</p>
             <p className="text-gray-600 text-sm">Try adjusting your filters or search query.</p>
             <button 
                onClick={() => { setCategoryFilter('All'); setStageFilter('All'); setSearchQuery(''); }}
                className="mt-4 text-accent hover:underline"
             >
                Clear all filters
             </button>
           </div>
        )}
      </div>
    </motion.div>
  );
}
