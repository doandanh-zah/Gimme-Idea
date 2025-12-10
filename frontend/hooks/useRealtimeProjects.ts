import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

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

  // Update refs when callbacks change
  useEffect(() => {
    onNewProjectRef.current = onNewProject;
    onUpdateProjectRef.current = onUpdateProject;
    onDeleteProjectRef.current = onDeleteProject;
  }, [onNewProject, onUpdateProject, onDeleteProject]);

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
            if (onNewProjectRef.current) {
              onNewProjectRef.current(payload.new);
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
            if (onUpdateProjectRef.current) {
              onUpdateProjectRef.current(payload.new);
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
            if (onDeleteProjectRef.current) {
              onDeleteProjectRef.current(payload.old.id);
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
  }, []); // Empty dependency array - only subscribe once on mount
}
