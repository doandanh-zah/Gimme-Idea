"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import { Notification } from "../lib/types";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { featureFlags } from "../lib/featureFlags";
import { queryKeys } from "../lib/query-keys";
import { useDebouncedCallback } from "./useDebounce";

const DEFAULT_LIMIT = 20;

/** Notifications API returns a non-standard envelope (fields at top level). */
type NotificationsListBody = {
  success: boolean;
  error?: string;
  notifications?: Notification[];
};
type UnreadCountBody = {
  success: boolean;
  error?: string;
  unreadCount?: number;
};

export function useNotifications() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);
  const userId = user?.id || "";
  const listKey = useMemo(
    () => queryKeys.notifications.list(userId, DEFAULT_LIMIT, 0),
    [userId],
  );
  const unreadKey = useMemo(() => queryKeys.notifications.unread(userId), [userId]);

  const notificationsQuery = useQuery({
    queryKey: listKey,
    enabled: Boolean(userId),
    queryFn: async ({ signal }) => {
      const response = (await apiClient.getNotifications(
        { limit: DEFAULT_LIMIT, offset: 0 },
        signal,
      )) as unknown as NotificationsListBody;
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch notifications");
      }
      return response.notifications || [];
    },
  });

  const unreadQuery = useQuery({
    queryKey: unreadKey,
    enabled: Boolean(userId),
    queryFn: async ({ signal }) => {
      const response = (await apiClient.getUnreadNotificationCount(
        signal,
      )) as unknown as UnreadCountBody;
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch unread count");
      }
      return Number(response.unreadCount || 0);
    },
  });

  const notifications = notificationsQuery.data || [];
  const unreadCount = unreadQuery.data || 0;

  const fetchNotifications = useCallback(
    async (limit = DEFAULT_LIMIT, offset = 0) => {
      if (!userId) return;
      if (limit === DEFAULT_LIMIT && offset === 0) {
        await notificationsQuery.refetch();
        return;
      }

      const response = (await apiClient.getNotifications({
        limit,
        offset,
      })) as unknown as NotificationsListBody;
      if (!response.success) return;
      const incoming = response.notifications || [];
      queryClient.setQueryData<Notification[]>(listKey, (current = []) =>
        offset === 0 ? incoming : [...current, ...incoming],
      );
    },
    [listKey, notificationsQuery.refetch, queryClient, userId],
  );

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    await unreadQuery.refetch();
  }, [unreadQuery.refetch, userId]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const response = await apiClient.markNotificationRead(notificationId);
      if (!response.success) return;

      let wasUnread = false;
      queryClient.setQueryData<Notification[]>(listKey, (current = []) =>
        current.map((notification) => {
          if (notification.id !== notificationId) return notification;
          wasUnread = !notification.read;
          return { ...notification, read: true };
        }),
      );
      if (wasUnread) {
        queryClient.setQueryData<number>(unreadKey, (current = 0) =>
          Math.max(0, current - 1),
        );
      }
    },
    [listKey, queryClient, unreadKey],
  );

  const markAllAsRead = useCallback(async () => {
    const response = await apiClient.markAllNotificationsRead();
    if (!response.success) return;
    queryClient.setQueryData<Notification[]>(listKey, (current = []) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
    queryClient.setQueryData(unreadKey, 0);
  }, [listKey, queryClient, unreadKey]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      const response = await apiClient.deleteNotification(notificationId);
      if (!response.success) return;
      const deleted = notifications.find((notification) => notification.id === notificationId);
      queryClient.setQueryData<Notification[]>(listKey, (current = []) =>
        current.filter((notification) => notification.id !== notificationId),
      );
      if (deleted && !deleted.read) {
        queryClient.setQueryData<number>(unreadKey, (current = 0) =>
          Math.max(0, current - 1),
        );
      }
    },
    [listKey, notifications, queryClient, unreadKey],
  );

  const clearAll = useCallback(async () => {
    const response = await apiClient.clearAllNotifications();
    if (!response.success) return;
    queryClient.setQueryData(listKey, []);
    queryClient.setQueryData(unreadKey, 0);
  }, [listKey, queryClient, unreadKey]);

  const invalidateNotificationQueries = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: listKey });
    void queryClient.invalidateQueries({ queryKey: unreadKey });
  }, [listKey, queryClient, unreadKey]);

  const refreshFromRealtime = useDebouncedCallback(invalidateNotificationQueries, 500);

  useEffect(() => {
    if (featureFlags.disableRealtime || !userId) return;

    const subscriptionUserId = session?.user?.id || userId;
    const channel = supabase
      .channel(`notifications:${subscriptionUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
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

  const getNotificationPath = useCallback((notification: Notification): string => {
    switch (notification.type) {
      case "follow":
        return notification.actorId ? `/profile/${notification.actorId}` : "/";
      case "new_post":
      case "comment":
      case "comment_reply":
      case "like":
      case "comment_like":
      case "donation":
      case "mention":
        return notification.targetType === "project" && notification.targetId
          ? `/idea/${notification.targetId}`
          : "/";
      default:
        return "/";
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading: notificationsQuery.isLoading || unreadQuery.isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    getNotificationPath,
  };
}
