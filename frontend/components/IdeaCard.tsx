'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, MessageSquare, User, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Project } from '../lib/types';
import { useAppStore } from '../lib/store';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface IdeaCardProps {
  project: Project;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({ project }) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const { user, voteProject } = useAppStore();
  const { setShowWalletPopup } = useAuth();
  const [isVoting, setIsVoting] = useState(false);
  const [localVotes, setLocalVotes] = useState(project.votes);
  const [hasVoted, setHasVoted] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  const handleClick = () => {
    const slug = project.slug || project.id.substring(0, 8);
    router.push(`/idea/${slug}`);
  };

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      setShowWalletPopup(true);
      return;
    }

    if (isVoting) return;

    setIsVoting(true);
    try {
      await voteProject(project.id);
      const newVoted = !hasVoted;
      setHasVoted(newVoted);
      setLocalVotes(prev => newVoted ? prev + 1 : prev - 1);
      
      if (newVoted) {
        setShowBurst(true);
        setTimeout(() => setShowBurst(false), 600);
      }
    } catch (error) {
      toast.error('Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  const categoryColors: Record<string, string> = {
    'DeFi': 'from-blue-500/20 to-cyan-500/20 text-cyan-400',
    'NFT': 'from-purple-500/20 to-pink-500/20 text-pink-400',
    'Gaming': 'from-green-500/20 to-emerald-500/20 text-emerald-400',
    'DAO': 'from-orange-500/20 to-amber-500/20 text-amber-400',
    'Infrastructure': 'from-gray-500/20 to-slate-500/20 text-slate-400',
    'Social': 'from-rose-500/20 to-red-500/20 text-rose-400',
    'AI': 'from-violet-500/20 to-purple-500/20 text-violet-400',
    'Other': 'from-gray-500/20 to-zinc-500/20 text-zinc-400',
  };

  const categoryColor = categoryColors[project.category] || categoryColors['Other'];

  return (
    <motion.div
      className="relative cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Card Container - Always visible */}
      <div 
        className="relative bg-gradient-to-br from-[#1a1a2e]/95 to-[#0d0d1a]/98 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden transition-all duration-300 h-[220px] flex flex-col"
        style={{
          boxShadow: isHovered 
            ? '0 0 30px rgba(255, 215, 0, 0.3), 0 0 60px rgba(153, 69, 255, 0.2)'
            : '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}
      >
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
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FFD700]/50 to-transparent"
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
              {/* Top border - Gold */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                exit={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent origin-left"
              />
              {/* Bottom border - Purple */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                exit={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#9945FF] to-transparent origin-right"
              />
              {/* Left border */}
              <motion.div
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                exit={{ scaleY: 0, opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="absolute top-0 bottom-0 left-0 w-[2px] bg-gradient-to-b from-[#FFD700] via-transparent to-[#9945FF] origin-top"
              />
              {/* Right border */}
              <motion.div
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                exit={{ scaleY: 0, opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="absolute top-0 bottom-0 right-0 w-[2px] bg-gradient-to-b from-[#FFD700] via-transparent to-[#9945FF] origin-bottom"
              />
            </>
          )}
        </AnimatePresence>

        {/* Card Content */}
        <div className="p-4 relative z-[5] flex flex-col flex-1">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            {/* Category Badge */}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${categoryColor}`}>
              {project.category}
            </span>
            
            {/* AI Score if available */}
            {(project as any).aiScore && (
              <div className="flex items-center gap-1 text-[10px] text-[#FFD700]">
                <Sparkles className="w-3 h-3" />
                <span>{(project as any).aiScore}</span>
              </div>
            )}
          </div>

          {/* Title - White normally, glitch effect on hover */}
          <h3 
            className="font-bold text-base mb-2 line-clamp-2 transition-all duration-300"
            style={{
              color: isHovered ? '#FFD700' : '#ffffff',
              textShadow: isHovered 
                ? '0 0 10px rgba(255, 215, 0, 0.5), 2px 0 #9945FF, -2px 0 #14F195'
                : 'none'
            }}
          >
            {project.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed flex-1">
            {project.description}
          </p>

          {/* Author */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center overflow-hidden">
              {project.author?.avatar ? (
                <img src={project.author.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-3 h-3 text-white" />
              )}
            </div>
            <span className="text-xs text-gray-500">
              {project.author?.username || 'Anonymous'}
            </span>
          </div>

          {/* Footer Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            {/* Vote Button */}
            <button
              onClick={handleVote}
              disabled={isVoting}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                hasVoted 
                  ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30' 
                  : 'bg-white/5 text-gray-400 hover:bg-[#FFD700]/10 hover:text-[#FFD700] border border-white/10 hover:border-[#FFD700]/30'
              }`}
            >
              {/* Burst Effect */}
              <AnimatePresence>
                {showBurst && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 rounded-full bg-[#FFD700]/30"
                  />
                )}
              </AnimatePresence>
              
              <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-[#FFD700]' : ''}`} />
              <span>{localVotes}</span>
            </button>

            {/* Comments Count */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{project.feedbackCount || 0}</span>
            </div>

            {/* Terminal Hint - Only on hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="text-[10px] font-mono text-[#FFD700]/70"
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
