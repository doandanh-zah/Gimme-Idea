"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

export function useRelatedProjects(ideaId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.relatedProjects(ideaId),
    enabled: enabled && Boolean(ideaId),
    staleTime: 5 * 60_000,
    queryFn: async ({ signal }) => {
      const response = await apiClient.getRelatedProjects(ideaId, signal);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch related projects");
      }
      return response.data;
    },
  });
}
