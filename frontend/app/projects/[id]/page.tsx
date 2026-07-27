'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProjectDetail } from '../../../components/ProjectDetail';
import { useAppStore } from '../../../lib/store';
import {
  isBackendUnavailableError,
  useProjectDetail,
} from '../../../hooks/useProjectDetail';
import BackendMaintenancePlaceholder from '../../../components/BackendMaintenancePlaceholder';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const {
    selectedProject,
    setSelectedProject,
    hydrateProjectDetail,
    clearBackendMaintenance,
  } = useAppStore();

  // Pass slug raw — backend resolves by slug or id
  const routeKey = params.id as string;
  const detailQuery = useProjectDetail(routeKey);
  const hardError =
    detailQuery.isError && !detailQuery.data && !detailQuery.isFetching;
  const isMaintenance =
    hardError && isBackendUnavailableError(detailQuery.error);

  useEffect(() => {
    setSelectedProject(null);
    clearBackendMaintenance();
  }, [routeKey, setSelectedProject, clearBackendMaintenance]);

  useEffect(() => {
    if (!detailQuery.data) return;
    hydrateProjectDetail(detailQuery.data);
  }, [detailQuery.data, hydrateProjectDetail]);

  useEffect(() => {
    if (hardError && !isBackendUnavailableError(detailQuery.error)) {
      router.push('/projects');
    }
  }, [hardError, detailQuery.error, router]);

  if (isMaintenance) {
    return (
      <div className="min-h-screen px-4 sm:px-6 pt-28 sm:pt-32">
        <div className="max-w-5xl mx-auto">
          <BackendMaintenancePlaceholder description="Unable to load project details because the backend is under maintenance." />
        </div>
      </div>
    );
  }

  const showDetail = Boolean(selectedProject);
  if (!showDetail || !routeKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return <ProjectDetail />;
}
