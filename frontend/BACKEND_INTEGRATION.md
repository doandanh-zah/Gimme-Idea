# Hackathon Feature: Backend Integration Status

> **Status (cleanup Phase 1):** This note is historical. Live hackathon list/detail use API + React Query (`useTeamInvites`, `apiClient` hackathon methods, Nest `hackathons` module). The old `HACKATHONS_MOCK_DATA` module was removed as unused.
>
> Remaining mock **UI stubs** may still exist inside large pages (e.g. local `MOCK_SUBMITTED_IDEAS` in `app/hackathons/[id]/page.tsx`). Treat those as product debt for Phase 2 file splits, not as the primary data source for hackathons.

## What is real today

- Registration, teams, invites, submissions: backend routes under `/api/hackathons/*`
- Frontend detail page is large (~2.4k lines) and mixes real fetches with some local stubs
- Prefer extending API hooks over reintroducing global mock modules

## Follow-up

See `docs/CODE_CLEANUP_PLAN.md` Phase 2 (split `hackathons/[id]/page.tsx`, replace remaining inline mocks).
