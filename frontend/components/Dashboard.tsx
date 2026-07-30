'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ProjectCard } from './ProjectCard';
import { IdeaCard } from './IdeaCard';
import { RecommendedIdeas } from './RecommendedIdeas';
import { useAppStore } from '../lib/store';
import { useRouter } from 'next/navigation';
import { Filter, Activity, X, Lightbulb, Rocket, Loader2 } from 'lucide-react';
import { useRealtimeProjects } from '../hooks/useRealtimeProjects';
import { useProjectsQuery } from '../hooks/useProjectsQuery';
import { ComingSoonModal } from './ComingSoonModal';
import { LoadingSpinner } from './LoadingSpinner';
import BackendMaintenancePlaceholder from './BackendMaintenancePlaceholder';

const AIChatModal = dynamic(
  () => import('./AIChatModal').then((mod) => mod.AIChatModal),
  { ssr: false }
);

interface DashboardProps {
  mode: 'project' | 'idea';
}

export default function Dashboard({ mode }: DashboardProps) {
  const projects = useAppStore((state) => state.projects);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const openSubmitModal = useAppStore((state) => state.openSubmitModal);
  const hydrateProjectsFromQuery = useAppStore((state) => state.hydrateProjectsFromQuery);
  const handleRealtimeNewProject = useAppStore((state) => state.handleRealtimeNewProject);
  const handleRealtimeUpdateProject = useAppStore((state) => state.handleRealtimeUpdateProject);
  const handleRealtimeDeleteProject = useAppStore((state) => state.handleRealtimeDeleteProject);
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showOpenPoolsOnly, setShowOpenPoolsOnly] = useState(false);
  const projectsQuery = useProjectsQuery({ type: mode }, mode !== 'project');
  const queriedProjects = useMemo(
    () => projectsQuery.data?.pages.flatMap((page) => page.projects) || [],
    [projectsQuery.data]
  );
  const isLoading = mode !== 'project' && projectsQuery.isLoading;
  const isLoadingMore = projectsQuery.isFetchingNextPage;
  const hasMoreProjects = Boolean(projectsQuery.hasNextPage);
  const isBackendMaintenance = projectsQuery.isError;

  useEffect(() => {
    if (mode === 'project') {
      setShowComingSoon(true);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== 'project' && projectsQuery.data) {
      hydrateProjectsFromQuery({
        projects: queriedProjects,
        hasMoreProjects,
        projectsOffset: queriedProjects.length,
      });
    }
  }, [mode, projectsQuery.data, queriedProjects, hasMoreProjects, hydrateProjectsFromQuery]);

  useRealtimeProjects({
    onNewProject: handleRealtimeNewProject,
    onUpdateProject: handleRealtimeUpdateProject,
    onDeleteProject: handleRealtimeDeleteProject,
  });

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
    'Security',
    'Payment',
    'Developer Tooling',
    'ReFi',
    'Content',
    'Dapp',
    'Blinks',
  ];

  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) => {
        const matchesType = project.type === mode;
        const matchesCategory =
          categoryFilter === 'All' ||
          project.category === categoryFilter ||
          project.tags.some((tag) => tag === categoryFilter);

        const matchesPoolFilter =
          !showOpenPoolsOnly ||
          ((project.poolStatus === 'pool_open' || project.poolStatus === 'active') &&
            !!project.governanceTreasuryAddress);

        if (searchQuery === '') return matchesType && matchesCategory && matchesPoolFilter;

        const query = searchQuery.toLowerCase();
        const matchesTitle = project.title.toLowerCase().includes(query);
        const matchesDescription = project.description?.toLowerCase().includes(query);
        const matchesAuthor = project.author?.username?.toLowerCase().includes(query);
        const matchesTags = project.tags.some((tag) => tag.toLowerCase().includes(query));

        return (
          matchesType &&
          matchesCategory &&
          matchesPoolFilter &&
          (matchesTitle || matchesDescription || matchesAuthor || matchesTags)
        );
      })
      .sort((a, b) => {
        if (searchQuery === '') return 0;
        const query = searchQuery.toLowerCase();
        const getScore = (project: typeof a) => {
          let score = 0;
          if (project.title.toLowerCase().includes(query)) {
            score += 100;
            if (project.title.toLowerCase().startsWith(query)) score += 50;
          }
          if (project.description?.toLowerCase().includes(query)) score += 30;
          if (project.author?.username?.toLowerCase().includes(query)) score += 10;
          if (project.tags.some((tag) => tag.toLowerCase().includes(query))) score += 5;
          return score;
        };
        return getScore(b) - getScore(a);
      });
  }, [projects, mode, categoryFilter, showOpenPoolsOnly, searchQuery]);

  const accentText = mode === 'project' ? 'text-[#9945FF]' : 'text-[#FFD700]';
  const label = mode === 'project' ? 'Projects' : 'Ideas';

  return (
    <div className="min-h-screen pb-28 relative">
      <div className="page-shell pt-24 sm:pt-28 pb-20">
        {/* Editorial page header */}
        <header className="mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <div className="ui-eyebrow mb-3">Explore / {label}</div>
              <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white">
                {mode === 'project' ? (
                  <>
                    Live <span className="text-[#9945FF]">projects</span>
                  </>
                ) : (
                  <>
                    Raw <span className="text-[#FFD700]">ideas</span>
                  </>
                )}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-500 max-w-md">
                {mode === 'project'
                  ? 'Discover live protocols and beta dApps.'
                  : 'Concepts seeking signal, feedback, and co-founders.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {mode === 'idea' && (
                <>
                  <button type="button" onClick={() => setShowAIChat(true)} className="btn-ghost !min-h-[40px] !px-3 !text-xs">
                    Find by AI
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOpenPoolsOnly((v) => !v)}
                    className={`btn-ghost !min-h-[40px] !px-3 !text-xs ${
                      showOpenPoolsOnly ? '!border-[#14F195]/50 !text-[#14F195]' : ''
                    }`}
                    title="Show only ideas with an open funding pool"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Pool open
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => openSubmitModal(mode)}
                className={
                  mode === 'project'
                    ? 'inline-flex items-center gap-2 min-h-[40px] px-4 text-xs font-bold rounded-sm bg-[#9945FF] text-white hover:bg-[#7c3aed] transition-colors'
                    : 'btn-primary !min-h-[40px] !px-4 !text-xs'
                }
              >
                {mode === 'project' ? <Rocket className="w-3.5 h-3.5" /> : <Lightbulb className="w-3.5 h-3.5" />}
                Submit {mode === 'project' ? 'project' : 'idea'}
              </button>
            </div>
          </div>
        </header>

        {mode === 'idea' && !searchQuery && <RecommendedIdeas />}

        {searchQuery && (
          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm border border-white/10 bg-[#0a0a0a] px-4 py-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Search</span>
            <span className="text-white font-medium">&ldquo;{searchQuery}&rdquo;</span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="ml-auto p-1.5 hover:bg-white/10 rounded-sm text-gray-400"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Underline category tabs */}
        <div className="flex overflow-x-auto gap-0 mb-2 pb-0 border-b border-white/10 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`ui-tab ${categoryFilter === cat ? 'ui-tab-active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between py-3 mb-1">
          <span className="font-mono text-[10px] tracking-widest uppercase text-gray-600">
            {isLoading ? 'Loading…' : `${filteredProjects.length} results`}
          </span>
        </div>

        {isLoading ? (
          <LoadingSpinner isLoading={isLoading} size="lg" text={`Loading ${mode}s...`} />
        ) : isBackendMaintenance ? (
          <BackendMaintenancePlaceholder
            description={`Unable to load ${mode} list because the backend is under maintenance.`}
          />
        ) : (
          <>
            {mode === 'idea' ? (
              <div className="border-t border-white/10">
                {filteredProjects.map((project) => (
                  <IdeaCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}

            {filteredProjects.length === 0 && (
              <div className="text-center py-20 border border-dashed border-white/10 mt-4">
                <Filter className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-3">No {mode}s found.</p>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('All');
                    setSearchQuery('');
                  }}
                  className={`${accentText} text-sm underline underline-offset-4`}
                >
                  Clear filters
                </button>
              </div>
            )}

            {filteredProjects.length > 0 &&
              hasMoreProjects &&
              !searchQuery &&
              categoryFilter === 'All' && (
                <div className="flex justify-center mt-10">
                  <button
                    type="button"
                    onClick={() => {
                      void projectsQuery.fetchNextPage();
                    }}
                    disabled={isLoadingMore}
                    className="btn-ghost disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#FFD700]" />
                        Loading…
                      </>
                    ) : (
                      'Load more'
                    )}
                  </button>
                </div>
              )}
          </>
        )}
      </div>

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => {
          setShowComingSoon(false);
          router.push('/idea');
        }}
      />

      {showAIChat && <AIChatModal isOpen={showAIChat} onClose={() => setShowAIChat(false)} />}
    </div>
  );
}
