'use client';

import React, { useState } from 'react';
import { Project } from '../lib/types';
import { MessageSquare, ThumbsUp, Lightbulb, Rocket, Sparkles } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { createUniqueSlug } from '../lib/slug-utils';
import { AuthorLink } from './AuthorLink';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { voteProject } = useAppStore();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isIdea = project.type === 'idea';

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
    const slug = createUniqueSlug(project.title, project.id);
    const route = isIdea ? `/idea/${slug}` : `/projects/${slug}`;
    router.push(route);
  };

  const themeColor = isIdea ? '#FFD700' : '#9945FF';
  const themeColorRGB = isIdea ? '255, 215, 0' : '153, 69, 255';

  return (
    <motion.div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="relative rounded-2xl overflow-hidden cursor-pointer flex flex-col h-full group"
      style={{
        background: 'linear-gradient(180deg, rgba(20,21,28,1) 0%, rgba(13,13,18,1) 100%)',
      }}
    >
      {/* Animated Border Gradient */}
      <div 
        className="absolute inset-0 rounded-2xl p-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${themeColor}40, transparent 40%, transparent 60%, ${themeColor}40)`,
        }}
      />
      
      {/* Inner Border */}
      <div 
        className="absolute inset-[1px] rounded-2xl transition-all duration-300"
        style={{
          border: `1px solid rgba(${themeColorRGB}, ${isHovered ? 0.3 : 0.08})`,
          boxShadow: isHovered ? `0 0 40px rgba(${themeColorRGB}, 0.15), inset 0 0 30px rgba(${themeColorRGB}, 0.03)` : 'none',
        }}
      />

      {/* Shimmer Effect on Hover */}
      <div 
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden rounded-2xl`}
      >
        <div 
          className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${themeColorRGB}, 0.08), transparent)`,
          }}
        />
      </div>

      {/* Floating Particles on Hover */}
      <AnimatePresence>
        {isHovered && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-1 h-1 rounded-full pointer-events-none"
                style={{ 
                  backgroundColor: themeColor,
                  left: `${15 + i * 15}%`,
                  bottom: '10%',
                }}
                initial={{ opacity: 0, y: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  y: [-20, -60 - (i * 10)],
                  x: [0, (i % 2 === 0 ? 10 : -10)],
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 1.5 + (i * 0.2),
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Visual Header - Only show large banner for Projects */}
      {!isIdea && (
        <div className="h-32 w-full relative overflow-hidden bg-gradient-to-br from-[#0D0D12] to-[#1a1a24]">
          {project.image ? (
            <motion.img 
              src={project.image} 
              alt={project.title} 
              className="w-full h-full object-cover"
              animate={{ 
                scale: isHovered ? 1.08 : 1,
                opacity: isHovered ? 1 : 0.7,
              }}
              transition={{ duration: 0.5 }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Rocket className="w-12 h-12 text-[#9945FF]/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D12] via-transparent to-transparent" />
          
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
          <motion.div 
            className="w-10 h-10 rounded-xl flex items-center justify-center relative"
            style={{
              background: `linear-gradient(135deg, rgba(${themeColorRGB}, 0.15), rgba(${themeColorRGB}, 0.05))`,
              border: `1px solid rgba(${themeColorRGB}, 0.2)`,
            }}
            animate={{
              boxShadow: isHovered 
                ? `0 0 20px rgba(${themeColorRGB}, 0.3), inset 0 0 10px rgba(${themeColorRGB}, 0.1)` 
                : `0 0 0px rgba(${themeColorRGB}, 0)`,
            }}
          >
            <Lightbulb className="w-5 h-5" style={{ color: themeColor }} />
            {/* Glow ring on hover */}
            <motion.div 
              className="absolute inset-0 rounded-xl"
              animate={{
                boxShadow: isHovered 
                  ? `0 0 15px rgba(${themeColorRGB}, 0.4)` 
                  : `0 0 0px rgba(${themeColorRGB}, 0)`,
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
          
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider border ${
              project.stage === 'Idea' 
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400/90' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400/90'
            }`}>
              {project.stage}
            </span>
          </div>
        </div>
      )}

      <div className={`relative z-10 p-5 flex flex-col flex-grow ${isIdea ? 'pt-2' : ''}`}>
        {/* Title with gradient on hover */}
        <motion.h3 
          className="text-lg font-bold mb-2 line-clamp-2 transition-all duration-300"
          style={{
            color: isHovered ? themeColor : 'white',
            textShadow: isHovered ? `0 0 20px rgba(${themeColorRGB}, 0.3)` : 'none',
          }}
        >
          {project.title}
        </motion.h3>

        <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-grow leading-relaxed">
          {project.description}
        </p>

        {/* Bounty Badge - Only show for projects (not ideas) with bounty > 0 */}
        {!isIdea && project.bounty && project.bounty > 0 && (
          <motion.div 
            className="mb-4 p-3 rounded-xl flex items-center justify-between relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, rgba(153, 69, 255, 0.1), rgba(153, 69, 255, 0.05))`,
              border: '1px solid rgba(153, 69, 255, 0.2)',
            }}
            whileHover={{
              boxShadow: '0 0 20px rgba(153, 69, 255, 0.2)',
            }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-mono text-purple-400 font-bold">BOUNTY</span>
            </div>
            <span className="text-sm font-bold text-white">{project.bounty} USDC</span>
          </motion.div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.tags.slice(0, 3).map((tag, index) => (
            <motion.span 
              key={tag} 
              className="px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all duration-300"
              style={{
                background: isHovered 
                  ? `rgba(${themeColorRGB}, 0.1)` 
                  : 'rgba(255,255,255,0.03)',
                border: isHovered 
                  ? `1px solid rgba(${themeColorRGB}, 0.2)` 
                  : '1px solid rgba(255,255,255,0.08)',
                color: isHovered ? themeColor : 'rgb(156, 163, 175)',
              }}
              initial={false}
              animate={{
                y: isHovered ? -2 : 0,
                transition: { delay: index * 0.05 }
              }}
            >
              {tag}
            </motion.span>
          ))}
        </div>

        {/* Footer */}
        <div 
          className="flex items-center justify-between pt-4 mt-auto relative"
          style={{
            borderTop: `1px solid rgba(${themeColorRGB}, ${isHovered ? 0.2 : 0.08})`,
          }}
        >
          <div className="flex gap-4">
            {/* Vote Button */}
            <motion.button
              onClick={handleVote}
              className="flex items-center gap-1.5 text-sm relative"
              style={{
                color: isLiked ? themeColor : isHovered ? 'white' : 'rgb(156, 163, 175)',
              }}
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
                      className="absolute top-1/2 left-2 w-1.5 h-1.5 rounded-full pointer-events-none"
                      style={{ backgroundColor: themeColor }}
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
            <div 
              className="flex items-center gap-1.5 text-sm transition-colors duration-300"
              style={{ color: isHovered ? 'white' : 'rgb(156, 163, 175)' }}
            >
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
            className="text-xs font-mono z-20 transition-colors duration-300"
          />
        </div>
      </div>
    </motion.div>
  );
};
