# Pass Report - Phase 3: Realtime & Egress Discipline

Date: 2026-07-20; updated 2026-07-26
Branch / commit: main / 68afd91 + working tree changes
Author: Codex

## Metrics

| Metric | Phase 0 | Phase 3 |
|--------|---------|---------|
| Realtime default | implicit/global flag only | global off + per-channel opt-in |
| Next build `/idea` First Load JS | 524 kB | 238 kB |

## Evidence

- Channel registry added in `frontend/lib/realtime/registry.ts`.
- Channel matrix documented in `docs/perf/realtime-channel-matrix.md`.
- Realtime now requires `NEXT_PUBLIC_ENABLE_REALTIME=true`, not disabled by `NEXT_PUBLIC_DISABLE_REALTIME`, and a named channel flag.
- Updated hooks: projects, comments, notifications, team invites, announcements.
- Final logged-out browser egress proof: [summary](../browser-evidence/2026-07-26T09-43-28Z/summary.md).
- `/idea` idle for 180000 ms produced 0 WebSockets, 0 Supabase realtime WebSockets, and 0 repeated fetch/XHR URLs.
- HAR and NDJSON artifacts are attached as `network-idea-logged-out.har` and `network-idea-logged-out.ndjson`.

## Checklist

- [x] Realtime default safe/off.
- [x] Per-channel flags implemented.
- [x] Dev lifecycle logging added for subscribe/unsubscribe.
- [x] Comments remain detail-scoped.
- [x] HAR proof for idle 3 min logged out captured.
- [ ] HAR proof for idle 3 min logged in captured.
- [ ] Realtime-enabled channel matrix browser proof captured.

## Residual Risks

- Logged-out local egress is browser/HAR verified.
- Logged-in realtime-off and realtime-on matrix proof still require an authenticated test account and environment flags for the named channels.
