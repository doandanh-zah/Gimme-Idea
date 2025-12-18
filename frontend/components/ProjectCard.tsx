'use client';

import React, { useState } from 'react';
import { Project } from '../lib/types';
import { MessageSquare, ThumbsUp, Lightbulb, Rocket, Sparkles } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthorLink } from './AuthorLink';
import { createUniqueSlug } from '../lib/slug-utils';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { user, voteProject, openConnectReminder } = useAppStore();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isIdea = project.type === 'idea';

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      openConnectReminder();
      return;
    }
    
    if (!isLiked) {
      try {
        await voteProject(project.id);
        setIsLiked(true);
        setShowBurst(true);
        setTimeout(() => setShowBurst(false), 800);
        toast.success(`Supported ${project.title}`);
      } catch (error) {
        toast.error('Failed to vote');
      }
    }
  };

  const handleCardClick = () => {
    // Create clean URL slug from title + short ID
    const slug = createUniqueSlug(project.title, project.id);
    const route = isIdea ? `/idea/${slug}` : `/projects/${slug}`;
    router.push(route);
  };

  return (
    <motion.div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative rounded-2xl overflow-hidden cursor-pointer flex flex-col h-full group ${isIdea ? 'glitch-card-idea' : 'glitch-card'}`}
    >
      {/* Glitch border elements for Idea cards */}
      {isIdea && (
        <>
          <div className="glitch-border-left" />
          <div className="glitch-border-right" />
        </>
      )}
      
      {/* Animated scanline - Only on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl z-10"
          >
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,215,0,0.02)_2px,rgba(255,215,0,0.02)_4px)]" />
            <motion.div 
              className="absolute left-0 right-0 h-16 bg-gradient-to-b from-[#FFD700]/10 to-transparent"
              animate={{ top: ['-64px', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Card background - more transparent */}
      <div className="absolute inset-0 bg-[#12131a]/70 backdrop-blur-sm group-hover:bg-[#12131a]/80 transition-all duration-500" />
      
      {/* Subtle golden glow background for Ideas */}
      {isIdea && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/[0.03] via-transparent to-[#FFD700]/[0.02] group-hover:from-[#FFD700]/[0.08] group-hover:to-[#FFD700]/[0.04] transition-all duration-500" />
      )}
      
      {/* Subtle geometric pattern overlay for Ideas */}
      {isIdea && (
        <div 
          className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] pointer-events-none transition-opacity duration-500"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 80%, #FFD700 1px, transparent 1px),
              radial-gradient(circle at 80% 20%, #FFD700 1px, transparent 1px),
              radial-gradient(circle at 40% 40%, #FFD700 0.5px, transparent 0.5px),
              radial-gradient(circle at 60% 60%, #FFD700 0.5px, transparent 0.5px)
            `,
            backgroundSize: '100px 100px, 100px 100px, 50px 50px, 50px 50px',
          }}
        />
      )}
      
      {/* Border with glow effect on hover */}
      <div className={`absolute inset-0 rounded-2xl border transition-all duration-500 ${
        isIdea 
          ? 'border-[#FFD700]/[0.08] group-hover:border-[#FFD700]/40 group-hover:shadow-[0_0_30px_rgba(255,215,0,0.15)]' 
          : 'border-white/[0.06] group-hover:border-purple-500/40 group-hover:shadow-[0_0_30px_rgba(153,69,255,0.15)]'
      }`} />
      
      {/* Inner glow effect on hover */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none ${
        isIdea 
          ? 'shadow-[inset_0_1px_0_rgba(255,215,0,0.2),inset_0_-1px_0_rgba(255,215,0,0.1)]'
          : 'shadow-[inset_0_1px_0_rgba(153,69,255,0.2),inset_0_-1px_0_rgba(153,69,255,0.1)]'
      }`} />

      {/* Visual Header - Only show large banner for Projects */}
      {!isIdea && (
        <div className="h-32 w-full relative overflow-hidden bg-gradient-to-br from-[#0D0D12] to-[#1a1a24] z-10">
          {project.image ? (
            <img 
              src={project.image} 
              alt={project.title} 
              className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Rocket className="w-12 h-12 text-[#9945FF]/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#12131a] via-transparent to-transparent" />
          
          {/* Stage Badge */}
          <div className="absolute top-3 right-3 z-10">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border backdrop-blur-md ${
              project.stage === 'Mainnet' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 
              project.stage === 'Devnet' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 
              'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
            }`}>
              {project.stage}
            </span>
          </div>
        </div>
      )}

      {/* Idea Header (Compact) */}
      {isIdea && (
        <div className="relative px-5 pt-5 pb-2 flex justify-between items-start z-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#FFD700]/10 border border-[#FFD700]/20 group-hover:bg-[#FFD700]/20 group-hover:border-[#FFD700]/40 transition-all duration-500">
            <Lightbulb className="w-5 h-5 text-[#FFD700]" />
          </div>
          
          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider border ${
            project.stage === 'Idea' 
              ? 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400/80' 
              : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400/80'
          }`}>
            {project.stage}
          </span>
        </div>
      )}

      <div className={`relative z-10 p-5 flex flex-col flex-grow ${isIdea ? 'pt-2' : ''}`}>
        {/* Title with Glitch Effect - Only on hover via CSS */}
        <h3 
          className={`glitch-title text-lg font-bold mb-2 line-clamp-2 transition-colors duration-500 ${
            isIdea ? 'text-white group-hover:text-[#FFD700]' : 'text-white group-hover:text-[#9945FF]'
          }`}
          data-text={project.title}
        >
          {project.title}
        </h3>

        <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-grow leading-relaxed group-hover:text-gray-400 transition-colors duration-500">
          {project.description}
        </p>

        {/* Bounty Badge - Only show for projects (not ideas) with bounty > 0 */}
        {!isIdea && project.bounty && project.bounty > 0 && (
          <div className="mb-4 p-3 rounded-xl flex items-center justify-between bg-[#9945FF]/10 border border-[#9945FF]/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-mono text-purple-400 font-bold">BOUNTY</span>
            </div>
            <span className="text-sm font-bold text-white">{project.bounty} USDC</span>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.tags.slice(0, 3).map((tag) => (
            <span 
              key={tag} 
              className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-gray-500 group-hover:bg-white/[0.06] group-hover:text-gray-400 group-hover:border-white/10 transition-all duration-500"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-white/[0.06] group-hover:border-white/10 transition-colors duration-500">
          <div className="flex gap-4">
            {/* Vote Button */}
            <motion.button
              onClick={handleVote}
              className={`flex items-center gap-1.5 text-sm transition-colors duration-300 relative ${
                isLiked ? 'text-[#FFD700]' : 'text-gray-500 hover:text-white'
              }`}
              whileTap={{ scale: 0.9 }}
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
              
              {/* Vote burst effect */}
              {showBurst && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={`burst-${i}`}
                      className="absolute top-1/2 left-2 w-1.5 h-1.5 rounded-full pointer-events-none bg-[#FFD700]"
                      initial={{ scale: 0, x: 0, y: 0 }}
                      animate={{
                        scale: [1, 0],
                        x: Math.cos(i * 45 * (Math.PI / 180)) * 25,
                        y: Math.sin(i * 45 * (Math.PI / 180)) * 25,
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  ))}
                </>
              )}
            </motion.button>
            
            {/* Comments */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500 group-hover:text-gray-400 transition-colors duration-500">
              <MessageSquare className="w-4 h-4" />
              <span>{project.feedbackCount}</span>
            </div>
          </div>

          <AuthorLink
            username={project.author?.username || 'Anonymous'}
            avatar={project.author?.avatar}
            isAnonymous={project.isAnonymous || !project.author}
            showAvatar={true}
            avatarSize="sm"
            className="text-xs font-mono z-20 text-gray-600 hover:text-white transition-colors duration-300"
          />
        </div>
      </div>
    </motion.div>
  );
};
