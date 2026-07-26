# Overnight implementation report — PLAN_ID a78a487a

**Branch:** `fix/rq-follow-hardening-a78a487a`  
**Design:** `docs/design-rq-follow-hardening.md`  
**Date:** 2026-07-26

## What was implemented (careful in-place, not parallel worktrees)

Existing WIP (partial React Query migration) was kept on this branch and fixed in-order so we would not lose uncommitted work.

### PR1 — Follow backend OptionalAuth
- `OptionalAuthGuard` on `GET follow-stats`, `followers`, `following`
- Registered in `UsersModule`
- Logged-in JWT now attaches `request.user` so `isFollowing` can be true

### PR2 — Follow frontend + Profile SSoT
- `viewerKey` + viewer-scoped `queryKeys.profile.follow` / `followList` / `feeds.detail`
- `useFollow`: `useMutation` optimistic + rollback; `placeholderData` not `initialData`; seeds when cache empty
- `useFollowList`: viewer-scoped infinite keys
- Profile: deleted local follower counts + parallel follow query; uses `useFollow` only
- `FollowButton`: removed `onFollowChange`
- `FollowListModal`: correct seed (`isFollowedBy: false`); “Follows you” only on own-profile lists
- `getFollowStats(userId, signal?)`
- `frontend/lib/api-unwrap.ts` (`unwrapApi`, `toApiError`)
- `AuthQueryCacheBridge` clears follow/list/feed-detail caches on login/logout

### PR3 — skipped (optional polish; Profile hooks still inline but follow is fixed)

### PR4 — Project detail hybrid RQ
- `useProjectDetail` + `normalizeProject`
- Store: `hydrateProjectDetail` (list upsert + selection); removed detail TTL maps
- `fetchProjectById` still works for navigate/force-refresh via hydrate
- Idea + projects pages: clear on routeKey change, hydrate on RQ success (slug-safe: trust query key)

### PR5 — Notifications
- Removed dead Zustand `notifications` / `markNotificationRead` / `clearNotifications`
- `useNotifications` reads user from `useAuth`; typed non-standard envelopes

### PR6 — AI search refund
- After reserve, failed paid path refunds in `finally` via `refund_search_usage`
- SQL: `backend/database/migration_refund_search_usage.sql` — **apply on Supabase before refund works in prod**
- Zero-result success still consumes quota

### PR7 — Related Projects empty copy
- Non-uploader empty state explains only uploader can search
- Uploader prompted to run search; filter empty states differentiated

## Ops required tomorrow
1. Run SQL migration `migration_refund_search_usage.sql` on Supabase.
2. Smoke-test follow as logged-in user on another profile (`isFollowing` true when already following).
3. Deep-link `/projects/<slug>` and idea slug routes; A→B navigation (no stale A).
4. Trigger a Tavily failure path and confirm quota refunds (if possible).
5. Optional: commit + open PR(s) from this branch.

## Intentionally not done
- Full hackathon page split (optional PR8)
- AuthStoreSync removal (optional PR9)
- True single-owner project detail for comment/realtime mutations

## Risk notes
- Refund RPC must exist in DB or refund logs errors (searches still burn until migration applied).
- Hybrid project detail still mutates Zustand for comments; that is intentional.
