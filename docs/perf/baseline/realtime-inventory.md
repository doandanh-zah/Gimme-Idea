# Realtime Inventory - Phase 0

Effective default: realtime is off unless `NEXT_PUBLIC_ENABLE_REALTIME=true` and `NEXT_PUBLIC_DISABLE_REALTIME` is not true.

| File | Channel | Table | Events | Scope | Gate |
|------|---------|-------|--------|-------|------|
| `frontend/hooks/useRealtimeProjects.ts` | `projects-realtime` | `projects` | INSERT, UPDATE, DELETE | Global projects table | `!featureFlags.disableRealtime` |
| `frontend/hooks/useRealtimeComments.ts` | `comments-${projectId}` | `comments` | INSERT, UPDATE, DELETE | `project_id=eq.${projectId}` | `!featureFlags.disableRealtime` and `projectId` |
| `frontend/hooks/useNotifications.ts` | `notifications:${subscriptionUserId}` | `notifications` | INSERT, UPDATE, DELETE | `user_id=eq.${subscriptionUserId}` | `!featureFlags.disableRealtime` and logged-in user |
| `frontend/hooks/useTeamInvites.ts` | `team_invites:${user.id}` | `hackathon_team_invites` | INSERT, UPDATE | `invitee_id=eq.${user.id}` | `!featureFlags.disableRealtime` and logged-in user |
| `frontend/hooks/useAnnouncements.ts` | `announcements:${subscriptionUserId}` | `user_announcements` | INSERT, UPDATE, DELETE | `user_id=eq.${subscriptionUserId}` | `!featureFlags.disableRealtime` and logged-in user |

## Baseline Observations

- `useRealtimeProjects` is mounted by `frontend/components/Dashboard.tsx`.
- Notifications, team invites, and announcements perform one-time fetches for logged-in users when realtime is disabled.
- `useRealtimeComments` is detail-scoped and removes its channel on unmount or project id change.
