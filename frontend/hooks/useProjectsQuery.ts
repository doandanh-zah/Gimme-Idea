'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { normalizeProject } from '../lib/project-normalize';

const PROJECT_LIST_LIMIT = 9;

type ProjectListFilters = {
  type: 'project' | 'idea';
  category?: string;
  search?: string;
  limit?: number;
};

async function fetchProjectPage(filters: ProjectListFilters, offset: number) {
  const limit = filters.limit || PROJECT_LIST_LIMIT;
  const response = await apiClient.getProjects({
    limit,
    offset,
    type: filters.type,
    category: filters.category,
    search: filters.search,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch projects');
  }

  const projects = response.data.map(normalizeProject);

  return {
    projects,
    nextOffset: offset + projects.length,
    hasMore: projects.length >= limit,
  };
}

export function useProjectsQuery(filters: ProjectListFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['projects', filters],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchProjectPage(filters, Number(pageParam || 0)),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextOffset : undefined,
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useProjectDetailQuery(id: string | null, enabled = true) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Missing project id');
      }

      const response = await apiClient.getProject(id);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Project not found');
      }

      return normalizeProject(response.data);
    },
    enabled: enabled && !!id,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
