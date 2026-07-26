# Design: Fix incomplete React Query migration + broken Follow feature

**Repo:** `c:\Dev\Gimme-Idea`  
**Stack:** NestJS backend, Next/React frontend, Zustand store, partial React Query (RQ) adoption  
**Status:** Implementation-ready design (no code in this doc) — rev 4 (slug-safe route identity)  
**Audience:** Engineers implementing the ordered PR plan below

---

## 1. Problem / Goals / Non-goals

### Problem

Local uncommitted work partially migrated data fetching to React Query, but several domains still have dual owners or incorrect auth/cache contracts. The Follow feature is **functionally broken for logged-in viewers**: backend read endpoints never attach JWT identity, so `isFollowing` / relationship fields always resolve as anonymous. The frontend compounds this with viewer-unscoped cache keys, frozen `initialData`, silent mutation no-ops, and triple-written follower counts on Profile.

Separately, the RQ migration is incomplete and dishonest in places: project detail is advertised as client-cache-managed (`NoCacheInterceptor`) but still lives behind Zustand `fetchProjectById` + an in-memory TTL; `queryKeys.projects.detail` is defined and unused; notifications live in both Zustand and RQ; Auth user is dual-homed via `AuthContext` + `AuthStoreSync` → Zustand.

### Goals

1. **Follow correctness** for anonymous and authenticated viewers (`isFollowing`, list seeds, counts).
2. **Honest cache ownership per domain** — finish or explicitly scope RQ migration (no false “one owner” claims where hybrid remains).
3. **Delete dual sources of truth** found in review (follow counts, notifications dead store, parallel detail TTLs).
4. **Simpler codebase** after the work (code judo: remove layers, do not add parallel systems).
5. **Shippable PR plan**: each PR independently reviewable; never leave Follow *more* broken mid-stack than today.

### Non-goals

- Full rewrite of `hackathons/[id]/page.tsx` UI/layout (optional data-hook extraction only; does not block this initiative).
- Product UX redesign beyond fixing empty-state copy (Related Projects non-uploader).
- Migrating *all* Zustand project list / realtime comment / vote mutation paths into RQ in this initiative.
- Unrelated features (billing, admin, agents).
- Replacing AuthContext with Zustand (or vice versa) as a big-bang auth rewrite.

---

## 2. Current State (from code inspection)

### 2.1 Follow backend

| File | Finding |
|------|---------|
| [`backend/src/users/follow.controller.ts`](backend/src/users/follow.controller.ts) | `POST/DELETE :userId/follow` correctly use `AnyAuthGuard` + `PatScopeGuard`. |
| Same | `GET :userId/follow-stats`, `followers`, `following` use `@CurrentUser("userId")` **with no guard**. JWT is never parsed → `request.user` is undefined → `currentUserId` is always `undefined`. |
| [`backend/src/users/follow.service.ts`](backend/src/users/follow.service.ts) | `getFollowStats` correctly branches on `currentUserId` for `isFollowing` / `isFollowedBy`. Service is fine; controller never supplies viewer. |
| Same | List endpoints call `addCurrentUserFollowStatus` only when `currentUserId` is set — so list-row `isFollowing` is always false for logged-in clients today. |
| [`backend/src/users/users.module.ts`](backend/src/users/users.module.ts) | Registers `AuthGuard`, `AnyAuthGuard`, `PatScopeGuard`. **Does not register `OptionalAuthGuard`**. |
| [`backend/src/common/guards/optional-auth.guard.ts`](backend/src/common/guards/optional-auth.guard.ts) | Exists; used by feeds (`FeedsModule` / `FeedsController`) for exactly this pattern (public read + optional relationship fields). |

### 2.2 Follow frontend

| File | Finding |
|------|---------|
| [`frontend/hooks/useFollow.ts`](frontend/hooks/useFollow.ts) | Stats query key = `queryKeys.profile.follow(targetUserId)` — **no viewer**. Login/logout reuses cached `isFollowing`. |
| Same | `useFollowList` uses `queryKeys.profile.followList(userId, type, limit)` — also **no viewer**. |
| Same | `initialData: initialStats` + global `staleTime: 60_000` ([`QueryProvider.tsx`](frontend/providers/QueryProvider.tsx)) freezes list-seeded false values for 60s. |
| Same | On success, `setQueryData(... current ? {...} : current)` — **no-op if cache empty**. |
| Same | Hand-rolled `useState(isLoading)` + imperative `setQueryData`; not `useMutation` (no optimistic rollback). |
| [`frontend/components/FollowButton.tsx`](frontend/components/FollowButton.tsx) | One `useFollow` per row; relies on RQ dedupe by key (keys missing viewer, so wrong dedupe). Reads `user` from Zustand. |
| [`frontend/components/FollowListModal.tsx`](frontend/components/FollowListModal.tsx) | Seeds `initialStats.isFollowedBy` from `user.isFollowingBack`. **Wrong semantic**: `isFollowingBack` is about profile-owner relationship from list RPC, not “does this row user follow the *viewer*”. Viewer `isFollowing` is the only safe seed. |
| [`frontend/components/Profile.tsx`](frontend/components/Profile.tsx) | **Second** follow stats query via `followStatsQuery` on the same one-arg key, plus triple write: `localFollowersCount` / `localFollowingCount` + `useEffect` sync + `handleFollowChange` while `FollowButton`/`useFollow` also mutates cache. |

### 2.3 React Query migration (partial)

