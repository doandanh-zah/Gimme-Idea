"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import { FollowUser, FollowStats } from "../lib/types";
import { queryKeys } from "../lib/query-keys";
import { unwrapApi } from "../lib/api-unwrap";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

interface UseFollowOptions {
  targetUserId: string;
  initialStats?: FollowStats;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function useFollow({ targetUserId, initialStats, onFollowChange }: UseFollowOptions) {
  const { user } = useAuth();
  const viewerId = user?.id ?? null;
  const queryClient = useQueryClient();
  const queryKey = queryKeys.profile.follow(targetUserId, viewerId);

  const statsQuery = useQuery({
    queryKey,
    enabled: Boolean(targetUserId),
    // placeholderData (not initialData) so a network fetch still runs
    placeholderData: initialStats,
    staleTime: 30_000,
    queryFn: async ({ signal }) =>
      unwrapApi<FollowStats>(
        await apiClient.getFollowStats(targetUserId, signal),
        "Failed to fetch follow stats"
      ),
  });

  const stats = statsQuery.data ?? null;
  const isFollowing = stats?.isFollowing ?? false;

  const mutation = useMutation({
    mutationFn: async (next: "follow" | "unfollow") => {
      const res =
        next === "follow"
          ? await apiClient.followUser(targetUserId)
          : await apiClient.unfollowUser(targetUserId);
      if (!res.success) {
        throw new Error(res.error || res.message || `Failed to ${next}`);
      }
      return next;
    },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FollowStats>(queryKey);
      const base: FollowStats = previous ?? {
        followersCount: initialStats?.followersCount ?? 0,
        followingCount: initialStats?.followingCount ?? 0,
        isFollowing: false,
        isFollowedBy: initialStats?.isFollowedBy ?? false,
      };
      const following = next === "follow";
      queryClient.setQueryData<FollowStats>(queryKey, {
        ...base,
        isFollowing: following,
        followersCount: Math.max(
          0,
          base.followersCount + (following ? 1 : -1)
        ),
      });
      return { previous };
    },
    onError: (err, _next, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to update follow"
      );
    },
    onSuccess: (next) => {
      toast.success(next === "follow" ? "Followed!" : "Unfollowed");
      onFollowChange?.(next === "follow");
      void queryClient.invalidateQueries({
        queryKey: queryKeys.profile.followLists,
      });
      void queryClient.invalidateQueries({ queryKey });
      if (viewerId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.profile.follow(viewerId, viewerId),
        });
      }
    },
  });

  const toggleFollow = () => {
    if (mutation.isPending) return;
    mutation.mutate(isFollowing ? "unfollow" : "follow");
  };

  return {
    isFollowing,
    isLoading: mutation.isPending || (statsQuery.isLoading && !stats),
    stats,
    follow: () => mutation.mutate("follow"),
    unfollow: () => mutation.mutate("unfollow"),
    toggleFollow,
    refetch: statsQuery.refetch,
  };
}

interface UseFollowListOptions {
  userId: string;
  type: "followers" | "following";
  limit?: number;
}

export function useFollowList({
  userId,
  type,
  limit = 20,
}: UseFollowListOptions) {
  const { user } = useAuth();
  const viewerId = user?.id ?? null;

  const listQuery = useInfiniteQuery({
    queryKey: queryKeys.profile.followList(userId, type, limit, viewerId),
    enabled: Boolean(userId),
    initialPageParam: 0,
    queryFn: async ({ pageParam, signal }) => {
      const fetcher =
        type === "followers" ? apiClient.getFollowers : apiClient.getFollowing;
      const response = await fetcher(
        userId,
        { limit, offset: pageParam },
        signal
      );
      return unwrapApi<FollowUser[]>(response, `Failed to fetch ${type}`);
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === limit
        ? allPages.length * limit
        : undefined,
  });

  const users = listQuery.data?.pages.flat() || [];
  const loadMore = () => {
    if (!listQuery.isFetchingNextPage && listQuery.hasNextPage) {
      void listQuery.fetchNextPage();
    }
  };

  return {
    users,
    isLoading: listQuery.isLoading || listQuery.isFetchingNextPage,
    hasMore: Boolean(listQuery.hasNextPage),
    loadMore,
    refresh: listQuery.refetch,
  };
}
