# Gimme Idea — Performance, Egress & Security TODO

**Status:** Active
**Owner:** Frontend / Platform
**Last updated:** 2026-07-26
**Scope:** `frontend/` primarily; backend only where contracts or headers are required
**Bar:** Production-grade. No half-measures, no “fix later” without a tracked follow-up phase.

**Execution status:** local implementation for Phases 0-6 is complete under user waiver to continue sequentially. Final browser evidence is attached at `docs/perf/browser-evidence/2026-07-26T09-43-28Z/summary.md`; current-state Lighthouse JSON is under `docs/perf/lighthouse/`. Remaining proof requires external access: funded wallet/passkey/on-chain E2E, Supabase OAuth dashboard verification, authenticated realtime matrix, and staging/production curl checks.

---

## 0. Non-negotiables (apply to every phase)

1. **No silent regressions** of product UX flows documented in §1.2.
2. **Every phase ends with a written Pass Report** (checklist below filled, evidence attached: screenshots, CLI output, Lighthouse JSON, Network HAR or notes).
3. **No `// TODO: optimize later` left in critical path** for work claimed “done” in that phase.
4. **No `"latest"` dependency pins** introduced or left for packages touched by a phase.
5. **Secrets never committed.** Env samples only placeholders.
6. **Security work is deferred to Phase 5+** but must not be blocked by earlier phases (no hardcoding of insecure patterns that Phase 5 cannot fix).
7. **Feature flags** for risky behavior (realtime, experimental wallet paths) must be explicit env vars, default **safe/off** in production unless product explicitly opts in.

---

## 1. Problem statement

### 1.1 Symptoms

| Symptom | User / ops observation |
|---------|------------------------|
| Heavy first load | Tab feels slow before any interaction |
| High JS cost | Large main/vendor chunks; mobile CPU warm |
| Idle egress | Bandwidth / Supabase egress rises while user is idle |
| Repeat fetches | Navigating back to list/detail re-hits API unnecessarily |
| Scale jank | Long idea lists / comment threads re-render too broadly |
| Security debt | Client-heavy app, raw HTML markdown, global providers, admin UX in client bundle |

### 1.2 Root causes (verified against this codebase)

| ID | Root cause | Evidence in repo |
|----|------------|------------------|
| R1 | **Solana wallet stack mounted globally** on every route | `app/ClientLayout.tsx` → `WalletProvider` + `LazorkitProvider` |
| R2 | **Wallet adapters imported eagerly** | `components/WalletProvider.tsx` imports `@solana/wallet-adapter-wallets`, web3, modal CSS |
| R3 | **Node polyfills on critical path** | `polyfills.js` + webpack `ProvidePlugin` in `next.config.js` |
| R4 | **4 Google fonts always loaded** | Inter, JetBrains Mono, Space Grotesk, Quantico in `ClientLayout` |
| R5 | **Capacitor imported on web auth path** | `contexts/AuthContext.tsx` |
| R6 | **Supabase Realtime multi-channel design** (projects, comments, notifications, invites, announcements) | `hooks/useRealtime*`, `useNotifications`, `useTeamInvites`, `useAnnouncements` |
| R7 | Realtime is **opt-in via flag** but production may enable broadly | `lib/featureFlags.ts` — `NEXT_PUBLIC_ENABLE_REALTIME` |
| R8 | **No production data cache layer** (React Query present but unused) | `package.json` vs store/`useEffect` fetch patterns |
| R9 | **Zustand full-store subscriptions** | Widespread `useAppStore()` destructuring without selectors |
| R10 | **Framer Motion still in many non-critical modules** | Modals / legacy pages |
| R11 | **Client-only App Router shell** | Near-total `'use client'`; no RSC data boundaries |
| R12 | **Security: raw HTML in markdown** | `MarkdownContent` + `rehype-raw` |
| R13 | **Security: admin UI shipped in public client bundle** | `app/admin*`, admin buttons in idea detail |
| R14 | **Security: dual auth state** (AuthContext + Zustand user) increases session bug surface | `AuthStoreSync`, store `user` |
| R15 | Dependency pins as `"latest"` for critical packages | `frontend/package.json` |

