'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ProjectDetail } from '../../../components/ProjectDetail';
import { useAppStore } from '../../../lib/store';
import { WalletRouteBoundary } from '../../../components/wallet/WalletRouteBoundary';
import { useProjectDetailQuery } from '../../../hooks/useProjectsQuery';

function ProjectDetailSkeleton() {
  return (
    <main className="min-h-screen px-4 pb-16 pt-28 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin text-[#FFD700]" aria-hidden="true" />
          Loading project
        </div>
        <section className="mt-6 border border-white/10 bg-white/[0.03] p-5 sm:p-7">
          <div className="h-4 w-28 animate-pulse bg-white/10" />
          <div className="mt-5 h-10 w-full max-w-2xl animate-pulse bg-white/10" />
          <div className="mt-4 h-4 w-full max-w-3xl animate-pulse bg-white/10" />
          <div className="mt-2 h-4 w-3/4 animate-pulse bg-white/10" />
        </section>
      </div>
    </main>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const selectedProject = useAppStore((state) => state.selectedProject);
  const setSelectedProject = useAppStore((state) => state.setSelectedProject);
  const hydrateProjectDetailFromQuery = useAppStore((state) => state.hydrateProjectDetailFromQuery);
  const slugOrId = params.id as string;
  
  // Just pass the slug directly to backend - it will handle finding by slug or ID
  const projectId = slugOrId;
  const detailQuery = useProjectDetailQuery(projectId, !!projectId);

  useEffect(() => {
    if (projectId) {
      setSelectedProject(null);
    }
  }, [projectId, setSelectedProject]);

  useEffect(() => {
    if (detailQuery.data) {
      hydrateProjectDetailFromQuery(detailQuery.data);
    } else if (detailQuery.isError) {
      router.push('/projects');
    }
  }, [detailQuery.data, detailQuery.isError, hydrateProjectDetailFromQuery, router]);

  // Show loading spinner until project is loaded
  if (detailQuery.isLoading || !projectId || !selectedProject) {
    return <ProjectDetailSkeleton />;
  }

  return (
    <WalletRouteBoundary>
      <ProjectDetail />
    </WalletRouteBoundary>
  );
}
