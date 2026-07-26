# Code Cleanup Plan

**Branch base:** `fix/rq-follow-hardening-a78a487a` (or successor)  
**Goal:** Reduce source bloat and dual architecture without product regressions.  
**Rule:** Prefer delete/extract over rewrite. Each phase must stay build-green.

## Diagnosis (measured)

| File | ~Lines | Problem |
|------|--------|---------|
| `frontend/app/admin/page.tsx` | **3895** | God page: admin + futarchy + hackathons |
| `frontend/app/hackathons/[id]/page.tsx` | **2381** | God page: detail + teams + submissions |
| `backend/src/ai/ai.service.ts` | **1821** | Multiple AI features in one service |
| `backend/src/hackathons/hackathons.service.ts` | **1635** | Monolith service |
| `backend/src/admin/admin.service.ts` | **1521** | Monolith service |
| `frontend/components/IdeaDetail.tsx` | **1386** | Detail + comments + AI + related |
| `backend/src/projects/projects.service.ts` | **1344** | List + detail + pools + cache |
| `frontend/lib/api-client.ts` | **1225** | Single bag of all HTTP |
| `frontend/components/Profile.tsx` | **1021** | Profile + wallet + ideas + feeds |
| `frontend/lib/store.ts` | **1015** | SPA nav + projects + comments + realtime |

**Also:**

- Duplicate editor leftovers: `* 2.ts` / `* 2.tsx` (AuthContext, LoginButton, DTOs, …)
- Dead `frontend/lib/mock-hackathons.ts` (no imports; docs lie that hackathons are mock-only)
- Dual identity: `AuthContext` + Zustand `user` + `AuthStoreSync`
- Dual navigation: App Router pages + legacy Zustand `currentView` / `App.tsx`
- Partial RQ vs Zustand dual fetch ownership (partially fixed; list/comments remain)

## Phases

### Phase 1 — Hygiene (SAFE) — **this PR**

No behavior rewrite. Delete proven dead weight.

- [x] Delete `* 2.ts` / `* 2.tsx` duplicates (never imported)
- [x] Delete unused `mock-hackathons.ts`
- [x] Fix stale doc claims about mock hackathons
- [x] Document this plan

**Out of scope for P1:** splitting god files, auth SSoT, store shrink.

### Phase 2 — Frontend structure (MEDIUM risk)

- Split `admin/page.tsx` into tabs/routes (`admin/ideas`, `admin/hackathons`, …)
- Split `hackathons/[id]/page.tsx` into hooks + section components (data first, UI second)
- Extract Profile data hooks (stats/ideas/feeds) — leftover from RQ design PR3
- Carve `IdeaDetail` into Comments / Related / Market / Header sections
- Split `api-client.ts` by domain (`api/projects.ts`, `api/hackathons.ts`, …) with barrel re-export

### Phase 3 — State model (MEDIUM–HIGH)

- Kill or wall-off legacy SPA `currentView` / `App.tsx` if unused by Next routes
- Auth SSoT: hooks read `useAuth()`; shrink Zustand `user` mirror
- Move remaining project-list mutations toward RQ where dual cache still hurts
- Remove `as any` at API boundaries with typed envelopes

### Phase 4 — Backend services (MEDIUM)

- Split `ai.service.ts` (feedback / market / related-search / quota)
- Split `hackathons.service.ts` and `admin.service.ts` by subdomain
- Keep public API routes stable; internal modules only

### Phase 5 — Egress-linked cleanup (optional stack)

Separate from pure “code aesthetics” but often the same files:

- Idea detail fan-out reduction
- Comment pagination
- Admin list caps
- Response size logging

## Phase 1 acceptance

- `tsc --noEmit` green (frontend + backend if deps present)
- No imports of deleted files
- Diff is delete-only (+ this plan / doc fixes)

## What “done” does **not** mean

- Not a full rewrite
- Not deleting features
- Not one PR that touches admin + AI + store at once
