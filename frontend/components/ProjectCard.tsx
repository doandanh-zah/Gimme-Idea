
'use client';

import React, { useState } from 'react';
import { Project } from '../lib/types';
import { MessageSquare, ThumbsUp, EyeOff, Lightbulb, Rocket } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { voteProject, openUserProfile } = useAppStore();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

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

  const handleAuthorClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (project.isAnonymous || !project.author) return;
      openUserProfile(project.author);
  };

  const handleCardClick = () => {
    const route = isIdea ? `/idea/${project.id}` : `/projects/${project.id}`;
    router.push(route);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`border rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 group cursor-pointer flex flex-col h-full relative z-10 ${
        isIdea
          ? 'bg-[#14151C] border-white/[0.06] hover:border-[#FFD700]/25 hover:shadow-[0_0_20px_rgba(255,215,0,0.08)]'
          : 'bg-[#14151C] border-white/[0.06] hover:border-[#9945FF]/25 hover:shadow-[0_0_20px_rgba(153,69,255,0.08)]'
      }`}
    >
      {/* Visual Header - Only show large banner for Projects */}
      {!isIdea && (
        <div className="h-32 w-full relative overflow-hidden bg-gray-900">
            {project.image ? (
            <img 
                src={project.image} 
                alt={project.title} 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
            />
            ) : (
            <div className="w-full h-full flex items-center justify-center">
                <Rocket className="w-12 h-12 text-[#9945FF]/20" />
            </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent opacity-90" />
            
            {/* Stage Badge on Top Right for Projects */}
            <div className="absolute top-3 right-3 z-10">
                <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider border backdrop-blur-md shadow-sm ${
                    project.stage === 'Mainnet' ? 'bg-success/20 border-success text-success' : 
                    project.stage === 'Devnet' ? 'bg-primary/20 border-primary text-primary' : 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
                }`}>
                    {project.stage}
                </span>
            </div>
        </div>
      )}

      {/* Idea Header (Compact) */}
      {isIdea && (
          <div className="px-5 pt-5 pb-2 flex justify-between items-start">
              <div className="w-8 h-8 rounded-full bg-yellow-500/5 border border-yellow-500/10 flex items-center justify-center text-gold/70 transition-colors duration-200">
                  <Lightbulb className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border border-yellow-500/20 text-gold/80 bg-yellow-500/5">
                  {project.stage}
              </span>
          </div>
      )}

      <div className={`p-5 flex flex-col flex-grow relative z-10 ${isIdea ? 'pt-2' : ''}`}>
        <h3 className={`text-lg font-bold mb-2 transition-colors duration-200 line-clamp-2 ${isIdea ? 'group-hover:text-[#FFD700]' : 'group-hover:text-[#9945FF]'}`}>
          {project.title}
        </h3>

        <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">
            {project.description}
        </p>

        {project.bounty && project.bounty > 0 && (
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
            <span className="text-xs font-mono text-primary font-bold">FEEDBACK BOUNTY</span>
            <span className="text-sm font-bold text-white">{project.bounty} USDC</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-gray-500 transition-colors duration-200">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
          <div className="flex gap-4">
            <motion.button
              onClick={handleVote}
              className={`flex items-center gap-1.5 text-sm transition-colors duration-200 relative ${isLiked ? 'text-[#ffd700]' : 'text-gray-400 hover:text-white'}`}
              whileTap={{ scale: 0.9 }}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
              <AnimatePresence mode="wait">
                <motion.span 
                    key={project.votes}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    {project.votes}
                </motion.span>
              </AnimatePresence>
                
                {showBurst && (
                   <>
                     {[...Array(5)].map((_, i) => (
                       <motion.div
                         key={`burst-${i}`}
                         className="absolute top-1/2 left-0 w-1 h-1 rounded-full pointer-events-none bg-[#ffd700]"
                         initial={{ scale: 0, x: 0, y: 0 }}
                         animate={{
                           scale: [1, 0],
                           x: Math.cos(i * 72 * (Math.PI / 180)) * 15,
                           y: Math.sin(i * 72 * (Math.PI / 180)) * 15 - 8,
                         }}
                         transition={{ duration: 0.4, ease: "easeOut" }}
                       />
                     ))}
                   </>
                )}
            </motion.button>
            
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{project.feedbackCount}</span>
            </div>
          </div>

          <div
             onClick={handleAuthorClick}
             className={`flex items-center gap-1.5 text-xs text-gray-500 font-mono transition-colors duration-200 z-20 ${project.isAnonymous ? 'cursor-default' : 'cursor-pointer hover:text-white'}`}
          >
             {project.isAnonymous ? (
                 <>
                    <div className="w-3.5 h-3.5 rounded-full bg-gray-800 flex items-center justify-center border border-white/10">
                        <EyeOff className="w-2 h-2 text-gray-400" />
                    </div>
                    <span>Anonymous</span>
                 </>
             ) : (
                 <>
                    {project.author?.avatar && (
                        <img src={project.author.avatar} alt="avatar" className="w-3.5 h-3.5 rounded-full border border-white/10" />
                    )}
                    <span>{project.author?.username || 'Anon'}</span>
                 </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
