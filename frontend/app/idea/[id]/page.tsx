'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { IdeaDetail } from '../../../components/IdeaDetail';
import { useAppStore } from '../../../lib/store';
import { extractIdFromSlug } from '../../../lib/slug-utils';
import BackendMaintenancePlaceholder from '../../../components/BackendMaintenancePlaceholder';
import { WalletRouteBoundary } from '../../../components/wallet/WalletRouteBoundary';
import { useProjectDetailQuery } from '../../../hooks/useProjectsQuery';

function IdeaDetailSkeleton() {
  return (
    <main className="min-h-screen px-4 pb-16 pt-28 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin text-[#FFD700]" aria-hidden="true" />
          Loading idea
        </div>
        <section className="mt-6 border border-white/10 bg-white/[0.03] p-5 sm:p-7">
          <div className="h-4 w-24 animate-pulse bg-white/10" />
          <div className="mt-5 h-10 w-full max-w-2xl animate-pulse bg-white/10" />
          <div className="mt-4 h-4 w-full max-w-3xl animate-pulse bg-white/10" />
          <div className="mt-2 h-4 w-2/3 animate-pulse bg-white/10" />
        </section>
      </div>
    </main>
  );
}

export default function IdeaDetailPage() {
  const params = useParams();
  const [notFound, setNotFound] = useState(false);
  const selectedProject = useAppStore((state) => state.selectedProject);
  const setSelectedProject = useAppStore((state) => state.setSelectedProject);
  const hydrateProjectDetailFromQuery = useAppStore((state) => state.hydrateProjectDetailFromQuery);
  const isBackendMaintenance = useAppStore((state) => state.isBackendMaintenance);
  const clearBackendMaintenance = useAppStore((state) => state.clearBackendMaintenance);
  const slugOrId = params.id as string;

  // Extract ID prefix from slug (e.g. "my-idea-abc12345" -> "abc12345").
  // Or use the full value if it is already a UUID.
  const ideaId = extractIdFromSlug(slugOrId) || slugOrId;
  const detailQuery = useProjectDetailQuery(ideaId, !!ideaId);

  useEffect(() => {
    if (ideaId) {
      setNotFound(false);
      clearBackendMaintenance();
      setSelectedProject(null);
    }
  }, [ideaId, clearBackendMaintenance, setSelectedProject]);

  useEffect(() => {
    if (detailQuery.data) {
      hydrateProjectDetailFromQuery(detailQuery.data);
      setNotFound(false);
    } else if (detailQuery.isError) {
      setNotFound(true);
    }
  }, [detailQuery.data, detailQuery.isError, hydrateProjectDetailFromQuery]);

  if (isBackendMaintenance) {
    return (
      <div className="min-h-screen px-4 sm:px-6 pt-28 sm:pt-32">
        <div className="max-w-5xl mx-auto">
          <BackendMaintenancePlaceholder description="Unable to load idea details because the backend is under maintenance." />
        </div>
      </div>
    );
  }

  if (notFound && !detailQuery.isLoading) {
    return (
      <main className="min-h-screen px-4 pb-16 pt-28 text-gray-300 sm:px-6">
        <section className="mx-auto max-w-2xl border border-white/10 bg-white/[0.03] p-6 text-center sm:p-8">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-200" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold text-white">Idea not found</h1>
          <p className="mt-2 text-sm leading-6 text-gray-400">This idea does not exist, moved, or has been removed.</p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Link href="/idea" className="btn-ghost">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to ideas
            </Link>
            <button type="button" onClick={() => void detailQuery.refetch()} className="btn-primary">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (detailQuery.isLoading || !ideaId || !selectedProject) {
    return <IdeaDetailSkeleton />;
  }

  return (
    <WalletRouteBoundary>
      <IdeaDetail />
    </WalletRouteBoundary>
  );
}
