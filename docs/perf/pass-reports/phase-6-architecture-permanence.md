# Pass Report - Phase 6: Architecture Cleanup & Permanence

Date: 2026-07-20; updated 2026-07-26
Branch / commit: main / 68afd91 + working tree changes
Author: Codex

## Evidence

- `frontend/package.json` has zero `"latest"` dependency pins.
- `rehype-raw` and unused `react-syntax-highlighter` removed from frontend dependencies.
- Wallet umbrella dependency replaced with direct Phantom/Solflare adapter packages.
- Duplicate cruft removed: `ConnectWalletPopup 2.tsx`, `LoginButton 2.tsx`, `WalletReminderBadge 2.tsx`, `AuthContext 2.tsx`, `imgbb 2.ts`.
- Next upgraded to `16.2.12`; build fixed with `next build --webpack` and `proxy.ts`.
- `sharp` overridden to `0.35.3` for the 2026 libvips advisory while retaining Next 16.
- Guard scripts added:
  - `npm run guard:imports`
  - `npm run guard:bundle`
  - `npm run security:markdown`
  - `npm run audit:high` (waiver-aware high/critical audit gate)
- Full-store Zustand subscriptions removed from previously warned files; `guard:imports` now fails by default on `useAppStore()` without selectors.
- Frontend polish continued beyond `/landing` and `/idea`:
  - `/projects` rebuilt around pool-focused rows, skeleton/error/empty states, and stable editorial layout.
  - `/feeds` rebuilt with accessible links/buttons instead of clickable cards, retry/error states, skeleton loading, and non-emoji feed labels.
  - `/dashboard` now fetches project data on direct route entry, removes duplicate Navbar, and replaces fake stats with derived metrics.
  - `/contact`, `/agents`, `/mobile`, `/donate`, `/leaderboard`, `/billing`, `/privacy`, and `/terms` moved closer to the shared `page-wash`, `ui-eyebrow`, `btn-primary`, `btn-ghost`, and low-rounding visual system.
  - `/docs` render layer rebuilt around the shared visual system while preserving the existing EN/VI content model.
  - `/landing` mobile hero panel was split below the first viewport so the fixed bottom nav no longer covers the "How it works" content.
  - `/auth/agent`, `/auth/callback`, `/maintenance`, `/settings/tokens`, `/feeds/[id]`, `/hackathons`, `/hackathons/[id]`, `/idea/[id]`, `/projects/[id]`, `/profile/[username]`, and `not-found` received follow-up loading/error/form/menu polish.
  - `/billing` form labels, autocomplete, focus states, and loading states improved.
  - `/privacy` and `/terms` converted back to static server pages with shared legal-page layout.
- CI workflow added at `.github/workflows/frontend-guardrails.yml`.
- Final full browser artifact captured before local browser tooling cleanup: [summary](../browser-evidence/2026-07-26T09-43-28Z/summary.md).
- Playwright package and Playwright-managed browser cache were removed after capture; evidence remains as committed artifacts.
- Current-state Lighthouse mobile artifacts captured for `/landing` and `/idea` under `docs/perf/lighthouse/`.
- ADRs added:
  - `docs/adr/0001-wallet-boundary.md`
  - `docs/adr/0002-realtime-channel-matrix.md`

## Metrics

| Metric | Phase 0 | Final |
|--------|---------|-------|
| `/idea` First Load JS | 524 kB | Next 16 build output no longer prints size table |
| `/idea` manifest budget | 604.9 KiB gzip baseline | 309.9 KiB gzip / 320 KiB budget |

## Checks Run

- `npm run build` in `frontend`: pass.
- `npm run guard:imports`: pass, no full-store subscription warnings.
- `npm run guard:bundle`: pass (`/idea/page` 309.9 KiB gzip / 320 KiB budget).
- `npm run security:markdown`: pass, 7 payloads rendered without executable markup.
- One-off browser evidence run before tooling cleanup: pass, including screenshot matrix, route smoke, 180000 ms logged-out egress proof, wallet intent boundary, data revisit proof, and Chromium XSS proof.
- Lighthouse mobile via temporary Chromium run before tooling cleanup: `/landing` performance 0.71, LCP 6806 ms, TBT 109 ms; `/idea` performance 0.71, LCP 7131 ms, TBT 73.5 ms.
- `npm run build` in `backend`: pass.
- `npm audit --audit-level=high` in `backend`: pass.
- `npm run audit:high` in `frontend`: pass with active expiring waivers.
- Local HTTP route checks against `http://localhost:3000`: `/feeds`, `/dashboard`, `/contact`, `/agents`, `/docs`, `/donate`, `/mobile`, `/projects`, `/leaderboard`, `/billing`, `/privacy`, `/terms`, `/hackathons`, `/auth/callback`, `/auth/agent`, `/settings/tokens`, `/maintenance`, `/feeds/test-feed`, `/idea/test-idea`, `/projects/test-project`, `/profile/test-user`, and `/hackathons/test-event` returned `200`; `/does-not-exist` returned `404`.
- `npm run audit:raw` in `frontend`: fails with documented residual Solana/MetaDAO crypto advisories.

## Checklist

- [x] Zero `"latest"` in `frontend/package.json`.
- [x] Bundle budget guard added and passing.
- [x] Duplicate `* 2.*` frontend files removed.
- [x] ADR docs added.
- [x] Static legal pages remain wallet-boundary clean by import guard.
- [x] Frontend audit high gate passes with expiring waivers.
- [x] Full-store subscription guard promoted from warning to error.
- [x] Browser evidence artifact captured and retained.

## Residual Risks

- `package-lock.json` files are ignored by current repo rules (`*.json` and backend package-lock ignore), so dependency lock changes are local unless repo policy changes.
- Full Framer Motion removal and broader Server Component conversion remain incremental cleanup beyond this pass. `/hackathons/[id]` still has older internal workflow sections, but its outer shell, loading/error states, sidebar buttons, mobile tab bar, and team settings overlay were improved in this pass.
- External proof still needed: funded wallet/passkey/on-chain E2E, Supabase OAuth allowlist dashboard verification, authenticated realtime matrix, and staging/production curl proof.
