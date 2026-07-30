'use client';

import React from 'react';
import { MessageSquare, User, Sparkles, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Project } from '../lib/types';
import { useAppStore } from '../lib/store';
import { createUniqueSlug } from '../lib/slug-utils';
import toast from 'react-hot-toast';

interface IdeaCardProps {
  project: Project;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({ project }) => {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const voteProject = useAppStore((state) => state.voteProject);
  const openConnectReminder = useAppStore((state) => state.openConnectReminder);

  const handleClick = () => {
    // Prefer DB slug; fallback to title+full-UUID so backend can resolve reliably.
    // Bare 8-char prefixes 404 when projects.slug is null.
    const slug = project.slug || createUniqueSlug(project.title || 'idea', project.id);
    router.push(`/idea/${slug}`);
  };

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openConnectReminder();
      return;
    }
    try {
      await voteProject(project.id);
    } catch {
      toast.error('Failed to vote');
    }
  };

  const poolLabel =
    project.poolStatus === 'pool_open'
      ? 'Pool open'
      : project.poolStatus === 'approved_for_pool'
        ? 'Pool ready'
        : project.poolStatus
          ? project.poolStatus.replace(/_/g, ' ')
          : null;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className="idea-row group focus-visible:outline-none"
    >
      {/* Vote column — editorial score box */}
      <button
        type="button"
        onClick={handleVote}
        className="idea-row-votes"
        aria-label={`Vote, currently ${project.votes}`}
      >
        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">Up</span>
        <span className="text-lg font-bold tabular-nums text-white group-hover:text-[#FFD700] transition-colors">
          {project.votes}
        </span>
      </button>

      {/* Main content */}
      <div className="min-w-0 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 idea-row-meta">
          <span className="text-[#FFD700]">{project.category}</span>
          {poolLabel && (
            <>
              <span className="text-white/20">/</span>
              <span
                className={
                  project.poolStatus === 'pool_open' ? 'text-[#14F195]' : 'text-gray-400'
                }
              >
                {poolLabel}
              </span>
            </>
          )}
          {(project as any).aiScore != null && (
            <>
              <span className="text-white/20">/</span>
              <span className="inline-flex items-center gap-1 text-[#FFD700]">
                <Sparkles className="w-3 h-3" />
                {(project as any).aiScore}
              </span>
            </>
          )}
        </div>

        <h3 className="idea-row-title line-clamp-2">{project.title}</h3>

        <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed max-w-2xl">
          {project.description}
        </p>

        <div className="flex items-center gap-2 mt-1">
          <div className="w-5 h-5 rounded-sm bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center overflow-hidden">
            {project.author?.avatar ? (
              <img src={project.author.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-3 h-3 text-white" />
            )}
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {project.author?.username || 'Anonymous'}
          </span>
        </div>
      </div>

      {/* Aside metrics */}
      <div className="idea-row-aside hidden sm:flex flex-col items-end justify-between gap-3 self-stretch min-w-[88px]">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 tabular-nums font-mono">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{project.feedbackCount || 0}</span>
        </div>
        <span className="inline-flex items-center gap-0.5 text-[11px] font-mono uppercase tracking-wider text-gray-600 group-hover:text-[#FFD700] transition-colors">
          Open
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </article>
  );
};
