"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { toApiError, type ApiError } from "../lib/api-unwrap";
import { buildCommentTree } from "../lib/comment-utils";
import type { Project } from "../lib/types";

export function normalizeProject(raw: any): Project {
  const project = {
    ...raw,
    image: raw.imageUrl || raw.image,
  };
  if (project.comments?.length) {
    project.comments = buildCommentTree(project.comments);
  }
  return project as Project;
}

/**
 * Network owner for project/idea detail. Pass the same routeKey the page uses:
 * - projects/[id]: raw params.id (slug or UUID)
 * - idea/[id]: extractIdFromSlug(...) || slugOrId
 *
 * Do not use keepPreviousData / placeholderData — pages clear selection on
 * route change and trust this query key for hydrate.
 */
export function useProjectDetail(
  routeKey: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.projects.detail(routeKey || ""),
    enabled: Boolean(routeKey) && (options?.enabled ?? true),
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const response = await apiClient.getProject(routeKey!, signal);
      if (!response.success || response.data == null) {
        throw toApiError(response, "Failed to load project");
      }
      return normalizeProject(response.data);
    },
  });
}

export function isBackendUnavailableError(error: unknown): boolean {
  return (error as ApiError)?.errorType === "backend_unavailable";
}
