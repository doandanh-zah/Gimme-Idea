'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { IdeaDetail } from '../../../components/IdeaDetail';
import { useAppStore } from '../../../lib/store';
import { extractIdFromSlug } from '../../../lib/slug-utils';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import BackendMaintenancePlaceholder from '../../../components/BackendMaintenancePlaceholder';
import {
  isBackendUnavailableError,
  useProjectDetail,
} from '../../../hooks/useProjectDetail';

export default function IdeaDetailPage() {
  const params = useParams();
  const {
    selectedProject,
    setSelectedProject,
    hydrateProjectDetail,
    clearBackendMaintenance,
  } = useAppStore();
  const slugOrId = params.id as string;

  // Extract ID prefix from slug (e.g. "my-idea-abc12345" -> "abc12345").
  // Or use the full value if it is already a UUID.
  const routeKey = extractIdFromSlug(slugOrId) || slugOrId;

  const detailQuery = useProjectDetail(routeKey);
  const isMaintenance =
    detailQuery.isError && isBackendUnavailableError(detailQuery.error);
  const [notFound, setNotFound] = useState(false);

  // Clear working copy on route change (prevents painting project A under B)
  useEffect(() => {
    setSelectedProject(null);
    setNotFound(false);
    clearBackendMaintenance();
  }, [routeKey, setSelectedProject, clearBackendMaintenance]);

  // Trust active RQ key: hydrate on success for this query only
  useEffect(() => {
    if (!detailQuery.isSuccess || !detailQuery.data) return;
    hydrateProjectDetail(detailQuery.data);
  }, [detailQuery.isSuccess, detailQuery.data, hydrateProjectDetail]);

  useEffect(() => {
    if (
      detailQuery.isError &&
      !isBackendUnavailableError(detailQuery.error)
    ) {
      setNotFound(true);
    }
  }, [detailQuery.isError, detailQuery.error]);

  if (isMaintenance) {
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
      <div className="min-h-screen px-4 sm:px-6 pt-28 sm:pt-32">
        <div className="max-w-5xl mx-auto rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 text-white/90">
          This idea does not exist or has been removed.
        </div>
      </div>
    );
  }

  const showDetail = Boolean(selectedProject) && !detailQuery.isError;
  if (!showDetail || !routeKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner isLoading={true} size="lg" text="Loading idea..." />
      </div>
    );
  }

  return <IdeaDetail />;
}
