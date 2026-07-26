"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { queryKeys } from "../lib/query-keys";

/**
 * Clears viewer-scoped React Query caches when the auth identity changes
 * (login / logout / account switch). Lives under QueryProvider so it can
 * use useQueryClient without exporting a singleton client.
 */
export function AuthQueryCacheBridge() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const nextId = user?.id ?? null;
    const prevId = prevUserIdRef.current;

    // Skip first mount (undefined → current); only clear on real transitions
    if (prevId !== undefined && prevId !== nextId) {
      void queryClient.removeQueries({ queryKey: ["profile", "follow"] });
      void queryClient.removeQueries({
        queryKey: queryKeys.profile.followLists,
      });
      void queryClient.removeQueries({ queryKey: ["feeds", "detail"] });
    }

    prevUserIdRef.current = nextId;
  }, [user?.id, queryClient]);

  return null;
}
