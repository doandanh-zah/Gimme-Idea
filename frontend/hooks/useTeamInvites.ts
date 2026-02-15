"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "../lib/api-client";
import { useAppStore } from "../lib/store";
import { supabase } from "../lib/supabase";
import { featureFlags } from "../lib/featureFlags";

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
    const user = useAppStore((state) => state.user);
    const [invites, setInvites] = useState<TeamInvite[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const subscriptionRef = useRef<any>(null);

    // Fetch pending invites
    const fetchInvites = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const response = await apiClient.getMyInvites();
            if (response.success && response.data) {
                setInvites(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch team invites:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Accept invite
    const acceptInvite = useCallback(async (inviteId: string, hackathonId: string) => {
        try {
            const response = await apiClient.acceptInvite(hackathonId, inviteId);
            if (response.success) {
                setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
                return { success: true, teamId: response.data?.teamId, hackathonSlug: response.data?.hackathonSlug };
            }
            return { success: false, error: response.error };
        } catch (error: any) {
            console.error("Failed to accept invite:", error);
            return { success: false, error: error.message };
        }
    }, []);

    // Reject invite
    const rejectInvite = useCallback(async (inviteId: string, hackathonId: string) => {
        try {
            const response = await apiClient.rejectInvite(hackathonId, inviteId);
            if (response.success) {
                setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
                return { success: true };
            }
            return { success: false, error: response.error };
        } catch (error: any) {
            console.error("Failed to reject invite:", error);
            return { success: false, error: error.message };
        }
    }, []);

    // Setup realtime subscription for new invites
    useEffect(() => {
        if (!user?.id) {
            setInvites([]);
            return;
        }

        // Always do a one-time fetch.
        fetchInvites();

        // Egress optimization: disable realtime entirely when flagged.
        if (featureFlags.disableRealtime) {
            return;
        }

        // Subscribe to realtime updates
        const channel = supabase
            .channel(`team_invites:${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "hackathon_team_invites",
                    filter: `invitee_id=eq.${user.id}`,
                },
                () => {
                    // New invite received - refetch to get full data
                    fetchInvites();
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "hackathon_team_invites",
                    filter: `invitee_id=eq.${user.id}`,
                },
                (payload) => {
                    // Invite updated (accepted/rejected/expired)
                    const updated = payload.new as any;
                    if (updated.status !== "pending") {
                        setInvites((prev) => prev.filter((inv) => inv.id !== updated.id));
                    }
                }
            )
            .subscribe();

        subscriptionRef.current = channel;

        return () => {
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
            }
        };
    }, [user?.id, fetchInvites]);

    return {
        invites,
        inviteCount: invites.length,
        isLoading,
        fetchInvites,
        acceptInvite,
        rejectInvite,
    };
}
