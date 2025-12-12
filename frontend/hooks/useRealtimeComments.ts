import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeCommentsProps {
  projectId: string;
  onNewComment?: (comment: any) => void;
  onUpdateComment?: (comment: any) => void;
  onDeleteComment?: (commentId: string) => void;
}

/**
 * Hook to subscribe to realtime comment updates for a specific project
 * Uses refs to prevent re-subscribing when callbacks change
 */
export function useRealtimeComments({
  projectId,
  onNewComment,
  onUpdateComment,
  onDeleteComment,
}: UseRealtimeCommentsProps) {
  // Use refs to store callbacks to prevent re-subscribing on every render
  const onNewCommentRef = useRef(onNewComment);
  const onUpdateCommentRef = useRef(onUpdateComment);
  const onDeleteCommentRef = useRef(onDeleteComment);

  // Update refs when callbacks change
  useEffect(() => {
    onNewCommentRef.current = onNewComment;
    onUpdateCommentRef.current = onUpdateComment;
    onDeleteCommentRef.current = onDeleteComment;
  }, [onNewComment, onUpdateComment, onDeleteComment]);

  useEffect(() => {
    if (!projectId) return;

    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      // Subscribe to comments for this specific project
      channel = supabase
        .channel(`comments-${projectId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "comments",
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            if (onNewCommentRef.current) {
              onNewCommentRef.current(payload.new);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "comments",
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            if (onUpdateCommentRef.current) {
              onUpdateCommentRef.current(payload.new);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "comments",
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            if (onDeleteCommentRef.current) {
              onDeleteCommentRef.current(payload.old.id);
            }
          }
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR") {
            console.error(
              `Failed to subscribe to comments for project ${projectId}`
            );
          }
        });
    };

    setupRealtimeSubscription();

    // Cleanup subscription on unmount or projectId change
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [projectId]); // Only re-subscribe when projectId changes
}
