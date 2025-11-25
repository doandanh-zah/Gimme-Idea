import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeProjectsProps {
  onNewProject?: (project: any) => void;
  onUpdateProject?: (project: any) => void;
  onDeleteProject?: (projectId: string) => void;
}

/**
 * Hook to subscribe to realtime project updates from Supabase
 *
 * Usage:
 * ```ts
 * useRealtimeProjects({
 *   onNewProject: (project) => {
 *     setProjects(prev => [project, ...prev]);
 *   }
 * });
 * ```
 */
export function useRealtimeProjects({
  onNewProject,
  onUpdateProject,
  onDeleteProject,
}: UseRealtimeProjectsProps = {}) {
  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      // Subscribe to projects table changes
      channel = supabase
        .channel('projects-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'projects',
          },
          (payload) => {
            console.log('🆕 New project created:', payload.new);
            if (onNewProject) {
              onNewProject(payload.new);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'projects',
          },
          (payload) => {
            console.log('📝 Project updated:', payload.new);
            if (onUpdateProject) {
              onUpdateProject(payload.new);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'projects',
          },
          (payload) => {
            console.log('🗑️ Project deleted:', payload.old.id);
            if (onDeleteProject) {
              onDeleteProject(payload.old.id);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Subscribed to projects realtime updates');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Failed to subscribe to projects');
          }
        });
    };

    setupRealtimeSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        console.log('🔌 Unsubscribing from projects realtime');
        supabase.removeChannel(channel);
      }
    };
  }, [onNewProject, onUpdateProject, onDeleteProject]);
}