### 1.3 UX must remain intact (regression baseline)

These must still work after every phase (manual smoke, minimum):

- [ ] Landing → Explore ideas
- [ ] Idea list: filter category, search, load more, vote (logged in / gate when logged out)
- [ ] Idea detail: read problem/solution, comment/reply/anon, tip/payment paths that already exist
- [ ] Auth: Google sign-in, wallet sign-in, link wallet, session restore, sign out
- [ ] Submit idea modal open/close + auth gate
- [ ] Navbar: search, notifications (if logged in), profile menu
- [ ] Pool / proposal / on-chain actions still reachable for entitled users
- [ ] Mobile bottom nav + desktop nav routing

**Pass standard for regressions:** 100% of baseline flows green on desktop + mobile viewport (375px). Zero known P0 bugs deferred without product sign-off.

### 1.4 Metrics baseline (capture before Phase 1; re-measure after each phase)

Record on **production build** (`next build && next start`) against a fixed page set: `/landing`, `/idea`, `/idea/[id]` (known public id).

| Metric | Tool | Baseline (fill) | Target after Phase 2 | Target after Phase 4 |
|--------|------|-----------------|----------------------|----------------------|
| JS transferred (first load `/idea`, no login) | Network / Coverage | _____ kB | ≤ baseline − 30% | ≤ baseline − 40% |
| Largest JS chunk related to solana/wallet | Source map / analyzer | _____ kB | Not in initial `/idea` graph | Same |
| LCP `/idea` (Moto G Power / throttled) | Lighthouse mobile | _____ s | ≤ baseline − 20% | ≤ 2.5s preferred |
| TBT mobile `/idea` | Lighthouse | _____ ms | ≤ baseline − 25% | ≤ 200ms preferred |
| Idle 3 min Network (logged out `/idea`) | DevTools Network | note WS/XHR | **0 unexpected XHR loops**; **0 Supabase Realtime WS** unless flag on | Same |
| Idle 3 min (logged in, realtime **off**) | Network | note | No notification poll loop; no project WS | Same |
| Idle 3 min (logged in, realtime **on**) | Network | note | Only intended channels; document each | Document + budget |
| API calls to open `/idea` cold | Network | _____ | ≤ baseline; no duplicate parallel same URL | Cached revisit ≤ 1 network if staleTime allows |

Fill baseline row before starting Phase 1. Phases that claim “lighter” without filled metrics = **fail**.

---

## 2. Phase overview

| Phase | Name | Primary goal | Security? |
|-------|------|--------------|-----------|
| **0** | Baseline & instrumentation | Measure truth; freeze env semantics | No (prep only) |
| **1** | Wallet & provider isolation | Kill global wallet cost | Prep only |
| **2** | Fonts, polyfills, mobile split | Shrink shell weight | Prep only |
| **3** | Realtime & egress discipline | Idle cost under control | Prep only |
| **4** | Data layer (React Query + store) | Correct caching; less refetch/jank | Prep only |
| **5** | Security hardening (web) | XSS, auth, admin, headers, deps | **Yes — main** |
| **6** | Architecture cleanup & permanence | RSC boundaries, dead code, pins | Continues security hygiene |

Phases are **sequential**. Phase N may not start until Phase N−1 Pass Report is approved (or explicit waiver signed).

---

## 3. Phase 0 — Baseline & instrumentation

### 3.1 Problem addressed

Without measurement, “lighter” is opinion. Without env truth, realtime blame is guesswork.

### 3.2 Work items

| ID | Task | Done when |
|----|------|-----------|
| 0.1 | Document production env flags: `NEXT_PUBLIC_ENABLE_REALTIME`, `NEXT_PUBLIC_DISABLE_REALTIME`, API URL, Supabase URL (no secrets) | Written in Pass Report |
| 0.2 | Run `next build` production; capture bundle analyzer report (`@next/bundle-analyzer` or equivalent) | Artifact committed under `docs/perf/baseline/` or linked |
| 0.3 | Capture Network HAR or structured notes for: cold `/landing`, cold `/idea`, idle 3 min logged out | Artifact |
| 0.4 | Capture Lighthouse mobile for `/landing` and `/idea` (same device/profile) | Artifact |
| 0.5 | Inventory all `supabase.channel` / `postgres_changes` call sites | Table in this file or `docs/perf/realtime-inventory.md` |
| 0.6 | Inventory all entry imports of wallet/lazorkit/capacitor/framer-motion | Table |
| 0.7 | Create smoke checklist sheet (copy of §1.3) for re-use | Template ready |

