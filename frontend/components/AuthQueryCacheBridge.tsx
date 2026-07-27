"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";

/**
 * Clears user-scoped React Query caches when the auth identity changes
 * (login / logout / account switch). Lives under QueryProvider so it can
 * use useQueryClient without exporting a singleton client.
 *
 * Clears broad roots that embed user identity or viewer relationship fields.
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
      const userScopedRoots = [
        ["profile"],
        ["feeds"],
        ["notifications"],
        ["announcements"],
        ["team-invites"],
        ["hackathons", "registration"],
        ["hackathons", "my-team"],
      ] as const;
      for (const queryKey of userScopedRoots) {
        void queryClient.removeQueries({ queryKey: [...queryKey] });
      }
    }

    prevUserIdRef.current = nextId;
  }, [user?.id, queryClient]);

  return null;
}