| Domain | Owner today | Notes |
|--------|-------------|-------|
| Feeds | RQ | Reference implementation: viewer-scoped keys (`user?.id \|\| 'anonymous'`), invalidate on mutation. |
| Notifications | RQ in [`useNotifications.ts`](frontend/hooks/useNotifications.ts); **dead Zustand** `notifications` / `markNotificationRead` / `clearNotifications` in [`store.ts`](frontend/lib/store.ts) | Navbar uses `useNotifications` only. |
| Announcements / team invites / related projects / hackathon list+detail | RQ | Working. |
| Profile stats / ideas / feeds / follow | Mixed RQ | Follow broken as above; Profile still local counts + parallel follow query. |
| Project **detail load** | Zustand `fetchProjectById` + `PROJECT_DETAIL_TTL_MS` (60s) + module-level request maps | Backend comment on `GET /projects/:id` says client query cache manages freshness + `NoCacheInterceptor`, but client never uses RQ. `queryKeys.projects.detail` **unused**. |
| Project **detail working copy** | Zustand `selectedProject` **and** `projects[]` | **Asymmetry:** `IdeaDetail` reads `selectedProject`; `ProjectDetail` resolves via `projects.find(p => p.id === selectedProjectId)`. Today `fetchProjectById` **upserts into `projects[]`** and returns the project (pages then `setSelectedProject`). Comment/realtime handlers mutate both stores. |
| Project **list** / votes / comments | Zustand + realtime handlers | Out of scope for full RQ migration this initiative. |

### 2.4 Auth identity dual-home

- **Source of truth for login lifecycle:** [`AuthContext.tsx`](frontend/contexts/AuthContext.tsx) (`user` state, session, sign-in/out).
- **Mirror:** [`ClientLayout.tsx`](frontend/app/ClientLayout.tsx) `AuthStoreSync` does `setUser(authUser)` into Zustand on every auth change.
- **Consumers:** Many components still read `useAppStore().user` (`FollowButton`, `Profile`, `Navbar` partial, `useNotifications`, etc.); others use `useAuth()` (`RelatedProjectsModal`, admin, bookmark).
- **QueryClient access:** [`QueryProvider.tsx`](frontend/providers/QueryProvider.tsx) creates client in component `useState` — **no module singleton export**. AuthContext cannot import a client today; `useQueryClient()` only works under the provider tree.

### 2.5 AI search quota (production bug = no refund)

In [`backend/src/ai/ai.service.ts`](backend/src/ai/ai.service.ts) (~1494–1618):

1. `can_user_search_projects` (read-only check)
2. `increment_search_usage` (conditional `UPDATE … AND searches_used < max_searches` — **already race-safe for max**; concurrent callers cannot exceed `max_searches`)
3. Tavily HTTP + DB insert
4. On failure: many paths **return** `{ success: false }` (non-throwing); outer `catch` also returns without refund

**Primary production bug:** after a successful reserve, provider/network/DB failure burns a daily search with **no refund**. The pre-check RPC is redundant with the conditional increment (extra round-trip / small race window for “canSearch then denied”), but it is **not** the main user-facing bug.

Misleading comment in service already claims “Reserve one daily search atomically” while the code still does check + increment separately.

SQL ([`migration_add_related_projects.sql`](backend/database/migration_add_related_projects.sql) ~113–128): `increment_search_usage` returns boolean; no `refund_search_usage`.

### 2.6 God components

- [`frontend/app/hackathons/[id]/page.tsx`](frontend/app/hackathons/[id]/page.tsx): ~2.5k lines; already uses RQ for hackathon detail + team invites; still owns submissions/teams/registration/terminal local state inline.
- [`frontend/components/Profile.tsx`](frontend/components/Profile.tsx): ~1k+ lines; RQ for stats/ideas/feeds/follow but UI + wallet + edit + delete mixed.

### 2.7 Typing / API client

- [`api-client.ts`](frontend/lib/api-client.ts): `ApiResponse<T>` is standard, but notifications methods type nested `{ success; notifications }` while callers use `(response as any).notifications` because `apiFetch` returns raw backend body (not always unwrapped into `.data`).
- Notification controller returns `{ success, notifications }` / `{ success, unreadCount }` **outside** `data` envelope — unlike Follow which returns `ApiResponse` with `.data`.
- `getFollowStats(userId)` does **not** accept `AbortSignal` today (unlike `getFollowers` / `getProject`).
- No shared `unwrapApi` helper; each hook reimplements throw-on-error.

### 2.8 Related Projects empty state

[`RelatedProjectsModal.tsx`](frontend/components/RelatedProjectsModal.tsx): empty AI matches copy says “Try another source filter or run a fresh search” for **everyone**. Non-uploaders cannot run paid search (enforced client toast + backend author check). Community pin empty state invites “Add the first…” even though only uploader can pin.

### 2.9 Project navigation / maintenance / route params

- `navigateToProject` in [`store.ts`](frontend/lib/store.ts) calls `fetchProjectById`.
- Idea/project pages depend on `isBackendMaintenance` set inside that fetch path when `errorType === 'backend_unavailable'`.
- Comment/AI refresh paths call `fetchProjectById(id, { force: true })`.
- Current idea/project pages clear selection before fetch (`setSelectedProject(null)`) to avoid showing stale content.
- **Route params are heterogeneous:**
  - [`projects/[id]/page.tsx`](frontend/app/projects/[id]/page.tsx): raw `params.id` (human **slug** or UUID); backend `findOne` resolves by slug or id.
  - [`idea/[id]/page.tsx`](frontend/app/idea/[id]/page.tsx): `extractIdFromSlug(slugOrId) || slugOrId` ([`slug-utils.ts`](frontend/lib/slug-utils.ts)) — 8-char hex suffix → prefix; otherwise full slug/id.
  - Loaded `Project` has UUID `id` and optional `slug` field ([`types.ts`](frontend/lib/types.ts)).

---

## 3. Proposed Design (by subsystem)

### 3.1 Follow backend — optional auth on relationship reads

**Pattern to copy:** Feeds (`OptionalAuthGuard` + `@CurrentUser('userId')`).

**Changes:**

1. Register `OptionalAuthGuard` in `UsersModule.providers`.
2. On `FollowController`:
   - `@Get(':userId/follow-stats')` → `@UseGuards(OptionalAuthGuard)`
   - `@Get(':userId/followers')` → `@UseGuards(OptionalAuthGuard)`
   - `@Get(':userId/following')` → `@UseGuards(OptionalAuthGuard)`
3. Leave write routes on `AnyAuthGuard` + PAT scope.
4. Leave `is-following/:targetId` and `mutuals` public without viewer (**default: no change**).
5. No service logic change required if controller passes `currentUserId` correctly.

