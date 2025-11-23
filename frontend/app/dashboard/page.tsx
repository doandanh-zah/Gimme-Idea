'use client';

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import { ProjectCard } from '../../components/ProjectCard';
import { useAppStore } from '../../lib/store';
import { Filter, Plus, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { projects, user, isLoading } = useAppStore();
  const [filter, setFilter] = useState('All');

  const categories = ['All', 'DeFi', 'NFT', 'Gaming', 'Infrastructure'];

  return (
    <main className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <div className="pt-28 px-6 max-w-7xl mx-auto">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2">Explore Projects</h1>
            <p className="text-gray-400">Discover the next unicorn on Solana.</p>
          </div>
          
          <div className="flex gap-3">
             <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-mono hover:bg-white/10 transition-colors flex items-center gap-2">
               <Filter className="w-4 h-4" /> Filter
             </button>
             <button className="px-4 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(153,69,255,0.3)]">
               <Plus className="w-4 h-4" /> Submit Project
             </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="glass p-6 rounded-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
               <TrendingUp className="w-16 h-16 text-accent" />
             </div>
             <h3 className="text-gray-400 text-sm font-mono mb-1">Total Value Locked</h3>
             <p className="text-2xl font-bold text-white">$14.2M <span className="text-xs text-success ml-2">+12%</span></p>
           </div>
           <div className="glass p-6 rounded-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
               <Activity className="w-16 h-16 text-primary" />
             </div>
             <h3 className="text-gray-400 text-sm font-mono mb-1">Weekly Feedback</h3>
             <p className="text-2xl font-bold text-white">2,450 <span className="text-xs text-success ml-2">+5%</span></p>
           </div>
           <div className="glass p-6 rounded-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
               <Activity className="w-16 h-16 text-blue-500" />
             </div>
             <h3 className="text-gray-400 text-sm font-mono mb-1">Active Bounties</h3>
             <p className="text-2xl font-bold text-white">84 <span className="text-xs text-gray-500 ml-2">Open</span></p>
           </div>
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap border transition-all ${
                filter === cat 
                  ? 'bg-white text-black border-white font-bold' 
                  : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects
            .filter(p => filter === 'All' || p.category === filter)
            .map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>
        
        {projects.length === 0 && (
           <div className="text-center py-20">
             <p className="text-gray-500">No projects found in this category.</p>
           </div>
        )}
      </div>
    </main>
  );
}
