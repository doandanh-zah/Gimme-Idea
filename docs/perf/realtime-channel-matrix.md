# Realtime Channel Matrix

Implemented in `frontend/lib/realtime/registry.ts`.

Realtime requires both:

- `NEXT_PUBLIC_ENABLE_REALTIME=true`
- `NEXT_PUBLIC_DISABLE_REALTIME` not set to `true`

Each channel then requires its own named opt-in flag.

| Channel | Env flag | When allowed | When forbidden |
|---------|----------|--------------|----------------|
| `notifications:{userId}` | `NEXT_PUBLIC_ENABLE_REALTIME_NOTIFICATIONS=true` | Logged-in user plus notifications UI | Logged out or flag disabled |
| `team_invites:{userId}` | `NEXT_PUBLIC_ENABLE_REALTIME_TEAM_INVITES=true` | Logged-in user plus relevant invite surfaces | Logged out, invites unused, or flag disabled |
| `announcements:{userId}` | `NEXT_PUBLIC_ENABLE_REALTIME_ANNOUNCEMENTS=true` | Logged-in user plus announcements UI | Guest or flag disabled |
| `comments-{projectId}` | `NEXT_PUBLIC_ENABLE_REALTIME_COMMENTS=true` | Idea/project detail for the current id only | List pages or flag disabled |
| `projects-realtime` | `NEXT_PUBLIC_ENABLE_REALTIME_PROJECTS=true` | Explicit product opt-in for live global feed | Default idea/project lists |

## Egress Notes

- Default `.env.example` is safe/off for global realtime and every named channel.
- With default env, hooks still do one-time API fetches where needed but do not call `supabase.channel`.
- Lifecycle logging is dev-only by default and can be forced with `NEXT_PUBLIC_DEBUG_REALTIME=true`.
- `useRealtimeProjects` remains mounted by `Dashboard`, but the global projects channel is blocked unless `NEXT_PUBLIC_ENABLE_REALTIME_PROJECTS=true`.