**Contract (unchanged response shape):**

```ts
// GET /api/users/:userId/follow-stats
// Authorization: Bearer optional
{
  success: true,
  data: {
    followersCount: number,
    followingCount: number,
    isFollowing: boolean,   // viewer → target; false if anonymous or self
    isFollowedBy: boolean,  // target → viewer; false if anonymous or self
  }
}

// GET /api/users/:userId/followers|following
// data: FollowUser[] with isFollowing = whether *viewer* follows that row user
```

**Semantic clarification (document in DTO comments):**

| Field | Meaning |
|-------|---------|
| `FollowStats.isFollowing` | Viewer follows target profile |
| `FollowStats.isFollowedBy` | Target profile follows viewer |
| `FollowUser.isFollowing` | Viewer follows this list row user (batched) |
| `FollowUser.isFollowingBack` | **Profile-owner-relative** flag from RPC (e.g. on followers list: does profile owner follow this follower). **Not** viewer-relative. UI “Follows you” badge only when the list is for the **viewer’s own** profile. |

### 3.2 Follow frontend — viewer-scoped cache + useMutation

#### Query keys

Update [`frontend/lib/query-keys.ts`](frontend/lib/query-keys.ts):

```ts
// Shared sentinel helper (export for consistency across domains)
export const viewerKey = (userId?: string | null) => userId ?? 'anonymous';

profile: {
  followLists: ['profile', 'follow-list'] as const, // prefix for invalidateQueries
  follow: (targetUserId: string, viewerId?: string | null) =>
    ['profile', 'follow', targetUserId, viewerKey(viewerId)] as const,
  followList: (userId: string, type: string, limit: number, viewerId?: string | null) =>
    ['profile', 'follow-list', userId, type, limit, viewerKey(viewerId)] as const,
  // ...
},
feeds: {
  // ...
  detail: (feedId: string, viewerId?: string | null) =>
    ['feeds', 'detail', feedId, viewerKey(viewerId)] as const,
  // ...
},
```

**Mandatory:** adopt `viewerKey` for `feeds.detail` in the same PR that introduces the helper (one-line call-site update in feeds detail page) so sentinel convention is not dual.

#### API client: signal on getFollowStats

```ts
// frontend/lib/api-client.ts
getFollowStats: (userId: string, signal?: AbortSignal) =>
  apiFetch<{
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
    isFollowedBy: boolean;
  }>(`/users/${userId}/follow-stats`, { signal }),
```

Auth remains default `true` (client already sends JWT when present; backend OptionalAuth is the fix).

#### Shared `unwrapApi`

`frontend/lib/api-unwrap.ts`:

```ts
export function unwrapApi<T>(response: ApiResponse<T>, fallbackMsg = 'Request failed'): T {
  if (!response.success || response.data === undefined || response.data === null) {
    throw new Error(response.error || response.message || fallbackMsg);
  }
  return response.data;
}
```

**Correct call pattern** (signal goes to the client method, not into unwrap):

```ts
queryFn: async ({ signal }) =>
  unwrapApi(await apiClient.getFollowStats(targetUserId, signal)),
```

#### `useFollow` rewrite

```ts
export function useFollow({ targetUserId, initialStats }: Options) {
  const viewerId = useAuth().user?.id ?? null; // AuthContext; see §3.4
  const queryKey = queryKeys.profile.follow(targetUserId, viewerId);

  const statsQuery = useQuery({
    queryKey,
    enabled: Boolean(targetUserId),
    // placeholderData NOT initialData — network still runs when seeded false/stale
    placeholderData: initialStats,
    staleTime: 30_000,
    queryFn: async ({ signal }) =>
      unwrapApi(await apiClient.getFollowStats(targetUserId, signal)),
  });

  const mutation = useMutation({
    mutationFn: async (next: 'follow' | 'unfollow') => {
      const res =
        next === 'follow'
          ? await apiClient.followUser(targetUserId)
          : await apiClient.unfollowUser(targetUserId);
      return unwrapApi(res);
    },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FollowStats>(queryKey);
      const base: FollowStats = previous ?? {
        followersCount: initialStats?.followersCount ?? 0,
        followingCount: initialStats?.followingCount ?? 0,
        isFollowing: false,
        isFollowedBy: initialStats?.isFollowedBy ?? false,
      };
      const following = next === 'follow';
      queryClient.setQueryData<FollowStats>(queryKey, {
        ...base,
        isFollowing: following,
        followersCount: Math.max(0, base.followersCount + (following ? 1 : -1)),
      });
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
      toast.error('Failed to update follow');
    },
    onSuccess: () => {
      toast.success(/* ... */);
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.followLists });
      void queryClient.invalidateQueries({ queryKey });
      if (viewerId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.profile.follow(viewerId, viewerId),
        });
      }
    },
  });

  return {
    isFollowing: statsQuery.data?.isFollowing ?? false,
    stats: statsQuery.data ?? null,
    isLoading: mutation.isPending || statsQuery.isLoading,
    toggleFollow: () =>
      mutation.mutate(statsQuery.data?.isFollowing ? 'unfollow' : 'follow'),
  };
}
```

**Key fixes vs today:**

| Bug | Fix |
|-----|-----|
| No viewer in key | `viewerKey(viewerId)` segment |
| Frozen `initialData` | `placeholderData` + fetch when enabled |
| Silent no-op setQueryData | Optimistic update builds `base` even if cache empty |
| Hand-rolled loading | `useMutation.isPending` |
| Login/logout stale | Different key per viewer + `AuthQueryCacheBridge` (§3.4) |
| Viewer’s followingCount stale | Invalidate `profile.follow(viewerId, viewerId)` on settle |

#### `useFollowList` rewrite (mandatory in same PR as keys)

