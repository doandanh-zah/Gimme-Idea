"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import { useAppStore } from "../lib/store";
import { supabase } from "../lib/supabase";
import { featureFlags } from "../lib/featureFlags";
import { queryKeys } from "../lib/query-keys";

export interface TeamInvite {
  id: string;
  teamId: string;
  teamName: string;
  hackathonId: string;
  hackathonSlug?: string;
  inviterId: string;
  inviterName: string;
  inviterAvatar?: string;
  message?: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export function useTeamInvites() {
  const userId = useAppStore((state) => state.user?.id || "");
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);
  const queryKey = useMemo(() => queryKeys.teamInvites(userId), [userId]);

  const invitesQuery = useQuery({
    queryKey,
    enabled: Boolean(userId),
    queryFn: async ({ signal }) => {
      const response = await apiClient.getMyInvites(signal);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch team invites");
      }
      return (response.data || []) as TeamInvite[];
    },
  });

  const acceptInvite = useCallback(
    async (inviteId: string, hackathonId: string) => {
      const response = await apiClient.acceptInvite(hackathonId, inviteId);
      if (!response.success) {
        return { success: false, error: response.error };
      }
      queryClient.setQueryData<TeamInvite[]>(queryKey, (current = []) =>
        current.filter((invite) => invite.id !== inviteId),
      );
      return {
        success: true,
        teamId: response.data?.teamId,
        hackathonSlug: response.data?.hackathonSlug,
      };
    },
    [queryClient, queryKey],
  );

  const rejectInvite = useCallback(
    async (inviteId: string, hackathonId: string) => {
      const response = await apiClient.rejectInvite(hackathonId, inviteId);
      if (!response.success) {
        return { success: false, error: response.error };
      }
      queryClient.setQueryData<TeamInvite[]>(queryKey, (current = []) =>
        current.filter((invite) => invite.id !== inviteId),
      );
      return { success: true };
    },
    [queryClient, queryKey],
  );

  useEffect(() => {
    if (featureFlags.disableRealtime || !userId) return;

    const channel = supabase
      .channel(`team_invites:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hackathon_team_invites",
          filter: `invitee_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    subscriptionRef.current = channel;
    return () => {
      if (subscriptionRef.current === channel) {
        subscriptionRef.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [queryClient, queryKey, userId]);

  return {
    invites: invitesQuery.data || [],
    inviteCount: invitesQuery.data?.length || 0,
    isLoading: invitesQuery.isLoading,
    fetchInvites: invitesQuery.refetch,
    acceptInvite,
    rejectInvite,
  };
}
