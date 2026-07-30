# Hackathon backend integration

Live hackathon list/detail use the Nest API + React Query (`useTeamInvites`, `apiClient` hackathon methods, `backend/src/hackathons`).

Participant counts use **`hackathon_registrations`** (not a separate `hackathon_participants` table).

Schema SSOT: `supabase/migrations/0001_init.sql`.

## Residual product debt

- Large `app/hackathons/[id]/page.tsx` may still contain local UI stubs — prefer API hooks over reintroducing mock modules.
