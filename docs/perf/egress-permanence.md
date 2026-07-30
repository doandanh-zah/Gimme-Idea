# Egress permanence checklist

Status: enforced by defaults + CI; production flags must match.

## Defaults (safe)

| Flag | Production default |
|------|--------------------|
| `NEXT_PUBLIC_ENABLE_NOTIFICATIONS` | `false` (no bell API fetch) |
| `NEXT_PUBLIC_ENABLE_REALTIME` | `false` |
| `NEXT_PUBLIC_DISABLE_REALTIME` | `true` (belt) |
| Per-channel `NEXT_PUBLIC_ENABLE_REALTIME_*` | `false` |

**Prod DB (2026-07-30):** truncated `notifications`, `user_announcements`, `audit_logs`, `ai_interactions`. Removed all tables from `supabase_realtime` publication (0 tables published).

See `frontend/lib/realtime/registry.ts` and ADR 0002.

## Code guards

- `npm run guard:imports` — wallet/web3 not on public shell
- `npm run guard:bundle` — bundle budget
- `bash scripts/check-no-junk.sh` — no junk artifacts
- Project list select projection (backend `projects.service` list query)
- Hackathon public list projection + count `head: true` without `*`
- Auth user reads use `AuthService.USER_SELECT` instead of `select('*')`

## Idle budget (logged out `/idea`)

- 0 Supabase Realtime WebSockets when flags off
- 0 repeated XHR loops

Evidence: `docs/perf/browser-evidence/2026-07-26T09-43-28Z/summary.md`

## Still open

- Logged-in HAR matrix (realtime off / on) needs authenticated test account
- Remaining admin/auth `select('*')` paths should keep shrinking
