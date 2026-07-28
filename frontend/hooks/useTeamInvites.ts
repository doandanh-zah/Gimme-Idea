"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "../lib/api-client";
import { useAppStore } from "../lib/store";
import { supabase } from "../lib/supabase";
import {
    isRealtimeChannelEnabled,
    logRealtimeLifecycle,
} from "../lib/realtime/registry";

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

const INVITES_CACHE_TTL_MS = 30_000;
const invitesCache = new Map<string, { expiresAt: number; data: TeamInvite[] }>();
const invitesInFlight = new Map<string, Promise<TeamInvite[]>>();

export function useTeamInvites() {
    const userId = useAppStore((state) => state.user?.id);
    const [invites, setInvites] = useState<TeamInvite[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const subscriptionRef = useRef<any>(null);

    // Fetch pending invites
    const fetchInvites = useCallback(async (options?: { force?: boolean }) => {
        if (!userId) return [];

        const cached = invitesCache.get(userId);
        if (!options?.force && cached && cached.expiresAt > Date.now()) {
            setInvites(cached.data);
            return cached.data;
        }

        let request = invitesInFlight.get(userId);
        if (!request) {
            request = apiClient.getMyInvites().then((response) => {
                if (!response.success || !response.data) {
                    throw new Error(response.error || "Failed to fetch team invites");
                }

                const data = response.data;
                invitesCache.set(userId, {
                    expiresAt: Date.now() + INVITES_CACHE_TTL_MS,
                    data,
                });
                return data;
            }).finally(() => {
                invitesInFlight.delete(userId);
            });
            invitesInFlight.set(userId, request);
        }

        setIsLoading(true);
        try {
            const data = await request;
            setInvites(data);
            return data;
        } catch (error) {
            console.error("Failed to fetch team invites:", error);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // Accept invite
    const acceptInvite = useCallback(async (inviteId: string, hackathonId: string) => {
        try {
            const response = await apiClient.acceptInvite(hackathonId, inviteId);
            if (response.success) {
                if (userId) {
                    invitesCache.delete(userId);
                }
                setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
                return { success: true, teamId: response.data?.teamId, hackathonSlug: response.data?.hackathonSlug };
            }
            return { success: false, error: response.error };
        } catch (error: any) {
            console.error("Failed to accept invite:", error);
            return { success: false, error: error.message };
        }
    }, [userId]);

    // Reject invite
    const rejectInvite = useCallback(async (inviteId: string, hackathonId: string) => {
        try {
            const response = await apiClient.rejectInvite(hackathonId, inviteId);
            if (response.success) {
                if (userId) {
                    invitesCache.delete(userId);
                }
                setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
                return { success: true };
            }
            return { success: false, error: response.error };
        } catch (error: any) {
            console.error("Failed to reject invite:", error);
            return { success: false, error: error.message };
        }
    }, [userId]);

    // Setup realtime subscription for new invites
    useEffect(() => {
        if (!userId) {
            setInvites([]);
            return;
        }

        // Always do a one-time fetch.
        fetchInvites();

        // Egress optimization: invite realtime is named-channel opt-in.
        if (!isRealtimeChannelEnabled("teamInvites")) {
            return;
        }

        const channelName = `team_invites:${userId}`;

        // Subscribe to realtime updates
        const channel = supabase
            .channel(channelName)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "hackathon_team_invites",
                    filter: `invitee_id=eq.${userId}`,
                },
                () => {
                    // New invite received - refetch to get full data
                    fetchInvites({ force: true });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "hackathon_team_invites",
                    filter: `invitee_id=eq.${userId}`,
                },
                (payload) => {
                    // Invite updated (accepted/rejected/expired)
                    const updated = payload.new as any;
                    if (updated.status !== "pending") {
                        setInvites((prev) => prev.filter((inv) => inv.id !== updated.id));
                    }
                }
            )
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    logRealtimeLifecycle(channelName, "subscribe");
                } else if (status === "CHANNEL_ERROR") {
                    logRealtimeLifecycle(channelName, "error", { status });
                }
            });

        subscriptionRef.current = channel;

        return () => {
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
                logRealtimeLifecycle(channelName, "unsubscribe");
                subscriptionRef.current = null;
            }
        };
    }, [userId, fetchInvites]);

    return {
        invites,
        inviteCount: invites.length,
        isLoading,
        fetchInvites,
        acceptInvite,
        rejectInvite,
    };
}