```ts
export function useFollowList({ userId, type, limit = 20 }: UseFollowListOptions) {
  const viewerId = useAuth().user?.id ?? null;
  const listQuery = useInfiniteQuery({
    queryKey: queryKeys.profile.followList(userId, type, limit, viewerId),
    enabled: Boolean(userId),
    initialPageParam: 0,
    queryFn: async ({ pageParam, signal }) => {
      const fetcher =
        type === 'followers' ? apiClient.getFollowers : apiClient.getFollowing;
      const response = await fetcher(userId, { limit, offset: pageParam }, signal);
      return unwrapApi(response) as FollowUser[];
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === limit
        ? pages.reduce((count, page) => count + page.length, 0)
        : undefined,
  });
  // ... same flatten / loadMore surface
}
```

On auth change, `AuthQueryCacheBridge` removes `['profile', 'follow-list']` so an open modal does not keep anonymous relationship rows.

#### List rows (N× `useFollow`)

Do **not** invent a second list-local follow store. With correct keys, N row hooks share one cache entry per `(target, viewer)`. **Default: keep per-button `useFollow`.**

#### `FollowListModal` seed fix

```tsx
initialStats={{
  followersCount: user.followersCount,
  followingCount: user.followingCount,
  isFollowing: Boolean(user.isFollowing), // viewer-relative from backend batch
  isFollowedBy: false, // do not derive from isFollowingBack
}}
```

Badge only on own-profile lists:

```tsx
{showFollowBack && isOwnProfileList && user.isFollowingBack && (
  <span>• Follows you</span>
)}
```

Pass `isOwnProfileList` (`userId === currentUserId`).

#### Profile counts — single source of truth (**same release as key rewrite**)

**Hard requirement:** every `queryKeys.profile.follow(...)` call site must adopt `(targetId, viewerId)` in the **same PR** as the key signature change. Leaving Profile’s `followStatsQuery` on a one-arg key (or a different key than `useFollow`) makes optimistic button updates invisible to Profile counts — **worse dual truth during the merge window**.

In `Profile.tsx` (PR2, not deferred):

1. **Delete** `localFollowersCount`, `localFollowingCount`, `handleFollowChange`, and the `useEffect` sync.
2. **Delete** the parallel `followStatsQuery` `useQuery` block.
3. Use `useFollow({ targetUserId: displayUser.id })` once for counts + relationship; `FollowButton` shares the same key via its own `useFollow` (RQ dedupe).
4. Render `stats?.followersCount ?? 0` / `stats?.followingCount ?? 0`.
5. `FollowButton` must **not** take `onFollowChange` for count bumps.

Optional Profile hook *extraction* (ideas/stats/feeds files) may ship in PR3 without touching follow keys again.

**PR2 acceptance grep:**

```text
rg "profile\.follow|queryKeys\.profile\.follow" frontend
# every call must pass viewerId (or use viewerKey inside factory only)
rg "followList\(" frontend
```

### 3.3 React Query migration domains

#### Principle: honest ownership

| Domain | Owner after this work | Notes |
|--------|----------------------|-------|
| Follow stats/lists | RQ | Single key family; no local counts |
| Notifications | RQ | **Remove** dead Zustand fields |
| Project detail **network freshness** | RQ (`useProjectDetail`) | Initial load + refetch + force refresh |
| Project detail **live working copy** | Zustand `selectedProject` **and** `projects[]` | Both required: IdeaDetail vs ProjectDetail consumers |
| Project list / votes / comments | Zustand | Unchanged this initiative |
| Auth user | AuthContext | Mirror via AuthStoreSync |
| Feeds / hackathons / related | RQ | None |

#### Project detail — **Hybrid contract (chosen for this initiative)**

**Do not claim true single-owner for the live detail object.** Production UI mutates store in place; rewriting comment/realtime into RQ is a separate initiative.

**Consumer asymmetry (must drive bridge design):**

| Component | How it resolves the project |
|-----------|----------------------------|
| `IdeaDetail` | `useAppStore().selectedProject` |
| `ProjectDetail` | `projects.find(p => p.id === selectedProjectId)` — **list only**, not `selectedProject` |

Today `fetchProjectById` upserts into `projects[]` (map-replace if id exists, else prepend). Pages then call `setSelectedProject`. **A bridge that only calls `setSelectedProject` leaves `/projects/[id]` broken** (id set, no list row → empty render).

**Contract:**

| Concern | Owner |
|---------|-------|
| Network fetch / staleTime / cancel / force refresh | RQ via `useProjectDetail` + `queryKeys.projects.detail(routeKey)` |
| Live UI working copy | Zustand `selectedProject` **and** matching `projects[]` row |
| Bridge | **`hydrateProjectDetail(project)`** (required helper — see below) |
| Comment/AI force refresh | `queryClient.fetchQuery` / invalidate → then **`hydrateProjectDetail`** (not selection-only) |
| Route identity safety | Clear selection on `routeKey` change; **trust RQ key** for hydrate (not UUID↔slug compare) |

##### `hydrateProjectDetail` (required in PR4)

Add to Zustand store (or a tiny store action module used by pages and wrappers):

```ts
// Same merge rules as current fetchProjectById (~store.ts lines 516–523)
hydrateProjectDetail: (project: Project) => {
  set((current) => {
    const alreadyStored = current.projects.some((p) => p.id === project.id);
    return {
      projects: alreadyStored
        ? current.projects.map((p) => (p.id === project.id ? project : p))
        : [project, ...current.projects],
      selectedProject: project,
      selectedProjectId: project.id,
      isBackendMaintenance: false,
    };
  });
},
```

**All network→store paths must use this helper:** page bridge, residual `fetchProjectById` wrapper, force-refresh after comments. Never selection-only.

##### Error helper for RQ (preserve `errorType`)

Prefer a single failure path — do **not** double-handle with `if (!success) throw` then `unwrapApi`:

```ts
// frontend/lib/api-unwrap.ts (or next to project helpers)
export type ApiError = Error & { errorType?: string };

export function toApiError(response: ApiResponse<unknown>, fallback = 'Request failed'): ApiError {
  const err = new Error(response.error || response.message || fallback) as ApiError;
  err.errorType = response.errorType;
  return err;
}

export function normalizeProject(raw: any): Project {
  const project = { ...raw, image: raw.imageUrl || raw.image };
  if (project.comments?.length) {
    project.comments = buildCommentTree(project.comments);
  }
  return project;
}
```

