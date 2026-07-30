'use client';

import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Activity, Filter, Lightbulb, Plus, RefreshCw, TrendingUp } from 'lucide-react';

import { ProjectCard } from '../../components/ProjectCard';
import { useAppStore } from '../../lib/store';

const CATEGORIES = [
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
];

function MetricTile({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">{label}</p>
        <Icon className="h-5 w-5 text-[#FFD700]" />
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm text-gray-500">{helper}</p>
    </div>
  );
}

function ProjectSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="min-h-[280px] border border-white/10 bg-white/[0.03] p-5">
          <div className="h-5 w-2/3 animate-pulse bg-white/10" />
          <div className="mt-4 h-4 w-full animate-pulse bg-white/10" />
          <div className="mt-2 h-4 w-4/5 animate-pulse bg-white/10" />
          <div className="mt-8 flex gap-2">
            <div className="h-8 w-20 animate-pulse bg-white/10" />
            <div className="h-8 w-24 animate-pulse bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const projects = useAppStore((state) => state.projects);
  const isLoading = useAppStore((state) => state.isLoading);
  const fetchProjects = useAppStore((state) => state.fetchProjects);
  const openSubmitModal = useAppStore((state) => state.openSubmitModal);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    void fetchProjects({ type: 'project', limit: 50 });
  }, [fetchProjects]);

  const projectCatalog = useMemo(
    () => projects.filter((project) => project.type === 'project'),
    [projects]
  );

  const filteredProjects = useMemo(
    () =>
      projectCatalog.filter((project) => {
        if (filter === 'All') return true;
        return project.category === filter || project.tags.includes(filter);
      }),
    [filter, projectCatalog]
  );

  const activeCount = projectCatalog.filter((project) =>
    ['Devnet', 'Mainnet'].includes(project.stage)
  ).length;
  const openPoolCount = projectCatalog.filter((project) =>
    project.poolStatus === 'pool_open' || project.poolStatus === 'active'
  ).length;
  const feedbackCount = projectCatalog.reduce((total, project) => total + (project.feedbackCount || 0), 0);

  return (
    <main className="relative min-h-screen pb-20 text-gray-300">

      <div className="page-shell page-top">
        <header className="mb-10 border-b border-white/10 pb-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="ui-eyebrow">Project dashboard</p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Explore Projects
              </h1>
              <p className="mt-3 text-base leading-7 text-gray-400">
                Scan submitted Solana projects by category, launch stage, and community signal.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void fetchProjects({ type: 'project', limit: 50 })}
                className="btn-ghost"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => openSubmitModal('project')}
                className="btn-primary"
              >
                <Plus className="h-4 w-4" />
                Submit Project
              </button>
            </div>
          </div>
        </header>

        <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricTile
            label="Projects"
            value={String(projectCatalog.length)}
            helper="Live entries in the project catalog."
            icon={TrendingUp}
          />
          <MetricTile
            label="Active"
            value={String(activeCount)}
            helper="Projects marked Devnet or Mainnet."
            icon={Activity}
          />
          <MetricTile
            label="Feedback"
            value={String(feedbackCount)}
            helper={`${openPoolCount} project pools currently open or active.`}
            icon={Lightbulb}
          />
        </section>

        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
            <Filter className="h-4 w-4" />
            Category
          </div>
          <div className="-mx-4 flex gap-0 overflow-x-auto border-b border-white/10 px-4 sm:mx-0 sm:px-0">
            {CATEGORIES.map((category) => (
              <button
                type="button"
                key={category}
                onClick={() => setFilter(category)}
                className={`ui-tab ${filter === category ? 'ui-tab-active' : ''}`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <div className="mb-4 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-gray-600">
            {isLoading ? 'Loading...' : `${filteredProjects.length} results`}
          </span>
        </div>

        {isLoading ? (
          <ProjectSkeletonGrid />
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-white/10 bg-black/20 px-6 py-16 text-center">
            <Filter className="mx-auto h-8 w-8 text-gray-600" />
            <h2 className="mt-4 text-lg font-semibold text-white">No projects found</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
              Clear the category filter or submit the first project for this segment.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => setFilter('All')} className="btn-ghost">
                Clear filters
              </button>
              <button type="button" onClick={() => openSubmitModal('project')} className="btn-primary">
                <Plus className="h-4 w-4" />
                Submit Project
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
