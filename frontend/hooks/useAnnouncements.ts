"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import { useAppStore } from "../lib/store";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { featureFlags } from "../lib/featureFlags";
import { queryKeys } from "../lib/query-keys";
import { useDebouncedCallback } from "./useDebounce";

export interface Announcement {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: string;
  actionUrl?: string;
  actionLabel?: string;
  priority: "low" | "normal" | "high" | "urgent";
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export function useAnnouncements() {
  const userId = useAppStore((state) => state.user?.id || "");
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);
  const queryKey = useMemo(() => queryKeys.announcements(userId), [userId]);

  const announcementsQuery = useQuery({
    queryKey,
    enabled: Boolean(userId),
    queryFn: async ({ signal }) => {
      const response = await apiClient.getAnnouncements(signal);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch announcements");
      }
      return (response.data || []) as Announcement[];
    },
  });

  const fetchAnnouncements = useCallback(
    () => announcementsQuery.refetch(),
    [announcementsQuery.refetch],
  );

  const markAsRead = useCallback(
    async (announcementId: string) => {
      const response = await apiClient.markAnnouncementRead(announcementId);
      if (!response.success) return;
      queryClient.setQueryData<Announcement[]>(queryKey, (current = []) =>
        current.map((announcement) =>
          announcement.id === announcementId
            ? { ...announcement, isRead: true }
            : announcement,
        ),
      );
    },
    [queryClient, queryKey],
  );

  const dismissAnnouncement = useCallback(
    async (announcementId: string) => {
      const response = await apiClient.dismissAnnouncement(announcementId);
      if (!response.success) return;
      queryClient.setQueryData<Announcement[]>(queryKey, (current = []) =>
        current.filter((announcement) => announcement.id !== announcementId),
      );
    },
    [queryClient, queryKey],
  );

  const invalidateAnnouncements = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);
  const refreshFromRealtime = useDebouncedCallback(invalidateAnnouncements, 500);

  useEffect(() => {
    if (featureFlags.disableRealtime || !userId) return;

    const subscriptionUserId = session?.user?.id || userId;
    const channel = supabase
      .channel(`announcements:${subscriptionUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_announcements",
          filter: `user_id=eq.${subscriptionUserId}`,
        },
        refreshFromRealtime,
      )
      .subscribe();

    subscriptionRef.current = channel;
    return () => {
      if (subscriptionRef.current === channel) {
        subscriptionRef.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [refreshFromRealtime, session?.user?.id, userId]);

  const announcements = announcementsQuery.data || [];
  return {
    announcements,
    unreadCount: announcements.filter((announcement) => !announcement.isRead).length,
    urgentAnnouncements: announcements.filter(
      (announcement) => announcement.priority === "urgent" || announcement.priority === "high",
    ),
    isLoading: announcementsQuery.isLoading,
    fetchAnnouncements,
    markAsRead,
    dismissAnnouncement,
  };
}