##### `useProjectDetail` + route key (align with existing pages)

Route params are **not** always UUIDs. Current pages:

| Page | Param handling | Backend |
|------|----------------|---------|
| `app/projects/[id]/page.tsx` | **Raw** `params.id` (slug or UUID) | `findOne` resolves by slug or id |
| `app/idea/[id]/page.tsx` | `extractIdFromSlug(slugOrId) \|\| slugOrId` | legacy unique slug may end in 8-char hex prefix; pure slugs pass through |

`useProjectDetail` must accept the **same route key the page already uses** — do not re-normalize differently per call site. Query key = that key so RQ data is always for the active param.

```ts
// Callers:
// projects page: useProjectDetail(params.id)           // raw slug/uuid
// idea page:     useProjectDetail(extractIdFromSlug(params.id) || params.id)

export function useProjectDetail(
  routeKey: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.projects.detail(routeKey!),
    enabled: Boolean(routeKey) && (options?.enabled ?? true),
    staleTime: 60_000,
    // IMPORTANT: no placeholderData / keepPreviousData from a prior routeKey.
    // Clear-on-navigate relies on data belonging only to the current key.
    queryFn: async ({ signal }) => {
      const response = await apiClient.getProject(routeKey!, signal);
      if (!response.success || response.data == null) {
        throw toApiError(response, 'Failed to load project');
      }
      return normalizeProject(response.data);
    },
  });
}
```

Pages map maintenance:

```ts
const isMaintenance =
  detailQuery.isError &&
  (detailQuery.error as ApiError)?.errorType === 'backend_unavailable';
```

##### Identity-safe page wiring (no stale project A on route A→B)

**Preferred approach (required): trust the active RQ query key — do not compare UUID to slug.**

A successful `detailQuery.data` for `queryKeys.projects.detail(routeKey)` is already the project for that route param (slug, UUID, or 8-char prefix). Returned `project.id` is typically a UUID while `routeKey` may be a human slug (`project.slug`). Naive `data.id === routeId` / `data.id.startsWith(routeId)` **fails for slug URLs** and must not be used as the primary gate.

Align with how pages work today: clear selection when param changes, then set selection only after fetch resolves.

```ts
// projects/[id]: const routeKey = params.id as string;
// idea/[id]:     const routeKey = extractIdFromSlug(slugOrId) || slugOrId;

const detailQuery = useProjectDetail(routeKey);
const hydrateProjectDetail = useAppStore((s) => s.hydrateProjectDetail);
const setSelectedProject = useAppStore((s) => s.setSelectedProject);
const selectedProject = useAppStore((s) => s.selectedProject);

// 1) Clear working copy on route change (matches current idea/project pages)
useEffect(() => {
  setSelectedProject(null);
}, [routeKey, setSelectedProject]);

// 2) Hydrate whenever RQ has success data for THIS query key.
//    After clear, selectedProject is null until this runs → no paint of A under B.
//    Do not re-compare data.id to routeKey (slug ≠ uuid).
useEffect(() => {
  if (!detailQuery.isSuccess || !detailQuery.data) return;
  hydrateProjectDetail(detailQuery.data);
}, [detailQuery.isSuccess, detailQuery.data, hydrateProjectDetail]);

// 3) Render gate: selection only reappears via hydrate after clear
const showDetail = Boolean(selectedProject) && !detailQuery.isError;
// Loading: !showDetail && (detailQuery.isLoading || detailQuery.isFetching || !detailQuery.isFetched)
// Not found / hard error: detailQuery.isError && !isMaintenance → existing not-found / redirect behavior
// Maintenance: isMaintenance placeholder
```

**Why this is safe without UUID↔slug compare:**

| Mechanism | Prevents |
|-----------|----------|
| Clear selection on `routeKey` change | Zustand still holding project A while B loads |
| No `placeholderData` / `keepPreviousData` on detail query | RQ never surfaces A’s object under B’s key |
| Hydrate only from current `detailQuery.data` | Store only receives the network result for active key |
| `showDetail = selectedProject != null` after clear | UI never mounts detail until B is hydrated |

**Optional defensive helper** (use only if a future change adds cross-key placeholders; **not** required for PR4 default):

```ts
// frontend/lib/project-route-match.ts — optional belt-and-suspenders
import { extractIdFromSlug } from './slug-utils';

export function projectMatchesRoute(
  project: { id: string; slug?: string | null },
  routeKey: string,
): boolean {
  if (!routeKey) return false;
  if (project.id === routeKey) return true;
  if (project.slug && project.slug === routeKey) return true;

  // 8-char hex UUID prefix (legacy idea URLs / extractIdFromSlug output)
  if (/^[a-f0-9]{8}$/i.test(routeKey) && project.id.startsWith(routeKey)) {
    return true;
  }

  // Legacy unique slug: "my-title-abc12345" where last segment is id prefix
  const extracted = extractIdFromSlug(routeKey);
  if (
    extracted &&
    extracted !== routeKey &&
    /^[a-f0-9]{8}$/i.test(extracted) &&
    project.id.startsWith(extracted)
  ) {
    return true;
  }

  return false;
}
```

**Forbidden (do not copy into PR4):**

```ts
// BROKEN for slug routes — project.id is UUID, routeKey is "my-awesome-idea"
data.id === routeId || data.id.startsWith(routeId)
```

##### `navigateToProject` / residual `fetchProjectById`

Thin RQ wrapper **must** call `hydrateProjectDetail` after fetch (not “optional list merge”). The `id` argument may be slug or UUID (same as today):

```ts
fetchProjectById: async (id, { force } = {}) => {
  try {
    const project = await queryClient.fetchQuery({
      queryKey: queryKeys.projects.detail(id),
      queryFn: /* same as useProjectDetail.queryFn for routeKey=id */,
      staleTime: force ? 0 : 60_000,
    });
    get().hydrateProjectDetail(project);
    return project;
  } catch (e) {
    if ((e as ApiError).errorType === 'backend_unavailable') {
      set({ isBackendMaintenance: true });
    }
    return null;
  }
};
```

