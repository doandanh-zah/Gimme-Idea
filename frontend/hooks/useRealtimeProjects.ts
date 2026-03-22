import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { featureFlags } from "../lib/featureFlags";

interface UseRealtimeProjectsProps {
  onNewProject?: (project: any) => void;
  onUpdateProject?: (project: any) => void;
  onDeleteProject?: (projectId: string) => void;
}

/**
 * Hook to subscribe to realtime project updates from Supabase
 * Uses refs to prevent re-subscribing when callbacks change
 */
export function useRealtimeProjects({
  onNewProject,
  onUpdateProject,
  onDeleteProject,
}: UseRealtimeProjectsProps = {}) {
  // Use refs to store callbacks to prevent re-subscribing on every render
  const onNewProjectRef = useRef(onNewProject);
  const onUpdateProjectRef = useRef(onUpdateProject);
  const onDeleteProjectRef = useRef(onDeleteProject);

  // Keep refs for last call time to implement throttling within the callbacks
  const lastNewProjectCallRef = useRef<number>(0);
  const lastUpdateProjectCallRef = useRef<number>(0);
  const lastDeleteProjectCallRef = useRef<number>(0);
  const throttleDelayMs = 500; // Throttle to prevent cascade on tab focus

  // Update refs when callbacks change
  useEffect(() => {
    onNewProjectRef.current = onNewProject;
    onUpdateProjectRef.current = onUpdateProject;
    onDeleteProjectRef.current = onDeleteProject;
  }, [onNewProject, onUpdateProject, onDeleteProject]);

  useEffect(() => {
    if (featureFlags.disableRealtime) return;

    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      // Subscribe to projects table changes
      channel = supabase
        .channel("projects-realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "projects",
          },
          (payload) => {
            // Throttle to prevent cascade of callbacks on tab focus (Supabase reconnection)
            const now = Date.now();
            if (now - lastNewProjectCallRef.current >= throttleDelayMs) {
              lastNewProjectCallRef.current = now;
              if (onNewProjectRef.current) {
                onNewProjectRef.current(payload.new);
              }
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "projects",
          },
          (payload) => {
            // Throttle to prevent cascade of callbacks on tab focus
            const now = Date.now();
            if (now - lastUpdateProjectCallRef.current >= throttleDelayMs) {
              lastUpdateProjectCallRef.current = now;
              if (onUpdateProjectRef.current) {
                onUpdateProjectRef.current(payload.new);
              }
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "projects",
          },
          (payload) => {
            // Throttle to prevent cascade of callbacks on tab focus
            const now = Date.now();
            if (now - lastDeleteProjectCallRef.current >= throttleDelayMs) {
              lastDeleteProjectCallRef.current = now;
              if (onDeleteProjectRef.current) {
                onDeleteProjectRef.current(payload.old.id);
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR") {
            console.error("Failed to subscribe to projects realtime");
          }
        });
    };

    setupRealtimeSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []); // Empty dependency array - only subscribe once on mount
}
