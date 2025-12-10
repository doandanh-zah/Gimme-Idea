'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProjectDetail } from '../../../components/ProjectDetail';
import { useAppStore } from '../../../lib/store';
import { extractIdFromSlug } from '../../../lib/slug-utils';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedProject, setSelectedProject, fetchProjectById, isLoading } = useAppStore();
  const slugOrId = params.id as string;
  
  // Extract ID from slug (ID is the last 8 chars after final hyphen)
  const projectId = extractIdFromSlug(slugOrId) || slugOrId;

  useEffect(() => {
    if (projectId) {
      // Clear old project immediately to prevent showing wrong data
      setSelectedProject(null);

      // Fetch the project by ID and set it as selected
      fetchProjectById(projectId).then((project) => {
        if (project) {
          setSelectedProject(project);
        } else {
          // If project not found, redirect to projects page
          router.push('/projects');
        }
      }).catch(() => {
        router.push('/projects');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Show loading spinner until project is loaded
  if (isLoading || !projectId || !selectedProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return <ProjectDetail />;
}
