import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeCommentsProps {
  projectId: string;
  onNewComment?: (comment: any) => void;
  onUpdateComment?: (comment: any) => void;
  onDeleteComment?: (commentId: string) => void;
}

/**
 * Hook to subscribe to realtime comment updates for a specific project
 *
 * Usage:
 * ```ts
 * useRealtimeComments({
 *   projectId: '123',
 *   onNewComment: (comment) => {
 *     setComments(prev => [...prev, comment]);
 *   }
 * });
 * ```
 */
export function useRealtimeComments({
  projectId,
  onNewComment,
  onUpdateComment,
  onDeleteComment,
}: UseRealtimeCommentsProps) {
  useEffect(() => {
    if (!projectId) return;

    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      // Subscribe to comments for this specific project
      channel = supabase
        .channel(`comments-${projectId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'comments',
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            console.log('💬 New comment:', payload.new);
            if (onNewComment) {
              onNewComment(payload.new);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'comments',
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            console.log('✏️ Comment updated:', payload.new);
            if (onUpdateComment) {
              onUpdateComment(payload.new);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'comments',
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            console.log('🗑️ Comment deleted:', payload.old.id);
            if (onDeleteComment) {
              onDeleteComment(payload.old.id);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Subscribed to comments for project ${projectId}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`❌ Failed to subscribe to comments for project ${projectId}`);
          }
        });
    };

    setupRealtimeSubscription();

    // Cleanup subscription on unmount or projectId change
    return () => {
      if (channel) {
        console.log(`🔌 Unsubscribing from comments for project ${projectId}`);
        supabase.removeChannel(channel);
      }
    };
  }, [projectId, onNewComment, onUpdateComment, onDeleteComment]);
}