### 3.3 Pass criteria (all required)

- [ ] Baseline metrics table in §1.4 filled with numbers (not “TBD”).
- [ ] Bundle analyzer artifact exists and names top 10 modules by size.
- [ ] Realtime inventory complete with file paths.
- [ ] Confirmed whether production currently enables realtime (yes/no + env source).
- [ ] Smoke baseline run once on current `main`/working branch; results recorded.

**Fail if:** any metric cell empty; analyzer missing; realtime flag unknown.

---

## 4. Phase 1 — Wallet & provider isolation

### 4.1 Problem addressed

**R1, R2** — Global wallet/Lazorkit force critical-path cost on every page.

### 4.2 Design requirements (not optional shortcuts)

1. **Public routes must not import** `@solana/wallet-adapter-*`, `@solana/web3.js` (except types-only if erased), `@lazorkit/wallet` in the initial JS graph.
2. Wallet stack loads **only** after an explicit user intent **or** navigation into a wallet-required route segment.
3. Auth Google path must work **without** loading Solana adapters.
4. Connect wallet / link wallet / tip / pool flows must still work after lazy load (loading UX allowed ≤ 1 clear spinner/state).
5. No permanent “stub wallet that breaks hooks” — providers must satisfy hooks or hooks must not run until ready.
6. SSR-safe: no `window` access at module top level in new code.

### 4.3 Work items

| ID | Task |
|----|------|
| 1.1 | Introduce route groups or `WalletGate` / lazy provider boundary |
| 1.2 | Remove hard `WalletProvider` + `LazorkitProvider` from root `ClientLayout` critical imports |
| 1.3 | Dynamic import adapters only when opening connect UI |
| 1.4 | Dynamic import Lazorkit only for passkey path |
| 1.5 | Ensure `AuthContext` does not require wallet adapters until wallet sign-in chosen |
| 1.6 | Loading / error states for wallet chunk failure (network fail → retry CTA) |
| 1.7 | Verify bundle: `/idea` initial graph free of wallet-adapter-wallets |

### 4.4 Pass criteria (all required)

- [ ] **Bundle proof:** production build analyzer or `source-map-explorer` shows `@solana/wallet-adapter-wallets` **not** in initial chunk set for `/idea` and `/landing`.
- [ ] Cold load `/idea` logged out: **no** wallet adapter network module load until Connect clicked (Network filter by name).
- [ ] Google sign-in works without loading Phantom/Solflare chunks first.
- [ ] Wallet sign-in, link wallet, and at least one on-chain or tip path that previously worked still works end-to-end.
- [ ] Passkey/Lazorkit path works if product still supports it; otherwise explicitly removed with product approval.
- [ ] §1.3 smoke 100% green.
- [ ] JS transferred `/idea` cold improved vs Phase 0 baseline (**minimum −15%** absolute or wallet chunks deferred — must be measurable).

**Fail if:** wallet still in root layout static import graph; “works on my machine” without analyzer evidence; Google flow still pulls full wallet stack.

---

## 5. Phase 2 — Fonts, polyfills, Capacitor split

### 5.1 Problem addressed

**R3, R4, R5** — Shell weight independent of wallet.

### 5.2 Design requirements

1. **At most 2 `next/font` families** on default product shell (sans + mono). Display/logo font only if justified and subset-limited.
2. Polyfills loaded **only** with wallet/web3 chunk, not for pure content pages.
3. Capacitor packages **zero bytes** in web production bundle (dynamic native-only or build-time split).
4. Do not break font brand identity without design approval — prefer **same families, fewer weights/files**, not random font swap.
   - If Quantico kept for wordmark only: load **one weight**, logo-only usage.

