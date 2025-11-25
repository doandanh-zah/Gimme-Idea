'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IdeaDetail } from '../../../components/IdeaDetail';
import { useAppStore } from '../../../lib/store';

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setSelectedProject, fetchProjectById, isLoading } = useAppStore();
  const ideaId = params.id as string;

  useEffect(() => {
    if (ideaId) {
      // Fetch the project by ID and set it as selected
      fetchProjectById(ideaId).then((project) => {
        if (project) {
          setSelectedProject(project);
        } else {
          // If project not found, redirect to ideas page
          router.push('/idea');
        }
      }).catch(() => {
        router.push('/idea');
      });
    }
  }, [ideaId, fetchProjectById, setSelectedProject, router]);

  if (isLoading || !ideaId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return <IdeaDetail />;
}