If wiring `queryClient` into Zustand is awkward, migrate call sites to page/hook `fetchQuery` + `hydrateProjectDetail` in the same PR4 and delete `fetchProjectById`. **Either is acceptable; dual TTL and selection-only hydrate are not.**

**Remove from Zustand:**

- `PROJECT_DETAIL_TTL_MS`, `projectDetailLoadedAt`, `projectDetailRequests` maps  
- Standalone network path that bypasses RQ

**Do not remove in PR4:**

- `selectedProject` / `selectedProjectId` / `projects[]`  
- Comment/vote/realtime in-place mutations on store  
- New `hydrateProjectDetail` action

**Backend:** Keep `NoCacheInterceptor` on `GET :id` — truthful for **network** freshness managed by client RQ.

**True single owner (explicitly out of scope):** would require every store mutation on detail/comments to `queryClient.setQueryData` and both detail components to read from RQ.

#### Notifications cleanup

1. Delete from `AppState`: `notifications`, `markNotificationRead`, `clearNotifications` and implementations.
2. Fix API types so `useNotifications` drops `(response as any)`:

**Option A (preferred):** Frontend types match reality:

```ts
getNotifications: (...) => apiFetch<NotificationEnvelope>(...)
// NotificationEnvelope = { success: boolean; notifications: Notification[]; error?: string }
```

```ts
function unwrapNotifications(res: NotificationEnvelope): Notification[] {
  if (!res.success) throw new Error(res.error || '...');
  return res.notifications ?? [];
}
```

**Option B:** Normalize notification controller to `ApiResponse<Notification[]>` — **not in this initiative**.

### 3.4 Auth identity + cache bridge

**Decision: AuthContext remains sole write owner for session user; Zustand is a read mirror.**

1. Keep `AuthStoreSync`.
2. New/edited follow hooks use `useAuth().user` (or `useViewerId()`).
3. **Do not** import a QueryClient singleton from AuthContext.

#### `AuthQueryCacheBridge` (PR2 acceptance — required)

Place under `QueryProvider` next to `AuthStoreSync` in `ClientLayout.tsx` (or inside `QueryProvider` children):

```tsx
function AuthQueryCacheBridge() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const nextId = user?.id ?? null;
    const prevId = prevUserIdRef.current;
    prevUserIdRef.current = nextId;

    if (prevId === undefined) return;
    if (prevId === nextId) return;

    void queryClient.removeQueries({ queryKey: ['profile', 'follow'] });
    void queryClient.removeQueries({ queryKey: ['profile', 'follow-list'] });
    void queryClient.removeQueries({ queryKey: ['notifications'] });
    void queryClient.removeQueries({ queryKey: ['announcements'] });
    void queryClient.removeQueries({ queryKey: ['team-invites'] });
    void queryClient.removeQueries({ queryKey: ['feeds', 'mine'] });
    void queryClient.removeQueries({ queryKey: ['feeds', 'following'] });
    void queryClient.removeQueries({ queryKey: ['feeds', 'detail'] });
  }, [user?.id, queryClient]);

  return null;
}
```

**Rationale:** uses `useQueryClient()` under provider; no singleton; shared-machine privacy for relationship caches.

Long-term optional: migrate remaining `store.user` readers to `useAuth` (PR9).

### 3.5 AI search quota — guaranteed refund on failed paid attempt

**Primary goal:** after a successful reserve, **always refund** if the paid attempt does not complete successfully. Secondary: collapse check+increment into one RPC for a cleaner API and one fewer round-trip (existing `increment_search_usage` already caps concurrent max).

**SQL** (`backend/database/migration_fix_search_quota_atomic.sql`): full `reserve_search_usage` / `refund_search_usage` as in rev 2–3 (conditional increment + refund decrement). Keep `can_user_search_projects` for read-only UI.

**Service skeleton:** `let reserved = false; let completed = false; try { … } catch { … } finally { if (reserved && !completed) refund }` — covers non-throwing early returns after reserve.

**Acceptance (PR6):** zero-result success consumes quota; provider failure refunds; concurrent max enforced; fix misleading “atomically” comment; log refunds.

### 3.6 Profile / Hackathon decomposition

Profile non-follow hook extract = optional PR3. Hackathon F1–F4 = optional only (detail → registration → team → submissions), does not block initiative.

### 3.7 Typing boundary

1. Type `getFollowers` / `getFollowing` as `ApiResponse<FollowUser[]>`.
2. Notifications envelopes Option A; remove `as any`.
3. `getFollowStats(userId, signal?)`.

### 3.8 Related Projects empty state copy

Non-uploader AI empty / pin empty copy as in rev 2–3.

---

## 4. API / Query-key contracts

### 4.1 HTTP (Follow)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/users/:userId/follow` | Required | unchanged |
| DELETE | `/users/:userId/follow` | Required | unchanged |
| GET | `/users/:userId/follow-stats` | **Optional** | OptionalAuthGuard |
| GET | `/users/:userId/followers` | **Optional** | OptionalAuthGuard |
| GET | `/users/:userId/following` | **Optional** | OptionalAuthGuard |

### 4.2 Query keys

```ts
export const viewerKey = (id?: string | null) => id ?? 'anonymous';

queryKeys.profile.follow(targetId, viewerId)
queryKeys.profile.followList(userId, type, limit, viewerId)
queryKeys.projects.detail(routeKey) // routeKey = slug | uuid | 8-char prefix as used by page
queryKeys.feeds.detail(feedId, viewerId)
```

**Invalidation:** follow settle invalidates target + viewer self stats + follow-list prefix. Project force refresh → fetch + **`hydrateProjectDetail`**. Auth change → AuthQueryCacheBridge removeQueries.

### 4.3 Search quota RPC