### 5.3 Work items

| ID | Task |
|----|------|
| 2.1 | Audit font usage; collapse to 2 shell fonts + optional logo-only |
| 2.2 | Move polyfill injection to wallet entry only; remove global ProvidePlugin where possible |
| 2.3 | Capacitor: dynamic import gated by native platform detection |
| 2.4 | Re-measure LCP/fonts waterfalls |

### 5.4 Pass criteria (all required)

- [ ] Default layout loads ≤ 2 font families (logo exception documented).
- [ ] Production web bundle: **no** `@capacitor/*` modules in client graph for `/idea` (analyzer or lock + import graph).
- [ ] `/landing` and `/idea` do not load `crypto-browserify` / stream polyfills until wallet path.
- [ ] Visual QA: logo + body typography approved (screenshot before/after).
- [ ] §1.3 smoke green.
- [ ] Cumulative JS transferred vs Phase 0 **≤ −25%** on `/idea` cold (Phases 1+2 combined) **or** documented analyzer proof that remaining weight is non-wallet app code with plan in Phase 4/6.

**Fail if:** polyfills still on every page; Capacitor still static-imported from AuthContext web path.

---

## 6. Phase 3 — Realtime & egress discipline

### 6.1 Problem addressed

**R6, R7** — Idle WebSocket and over-broad subscriptions.

### 6.2 Design requirements

1. **Default production:** realtime **off** unless product explicitly enables named channels.
2. Channel matrix (document and implement):

| Channel | When allowed | When forbidden |
|---------|--------------|----------------|
| `notifications` | Logged-in + flag + app shell | Logged out |
| `team_invites` | Logged-in + flag + relevant product surface | Always-on if invites unused |
| `announcements` | Logged-in + flag | Guest |
| `comments-{id}` | On idea/project detail for that id only | List pages |
| `projects-realtime` | **Default off**; only if product requires live global feed | Idea list default |

3. Every subscription has **cleanup** on unmount; no duplicate channels.
4. No `setInterval` polling as a substitute for realtime for notifications (unless product-approved with ≥ 60s interval and visibility API pause).
5. Egress budget: idle 3 min logged out = **0** Realtime WS frames. Idle logged in with realtime on = **only** channels in matrix.

### 6.3 Work items

| ID | Task |
|----|------|
| 3.1 | Formalize channel matrix in code (`realtime/registry` or documented flags) |
| 3.2 | Remove or gate `useRealtimeProjects` from default Dashboard |
| 3.3 | Scope comments realtime to detail only (verify) |
| 3.4 | Navbar: notifications/invites subscribe only when flag + user |
| 3.5 | Dev logging for subscribe/unsubscribe (dev-only) |
| 3.6 | Integration test or script listing active channels (optional but preferred) |

### 6.4 Pass criteria (all required)

- [ ] With realtime **disabled**: idle 3 min on `/idea` logged out and logged in → **0** Supabase Realtime WebSocket connections.
- [ ] With realtime **enabled**: only matrix channels appear; **no** global projects channel on list unless explicitly flagged.
- [ ] Navigate idea A → idea B: comments channel for A removed; B created (no leak).
- [ ] Written egress notes attached (HAR or Network summary).
- [ ] §1.3 smoke green including notifications if logged in.

**Fail if:** projects full-table realtime still default-on; duplicate channels observed; polling reintroduced without approval.

---

## 7. Phase 4 — Data layer (React Query + Zustand discipline)

### 7.1 Problem addressed

**R8, R9** — Refetch storms and render fan-out.

### 7.2 Design requirements

1. **TanStack Query (or equivalent) is the source of truth for server state** for: project list, project detail, notifications list/count (when not purely realtime), user profile fetch.
2. Zustand retains **client UI state** only (modals, local selection, ephemeral UI) — not a second uncached server cache long-term. Migration may be incremental but each migrated endpoint must meet cache rules.
3. Default query policy (unless justified):
   - `staleTime` ≥ 30s for lists, ≥ 15s for detail
   - `refetchOnWindowFocus`: false **or** throttled ≥ 60s
   - No duplicate in-flight requests for same key
