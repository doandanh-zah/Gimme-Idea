'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { IdeaDetail } from '../../../components/IdeaDetail';
import { useAppStore } from '../../../lib/store';
import { extractIdFromSlug } from '../../../lib/slug-utils';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import BackendMaintenancePlaceholder from '../../../components/BackendMaintenancePlaceholder';

export default function IdeaDetailPage() {
  const params = useParams();
  const [notFound, setNotFound] = useState(false);
  const {
    selectedProject,
    setSelectedProject,
    fetchProjectById,
    isLoading,
    isBackendMaintenance,
    clearBackendMaintenance,
  } = useAppStore();
  const slugOrId = params.id as string;

  // Extract ID prefix from slug (e.g. "my-idea-abc12345" -> "abc12345").
  // Or use the full value if it is already a UUID.
  const ideaId = extractIdFromSlug(slugOrId) || slugOrId;

  useEffect(() => {
    if (ideaId) {
      setNotFound(false);
      clearBackendMaintenance();

      // Clear old project immediately to prevent showing stale data.
      setSelectedProject(null);

      fetchProjectById(ideaId)
        .then((project) => {
          if (project) {
            setSelectedProject(project);
          } else {
            setNotFound(true);
          }
        })
        .catch(() => {
          setNotFound(true);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideaId]);

  if (isBackendMaintenance) {
    return (
      <div className="min-h-screen px-4 sm:px-6 pt-28 sm:pt-32">
        <div className="max-w-5xl mx-auto">
          <BackendMaintenancePlaceholder description="Unable to load idea details because the backend is under maintenance." />
        </div>
      </div>
    );
  }

  if (notFound && !isLoading) {
    return (
      <div className="min-h-screen px-4 sm:px-6 pt-28 sm:pt-32">
        <div className="max-w-5xl mx-auto rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 text-white/90">
          This idea does not exist or has been removed.
        </div>
      </div>
    );
  }

  if (isLoading || !ideaId || !selectedProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner isLoading={true} size="lg" text="Loading idea..." />
      </div>
    );
  }

  return <IdeaDetail />;
}