| RPC | Purpose |
|-----|---------|
| `reserve_search_usage` | Conditional increment + JSON + `reserved` |
| `refund_search_usage` | Decrement when reserved && !completed |
| `can_user_search_projects` | Read-only UI |

---

## 5. Migration / Rollout order and risk

### Ordering principles

1. Backend optional auth first.  
2. FE follow keys + useFollow/useFollowList + Profile SSoT + AuthQueryCacheBridge + feeds.detail in **one PR**.  
3. Optional Profile extract.  
4. Project detail hybrid.  
5–7. Notifications, AI quota, Related Projects copy.  
8. Optional hackathon F1–F4.

### Risk matrix

| Risk | Mitigation |
|------|------------|
| Cache key change leaves stale old keys | New key shape; AuthQueryCacheBridge + gcTime |
| Optimistic count drift | invalidate target + viewer self stats on settle |
| Profile dual key mid-merge | **Forbidden** — Profile follow sites in PR2 |
| OptionalAuth invalid JWT | Guard treats invalid as anonymous (feeds) |
| Search refund miss on non-throw returns | `finally { reserved && !completed }` skeleton |
| Project dual path / dual TTL | Hybrid contract; delete TTL maps; one network path via RQ |
| `/projects/[id]` empty after RQ load | **`hydrateProjectDetail` upserts `projects[]`** |
| Stale project A on route A→B | Clear selection on `routeKey` change; no keepPreviousData |
| **Slug deep-link “not found” after success** | **Trust RQ key for hydrate; never gate on `data.id === slug`** |
| Maintenance placeholder lost | `toApiError` preserves `errorType` |
| navigateToProject bypasses RQ | wrapper calls hydrate after fetchQuery |
| Follow more broken mid-stack | BE-first alone OK; FE keys only after/with BE |

---

## 6. Testing plan

### 6.1 Backend (Follow) — manual curl + PR checklist

See rev 2 curl samples (anonymous / JWT / list / 401 on write).

### 6.2 Frontend (Follow) — manual

Login/logout matrix, Profile counts, list seeds, optimistic rollback, viewer followingCount invalidate.

### 6.3 Project detail — manual

- **Route A → B (idea and project):** never paints A under B (clear + no previous-data + showDetail only after hydrate).
- **Deep-link `/projects/[slug]`** (human slug, not UUID): page shows project after success (hydrate from RQ data; **not** blocked by id/slug mismatch).
- **Deep-link `/projects/[uuid]`** and **`/idea/[slug-or-prefix]`:** same.
- **Deep-link with empty list:** `ProjectDetail` finds row after hydrate upsert.
- Comment force refresh → hydrate list + selection.
- Backend down → maintenance via `errorType`.
- `navigateToProject` with slug or id; no second TTL.

### 6.4 AI quota / 6.5 smoke

As rev 2–3.

---

## 7. Alternatives considered

| Alternative | Why not chosen |
|-------------|----------------|
| Require auth on follow-stats | Breaks public profiles; feeds already use optional |
| Viewer id only in queryFn, not keys | Wrong cache share across login/logout |
| Keep `initialData` + `staleTime: 0` | Easy to regress; `placeholderData` is correct seed pattern |
| Global follow Zustand store | Third system; fights RQ goals |
| True single-owner project detail now | Touches comment/realtime graph; high risk; **hybrid** chosen |
| Bridge only `setSelectedProject` | Breaks `ProjectDetail` which reads `projects[]` only |
| **Gate hydrate on `data.id === routeId` / startsWith** | **Breaks slug URLs** (UUID id vs human slug); forbidden |
| Require `projectMatchesRoute` for every hydrate | Optional only; trust RQ key is simpler and matches today’s clear-then-set |
| Big-bang migrate list + comments to RQ | Out of scope |
| Mandatory hackathon extraction | Optional F1–F4 |
| QueryClient singleton for logout clear | Prefer AuthQueryCacheBridge |
| RQ `placeholderData`/`keepPreviousData` from prior detail | Wrong identity; clear + no previous-data is safer |

---

## 8. Key Decisions

1. **OptionalAuthGuard on follow reads** — matches feeds.  
2. **Viewer-scoped follow keys including lists.**  
3. **`placeholderData` over `initialData` for follow list seeds.**  
4. **`useMutation` optimistic update with rollback.**  
5. **Profile follow SSoT in PR2** (same release as keys).  
6. **`isFollowingBack` ≠ `isFollowedBy` for button seeds.**  
7. **Hybrid project detail + `hydrateProjectDetail` (list upsert + selection).**  
8. **AuthContext SSoT + AuthQueryCacheBridge.**  
9. **AI: guaranteed refund after failed paid attempt (`finally`).**  
10. **Hackathon extract optional F1–F4.**  
11. **Notification envelopes Option A.**  
12. **Delete dead Zustand notification fields.**  
13. **`getFollowStats(userId, signal?)` + unwrap after await.**  
14. **Invalidate viewer self follow stats on settle.**  
15. **Route identity: clear selection + trust active RQ key for hydrate; forbid naive UUID↔slug compare as primary gate.**  
    *Rationale:* Slug routes return UUID `id`; comparing them breaks deep-links. Clear + no keepPreviousData already prevents A under B.  
16. **`useProjectDetail` single `toApiError` failure path.**  
17. **Page routeKey matches existing page resolution** (raw slug on projects; `extractIdFromSlug` on ideas).

---

## 9. Open Questions

| # | Question | Default recommendation |
|---|----------|------------------------|
| 1 | Zero-result Tavily refund? | **No** — PR6 acceptance. |
| 2 | Normalize notification `data` envelope? | **Not this initiative.** |
| 3 | Remove AuthStoreSync? | **No** until consumers migrated (PR9). |
| 4 | `useFollow` staleTime? | **30s**. |
| 5 | `fetchProjectById` wrapper vs delete? | **Either in PR4**; must call `hydrateProjectDetail`. |

---

## 10. PR Plan

### PR1 — Backend: Optional auth on follow reads

**Title:** `fix(follow): OptionalAuthGuard on stats/followers/following`  
**Files:** `follow.controller.ts`, `users.module.ts`  
**Test:** Manual curl checklist.

