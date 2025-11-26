
'use client';

import React, { useState } from 'react';
import { Project } from '../lib/types';
import { MessageSquare, ThumbsUp, Sparkles } from 'lucide-react';
import { useAppStore } from '../lib/store';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { voteProject, navigateToProject, openUserProfile } = useAppStore();
  const [isLiked, setIsLiked] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  const handleVote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLiked) {
        voteProject(project.id);
        setIsLiked(true);
        setShowBurst(true);
        // Reset burst after animation
        setTimeout(() => setShowBurst(false), 800);
        toast.success(`Voted for ${project.title}`);
    }
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      openUserProfile(project.author);
  };

  return (
    <div 
      onClick={() => navigateToProject(project.id)}
      className="bg-[#050505] backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:border-[#9945FF]/50 transition-all duration-300 hover:-translate-y-1 group cursor-pointer flex flex-col h-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(153,69,255,0.15)] relative z-10"
    >
      {/* Image Header */}
      <div className="h-32 w-full bg-gray-900 relative overflow-hidden">
        {project.image ? (
          <img 
            src={project.image} 
            alt={project.title} 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent opacity-90" />
        <div className="absolute top-3 right-3 z-10">
          <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider border backdrop-blur-md shadow-sm ${
            project.stage === 'Mainnet' ? 'bg-success/20 border-success text-success' : 
            project.stage === 'Devnet' ? 'bg-primary/20 border-primary text-primary' : 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
          }`}>
            {project.stage}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow relative z-10">
        <h3 className="text-xl font-bold mb-2 group-hover:text-[#9945FF] transition-colors flex items-center justify-between">
          {project.title}
        </h3>
        
        <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-grow font-light">{project.description}</p>

        {project.bounty && (
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
            <span className="text-xs font-mono text-primary font-bold">FEEDBACK BOUNTY</span>
            <span className="text-sm font-bold text-white">{project.bounty} USDC</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {project.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400 group-hover:border-white/20 transition-colors">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
          <div className="flex gap-4">
            <motion.button 
              onClick={handleVote}
              className={`flex items-center gap-1.5 text-sm transition-colors relative ${isLiked ? 'text-[#ffd700]' : 'text-gray-400 hover:text-white'}`}
              whileTap={{ scale: 0.8 }}
            >
              <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <AnimatePresence mode="wait">
                <motion.span 
                    key={project.votes}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    {project.votes}
                </motion.span>
              </AnimatePresence>
                
                {/* Burst Effect */}
                {showBurst && (
                   <>
                     {[...Array(8)].map((_, i) => (
                       <motion.div
                         key={`burst-${i}`}
                         className="absolute top-1/2 left-0 w-1.5 h-1.5 rounded-full pointer-events-none"
                         style={{ backgroundColor: i % 2 === 0 ? '#ffd700' : '#ffffff' }}
                         initial={{ scale: 0, x: 0, y: 0 }}
                         animate={{ 
                           scale: [1, 0],
                           x: Math.cos(i * 45 * (Math.PI / 180)) * 25,
                           y: Math.sin(i * 45 * (Math.PI / 180)) * 25 - 12,
                         }}
                         transition={{ duration: 0.6, ease: "easeOut" }}
                       />
                     ))}
                     <motion.div 
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: 1, y: -20 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-6 left-0 text-gold font-bold text-xs"
                     >
                        +1
                     </motion.div>
                   </>
                )}
            </motion.button>
            
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <MessageSquare className="w-4 h-4" />
              <span>{project.feedbackCount}</span>
            </div>
          </div>
          <div onClick={handleAuthorClick} className="flex items-center gap-2 text-xs text-gray-500 font-mono hover:text-white transition-colors z-20">
             {project.author?.avatar && (
               <img src={project.author.avatar} alt="avatar" className="w-4 h-4 rounded-full border border-white/10" />
             )}
            <span>{project.author?.username || 'Anon'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