4. All new store subscriptions use **selectors**; ban new `const { ... } = useAppStore()` without selector in touched files.
5. List filtering: `useMemo` where derived; cards memoized if props stable.

### 7.3 Work items

| ID | Task |
|----|------|
| 4.1 | Add `QueryClientProvider` at app shell |
| 4.2 | Migrate `fetchProjects` / idea list to `useQuery` + infinite query if needed |
| 4.3 | Migrate idea detail fetch to `useQuery` |
| 4.4 | Migrate notifications initial fetch to `useQuery` |
| 4.5 | Refactor high-traffic components to selectors; memo `IdeaCard` |
| 4.6 | Remove redundant store mirrors when safe |

### 7.4 Pass criteria (all required)

- [ ] Cold open `/idea` then navigate away and back within `staleTime`: **≤ 0 redundant full list fetches** (Network proof).
- [ ] Two components mounting same query key produce **one** network request.
- [ ] Vote / comment still updates UI correctly (optimistic or invalidate documented).
- [ ] No new full-store subscriptions in files touched by this phase (lint rule or PR review checklist).
- [ ] §1.3 smoke green.
- [ ] TBT or interaction responsiveness improved vs Phase 0 on long list (qualitative + Lighthouse or Profiler note).

**Fail if:** React Query added but list still only uses Zustand fetch without query keys; cache always stale (staleTime 0 everywhere without justification).

---

## 8. Phase 5 — Security hardening (web) — **high bar**

> Deferred from performance phases but **not optional** for production readiness.

### 8.1 Problem addressed

**R12, R13, R14** + standard web app hardening.

### 8.2 Threat themes

| Theme | Risk |
|-------|------|
| XSS via markdown/HTML | Account takeover, token theft from `localStorage` |
| Auth token in `localStorage` | XSS → full session steal |
| Admin UI in client | Attack surface / logic leakage (auth still required server-side — verify) |
| CSRF / CORS misconfig | Cross-site API abuse |
| Dependency CVEs | RCE/supply chain |
| Open redirects / OAuth | Account linking abuse |
| IDOR on APIs | Data leak (backend verification) |

### 8.3 Work items

| ID | Task | Notes |
|----|------|-------|
| 5.1 | **Remove `rehype-raw` or sanitize with proven allowlist** | Prefer markdown-only; if HTML needed, use hardened sanitizer (DOMPurify) with strict allowlist; document policy |
| 5.2 | CSP headers (Next headers / reverse proxy) | `default-src 'self'`; explicit wallet/Supabase/GA exceptions; **no** `unsafe-eval` unless proven required then justify |
| 5.3 | Security headers | `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors` |
| 5.4 | Auth token storage review | Prefer httpOnly cookie session if backend can support; if JWT stays in localStorage, CSP + XSS elimination is mandatory pass |
| 5.5 | Admin routes | Server-side authz enforced (already? verify); minimize admin code in public bundles (dynamic import + auth gate); no “security by obscure path” |
| 5.6 | API hardening checklist with backend | Rate limits on auth; CORS allowlist exact origins; no `*` with credentials |
| 5.7 | Dependency audit | `npm audit` high/critical: fix or document waiver with expiry |
| 5.8 | Secret scan | Ensure no keys in repo/history for frontend |
| 5.9 | OAuth redirect allowlist | Verify Supabase redirect URLs production-only |
| 5.10 | Security test notes | Manual XSS attempts on comment/idea markdown; confirm blocked |

### 8.4 Pass criteria (all required — **highest bar**)

- [ ] **XSS:** User-controlled markdown/HTML cannot execute script in Chromium (test payloads recorded; all blocked).
- [ ] **CSP:** Deployed (staging + prod plan) with report or enforced mode; documented exceptions only.
- [ ] **Admin:** Unauthenticated call to admin APIs returns 401/403 (backend proof). Obscure admin path is **not** accepted as a control.
- [ ] **CORS:** Production API rejects unknown origins.
- [ ] **Tokens:** Either httpOnly cookie migration complete **or** written residual risk acceptance + CSP+XSS pass + short token TTL documented.
- [ ] **npm audit:** 0 critical/high without signed waiver (owner + expiry date ≤ 90 days).
- [ ] **Headers:** Security headers present on production responses (curl proof).
- [ ] §1.3 smoke still green after CSP (wallet connect often breaks bad CSP — must be fixed, not CSP disabled).