### PR2 — Frontend: Follow keys, hooks, Profile counts, auth cache bridge

**Title:** `fix(follow): viewer-scoped keys, useMutation, Profile SSoT, AuthQueryCacheBridge`  
**Files:** query-keys, api-client, api-unwrap, useFollow, FollowListModal, FollowButton, Profile, ClientLayout/QueryProvider, feeds detail page  
**Depends on:** PR1 (deploy together preferred)  
**Test:** §6.2.

### PR3 — Profile: extract non-follow data hooks (optional polish)

**Depends on:** PR2.

### PR4 — Project detail hybrid RQ load

**Title:** `feat(projects): useProjectDetail + hydrateProjectDetail; remove Zustand detail TTL`

**Files:**

- `frontend/hooks/useProjectDetail.ts` — routeKey as-is; no keepPreviousData; `toApiError`
- `frontend/lib/api-unwrap.ts` / helpers — `toApiError`, `normalizeProject`
- `frontend/lib/query-keys.ts`
- `frontend/lib/store.ts` — **`hydrateProjectDetail`**; remove TTL; wrapper or delete `fetchProjectById`
- `frontend/app/idea/[id]/page.tsx` — `routeKey = extractIdFromSlug(...) || ...`; clear; hydrate from `detailQuery.data` on success; maintenance
- `frontend/app/projects/[id]/page.tsx` — **`routeKey = params.id` raw**; same bridge pattern (slug-safe)
- `frontend/components/IdeaDetail.tsx` — force refresh via fetch + hydrate
- Optional only: `frontend/lib/project-route-match.ts` if needed later

**Depends on:** nothing strictly; after PR2 preferred  

**Description:** Hybrid §3.3 rev 4. RQ owns network freshness. `hydrateProjectDetail` is the only bridge. **Identity: clear on routeKey + trust RQ success data (no UUID↔slug gate).** Do not rewrite comment/realtime mutations.

**Test:** §6.3 including **slug** and UUID deep-links + A→B.

### PR5 — Notifications typing + delete Zustand dead state

### PR6 — AI search quota reserve + guaranteed refund

### PR7 — Related Projects empty-state copy

### PR8a–d (optional) — Hackathon F1–F4

### PR9 (optional) — Auth consumer convergence

---

## 11. Implementation checklist (engineer quick ref)

- [ ] PR1 OptionalAuthGuard on 3 GETs + module provider; curl checklist  
- [ ] PR2 `viewerKey` + `getFollowStats(signal)` + useFollow/useFollowList + Profile SSoT + AuthQueryCacheBridge + feeds.detail  
- [ ] PR2 grep: no one-arg `profile.follow` call sites  
- [ ] PR3 optional Profile hook extract  
- [ ] PR4 `hydrateProjectDetail` (list upsert + selection)  
- [ ] PR4 clear selection on routeKey; hydrate on `detailQuery.isSuccess` (**no** `data.id === slug` gate)  
- [ ] PR4 projects page uses raw slug routeKey; idea page uses extractIdFromSlug  
- [ ] PR4 no `placeholderData`/`keepPreviousData` on project detail query  
- [ ] PR4 `toApiError` path; maintenance mapping  
- [ ] PR4 delete detail TTL; navigate/wrapper uses hydrate  
- [ ] PR5 notifications types; delete store notifications  
- [ ] PR6 reserve/refund + `finally` flags; fix comment; zero-result consumes  
- [ ] PR7 RelatedProjectsModal copy  
- [ ] Optional PR8a–d hackathon F1–F4  
- [ ] Manual: follow matrix + slug deep-link + A→B + quota refund  

---

## 12. Appendix: critical code references

### Broken controller (no guard)

```55:61:backend/src/users/follow.controller.ts
  @Get(":userId/follow-stats")
  async getFollowStats(
    @Param("userId") userId: string,
    @CurrentUser("userId") currentUserId?: string
  ): Promise<ApiResponse<any>> {
    return this.followService.getFollowStats(userId, currentUserId);
```

### ProjectDetail reads list, not selectedProject

```199:220:frontend/components/ProjectDetail.tsx
    selectedProjectId,
    ...
  const project = projects.find(p => p.id === selectedProjectId);
```

### Projects page: raw slug param

```12:15:frontend/app/projects/[id]/page.tsx
  const slugOrId = params.id as string;
  // Just pass the slug directly to backend - it will handle finding by slug or ID
  const projectId = slugOrId;
```

### Idea page: extractIdFromSlug

```24:26:frontend/app/idea/[id]/page.tsx
  // Extract ID prefix from slug (e.g. "my-idea-abc12345" -> "abc12345").
  const ideaId = extractIdFromSlug(slugOrId) || slugOrId;
```

### extractIdFromSlug (only 8-char hex suffix)

```50:63:frontend/lib/slug-utils.ts
export function extractIdFromSlug(slug: string): string | null {
  const parts = slug.split("-");
  if (parts.length < 2) return null;
  const lastPart = parts[parts.length - 1];
  if (/^[a-f0-9]{8}$/i.test(lastPart)) {
    return lastPart;
  }
  return slug;
}
```

### fetchProjectById upserts projects[]

```516:523:frontend/lib/store.ts
          set((current) => {
            const alreadyStored = current.projects.some((p) => p.id === project.id);
            return {
              projects: alreadyStored
                ? current.projects.map((p) => (p.id === project.id ? project : p))
                : [project, ...current.projects],
            };
          });
```

### Silent cache no-op + unscoped key (follow)

```19:50:frontend/hooks/useFollow.ts
  const queryKey = queryKeys.profile.follow(targetUserId);
  ...
  initialData: initialStats,
```

### Auth mirror (no QueryClient)

```25:33:frontend/app/ClientLayout.tsx
function AuthStoreSync() {
  const { user: authUser } = useAuth();
  const setUser = useAppStore((state) => state.setUser);
  useEffect(() => {
    setUser(authUser);
  }, [authUser, setUser]);
```
