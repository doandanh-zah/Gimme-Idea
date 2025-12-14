import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export interface HackathonState {
  hackathon: any | null;
  announcements: any[];
  teams: any[];
  userStatus: {
    participant: any | null;
    team: any | null;
  };
  isLoading: boolean;
  error: string | null;
}

export function useHackathon(id: string) {
  const { user } = useAuth();
  const [state, setState] = useState<HackathonState>({
    hackathon: null,
    announcements: [],
    teams: [],
    userStatus: { participant: null, team: null },
    isLoading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Parallel fetch for public data
      const [hackathonRes, announcementsRes, teamsRes] = await Promise.all([
        apiClient.getHackathon(id),
        apiClient.getHackathonAnnouncements(id),
        apiClient.getHackathonTeams(id)
      ]);

      // Normalize Responses (Handle direct data vs {success: true, data: ...})
      const hackathonData = hackathonRes.success === undefined ? hackathonRes : hackathonRes.data;
      const announcementsData = Array.isArray(announcementsRes) ? announcementsRes : (announcementsRes.data || []);
      const teamsData = Array.isArray(teamsRes) ? teamsRes : (teamsRes.data || []);

      if (!hackathonData || !hackathonData.id) {
         throw new Error('Invalid hackathon data');
      }

      let userStatusRes = { participant: null, team: null };
      
      // Fetch user status if logged in
      if (user) {
        const statusResponse: any = await apiClient.getHackathonMyStatus(id);
        // MyStatus endpoint returns explicit object structure, check controller
        if (statusResponse && (statusResponse.participant || statusResponse.team || statusResponse.success)) {
           userStatusRes = statusResponse.data || statusResponse;
        }
      }

      setState({
        hackathon: hackathonData,
        announcements: announcementsData,
        teams: teamsData,
        userStatus: userStatusRes,
        isLoading: false,
        error: null
      });

    } catch (err: any) {
      console.error("Error fetching hackathon:", err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || "Failed to load hackathon data"
      }));
    }
  }, [id, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const refresh = fetchData;

  const register = async () => {
    const res = await apiClient.registerHackathon(id);
    if (res.success) refresh();
    return res;
  };

  const createTeam = async (data: any) => {
    const res = await apiClient.createHackathonTeam(id, data);
    if (res.success) refresh();
    return res;
  };

  const joinTeam = async (teamId: string) => {
    const res = await apiClient.joinHackathonTeam(id, teamId);
    if (res.success) refresh();
    return res;
  };

  const submitProject = async (data: { projectId: string; track: string }) => {
    const res = await apiClient.submitHackathonProject(id, data);
    if (res.success) refresh();
    return res;
  };

  return {
    ...state,
    refresh,
    register,
    createTeam,
    joinTeam,
    submitProject
  };
}
