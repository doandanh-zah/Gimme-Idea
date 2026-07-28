# Pass Report - Phase 4: Data Layer

Date: 2026-07-20; updated 2026-07-26
Branch / commit: main / 68afd91 + working tree changes
Author: Codex

## Metrics

| Metric | Phase 0 | Phase 4 |
|--------|---------|---------|
| Next build `/landing` First Load JS | 885 kB | 383 kB |
| Next build `/idea` First Load JS | 524 kB | 250 kB |

## Evidence

- `QueryProvider` added at the app shell.
- Project list moved to `useInfiniteQuery` with `staleTime: 60_000`.
- Project detail moved to `useProjectDetailQuery` with `staleTime: 30_000`.
- Notifications initial list/count moved to React Query with focus refetch disabled.
- Phase-touched files avoid new full-store `useAppStore()` subscriptions for migrated paths.
- Final browser data revisit proof: [summary](../browser-evidence/2026-07-26T09-43-28Z/summary.md).
- Flow `/idea -> first detail -> /idea` passed with 2 backend API fetch/XHR requests, 1 idea list API request, and 0 repeated idea list API URLs.

## Checklist

- [x] QueryClientProvider installed.
- [x] Project list/detail migrated to React Query.
- [x] Notifications initial fetch migrated to React Query.
- [x] `/idea` remains more than 40% lighter than Phase 0.
- [x] Browser proof for no duplicate list refetch on revisit captured.
- [ ] Vote/comment invalidation behavior manually verified with test user.

## Residual Risks

- Vote/comment invalidation still requires an authenticated test user.
- Some legacy surfaces still use local fetch patterns outside the migrated React Query list/detail path; Phase 6 guard now protects against reintroducing full-store subscriptions in touched paths.