**Fail if:** `rehype-raw` still unrestricted; CSP absent; admin “hidden URL” treated as security; wallet broken so CSP removed.

---

## 9. Phase 6 — Architecture cleanup & permanence

### 9.1 Problem addressed

**R10, R11, R15** — Long-term maintainability and prevention of regression to “global heavy shell”.

### 9.2 Work items

| ID | Task |
|----|------|
| 6.1 | Pin all critical deps; remove `"latest"` |
| 6.2 | Delete dead files (`* 2.tsx` duplicates), unused deps (syntax-highlighter if unused) |
| 6.3 | Framer Motion: remove from non-essential surfaces; optional full removal |
| 6.4 | Expand Server Components for static pages (terms, privacy, docs content) |
| 6.5 | ESLint rules: ban direct wallet imports outside wallet boundary; ban full-store subscribe pattern (warn→error) |
| 6.6 | CI: bundle size budget fail on PR if `/idea` initial JS exceeds cap |
| 6.7 | CI: `npm audit --audit-level=high` |
| 6.8 | Document architecture decision records (ADR) for wallet boundary + realtime matrix |

### 9.3 Pass criteria (all required)

- [ ] Zero `"latest"` in `frontend/package.json`.
- [ ] CI bundle budget enforced (threshold set from Phase 2 numbers + margin).
- [ ] No duplicate `* 2.*` cruft in frontend.
- [ ] ADR docs merged.
- [ ] Static legal pages do not load wallet graph.
- [ ] §1.3 smoke green.

**Fail if:** budgets not in CI; pins not done; wallet imports creep back without lint.

---

## 10. Out of scope (explicit)

- Full rewrite of backend business logic
- New product features (feeds redesign, etc.) unless required by a phase
- Mobile native feature parity beyond not breaking Capacitor web split
- Pixel-perfect redesign of non-core pages (can inherit tokens gradually)

---

## 11. Pass Report template (copy per phase)

```markdown
# Pass Report — Phase N: <name>

Date:
Branch / commit:
Author:

## Metrics
| Metric | Phase 0 | This phase | Δ |
|--------|---------|------------|---|
| ... | | | |

## Evidence links
- Bundle analyzer:
- Lighthouse:
- Network notes / HAR:
- Screenshots:

## Checklist
- [ ] All phase pass criteria met
- [ ] §1.3 smoke 100%
- [ ] No new P0 bugs
- [ ] Feature flags documented

## Residual risks
-

## Sign-off
Product:
Eng:
```

---

## 12. Definition of Done (whole program)

Program is **complete** only when:

1. Phases 0–6 all have approved Pass Reports.
2. `/idea` cold load wallet-free; wallet loads on demand.
3. Realtime channel matrix enforced; idle egress documented and within policy.
4. Server state cached via Query layer with proven no-dup fetches.
5. Security Phase 5 criteria all green (XSS, CSP, admin API, audit, headers).
6. CI prevents regression (bundle budget + audit).

Anything less is **not** done — including “we made it feel faster” without evidence.

---

## 13. Immediate next action

1. Run **Phase 0** on current branch; fill §1.4.
2. Do not start wallet isolation until Phase 0 Pass Report exists.
3. Phase 5 security may be scheduled in parallel **design** (threat model doc) but **implementation** after Phase 1 at earliest (CSP must account for wallet domains after lazy wallet lands).

---

## 14. Quick reference — phase → root causes

| Phase | Root causes closed |
|-------|-------------------|
| 0 | Measurement gap |
| 1 | R1, R2 |
| 2 | R3, R4, R5 |
| 3 | R6, R7 |
| 4 | R8, R9 |
| 5 | R12, R13, R14 (+ headers/deps) |
| 6 | R10, R11, R15 + regression guards |
