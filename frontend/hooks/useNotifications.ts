"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "../lib/api-client";
import { Notification } from "../lib/types";
import { useAppStore } from "../lib/store";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { featureFlags } from "../lib/featureFlags";

export function useNotifications() {
  const user = useAppStore((state) => state.user);
  const { session } = useAuth(); // Get Supabase session for realtime auth
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const subscriptionRef = useRef<any>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(
    async (limit = 20, offset = 0) => {
      if (!user) return;

      setIsLoading(true);
      try {
        const response = await apiClient.getNotifications({ limit, offset });
        // API returns { success, notifications } directly, not wrapped in data
        if (response.success) {
          const notifs = (response as any).notifications || [];
          if (offset === 0) {
            setNotifications(notifs);
          } else {
            setNotifications((prev) => [...prev, ...notifs]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const response = await apiClient.getUnreadNotificationCount();
      // API returns { success, unreadCount } directly
      if (response.success) {
        setUnreadCount((response as any).unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, [user]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiClient.markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, []);

  // Delete single notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        await apiClient.deleteNotification(notificationId);
        const notification = notifications.find((n) => n.id === notificationId);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        if (notification && !notification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error("Failed to delete notification:", error);
      }
    },
    [notifications]
  );

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      await apiClient.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  }, []);

  // Get navigation path for notification
  const getNotificationPath = useCallback(
    (notification: Notification): string => {
      switch (notification.type) {
        case "follow":
          // Go to follower's profile
          return notification.actorId
            ? `/profile/${notification.actorId}`
            : "/";

        case "new_post":
        case "comment":
        case "comment_reply":
        case "like":
        case "comment_like":
        case "donation":
          // Go to the project/idea
          if (notification.targetType === "project" && notification.targetId) {
            return `/idea/${notification.targetId}`;
          }
          return "/";

        case "mention":
          if (notification.targetType === "project" && notification.targetId) {
            return `/idea/${notification.targetId}`;
          }
          return "/";

        default:
          return "/";
      }
    },
    []
  );

  // Setup realtime subscription
  useEffect(() => {
    if (featureFlags.disableRealtime) {
      // No realtime + no polling: just do a one-time fetch.
      fetchNotifications();
      fetchUnreadCount();
      return;
    }

    // Need both user (for API calls) and session (for realtime auth)
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchNotifications();
    fetchUnreadCount();

    // Use Supabase session user ID for realtime subscription if available
    // This ensures the subscription filter matches the RLS policy (auth.uid())
    const subscriptionUserId = session?.user?.id || user.id;
    console.log(
      "[Notifications] Setting up realtime for user:",
      subscriptionUserId,
      "session:",
      !!session
    );

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`notifications:${subscriptionUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${subscriptionUserId}`,
        },
        (payload) => {
          console.log("[Notifications] Realtime INSERT received:", payload);
          // Refetch to get full notification with actor info
          fetchNotifications();
          fetchUnreadCount();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${subscriptionUserId}`,
        },
        (payload) => {
          console.log("[Notifications] Realtime UPDATE received:", payload);
          // Update local state
          const updated = payload.new as any;
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updated.id ? { ...n, read: updated.read } : n
            )
          );
          if (updated.read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${subscriptionUserId}`,
        },
        (payload) => {
          console.log("[Notifications] Realtime DELETE received:", payload);
          const deleted = payload.old as any;
          setNotifications((prev) => prev.filter((n) => n.id !== deleted.id));
        }
      )
      .subscribe((status) => {
        console.log("[Notifications] Subscription status:", status);
      });

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user?.id, session?.user?.id, fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    getNotificationPath,
  };
}
