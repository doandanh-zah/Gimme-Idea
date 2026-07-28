# Pass Report - Phase 0: Baseline & Instrumentation

Date: 2026-07-20; updated 2026-07-26
Branch / commit: main / 68afd91 + working tree changes
Author: Codex

## Production Env Flags Observed

Source: `frontend/.env.local` for local production build. Secret-like values were not read or recorded.

| Env var | Value |
|---------|-------|
| `NEXT_PUBLIC_ENABLE_REALTIME` | unset |
| `NEXT_PUBLIC_DISABLE_REALTIME` | unset |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pcipyfyannlmvaribhub.supabase.co` |
| `NEXT_PUBLIC_SOLANA_NETWORK` | `devnet` |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | `https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY` |

Realtime effective state: off by default because `NEXT_PUBLIC_ENABLE_REALTIME !== "true"` makes `featureFlags.disableRealtime` true.

## Metrics

Build command: `npm run build` in `frontend/`.

| Metric | Phase 0 |
|--------|---------|
| Next build `/landing` First Load JS | 885 kB |
| Next build `/idea` First Load JS | 524 kB |
| Next build `/idea/[id]` First Load JS | 706 kB |
| Manifest `/landing` asset set | 3,394.9 kB raw / 936.4 kB gzip |
| Manifest `/idea` asset set | 2,147.5 kB raw / 604.9 kB gzip |
| Manifest `/idea/[id]` asset set | 2,843.9 kB raw / 782.8 kB gzip |
| Largest wallet/polyfill-related baseline chunk | `static/chunks/6238-*.js` 147.5 kB raw / 44.4 kB gzip contains wallet adapter strings |
| Idle 3 min Network logged out `/idea` | Not captured: browser/HAR tooling absent in local env |
| Lighthouse mobile `/landing`, `/idea` | Not captured: Lighthouse absent in local env |

## Post-Program Browser Evidence

Final local browser artifact: [summary](../browser-evidence/2026-07-26T09-43-28Z/summary.md).

- Chromium screenshots captured for `/landing`, `/idea`, `/docs`, `/hackathons`, `/auth/agent`, and `/settings/tokens` at 375px, 768px, and 1280px.
- Local smoke routes returned expected status codes, including `404` for `/does-not-exist`.
- Landing explore flow reached `/idea`.
- Current final-state `/idea` logged-out idle proof ran for 180000 ms with 36 total requests, 3 fetch/XHR requests, 0 WebSockets, 0 Supabase realtime WebSockets, and 0 repeated fetch/XHR URLs.
- HAR and NDJSON artifacts: `network-idea-logged-out.har` and `network-idea-logged-out.ndjson`.
- Current-state Lighthouse mobile JSON captured:
  - `/landing`: performance 0.71, LCP 6806 ms, TBT 109 ms, FCP 2609 ms, CLS 0.
  - `/idea`: performance 0.71, LCP 7131 ms, TBT 73.5 ms, FCP 2599 ms, CLS 0.062.
- Lighthouse artifacts: [landing](../lighthouse/lighthouse-landing-mobile.json), [idea](../lighthouse/lighthouse-idea-mobile.json).

## Analyzer Equivalent

Top route asset contributors from `.next/app-build-manifest.json`, layout + route chunks:

### `/idea/page`

| Raw | Gzip | File |
|-----|------|------|
| 316.8 kB | 98.5 kB | `static/chunks/aaea2bcf-41671d880718539a.js` |
| 215.6 kB | 62.8 kB | `static/chunks/3244-fd38455fb39f046c.js` |
| 184.0 kB | 48.8 kB | `static/chunks/1055-99bee83cec3aade2.js` |
| 168.1 kB | 52.2 kB | `static/chunks/fd9d1056-62176d3eadb9e5e1.js` |
| 147.5 kB | 44.4 kB | `static/chunks/6238-fd5ebd55f5147182.js` |
| 131.7 kB | 21.0 kB | `static/css/ed756b7bfe121eec.css` |
| 129.4 kB | 29.6 kB | `static/chunks/3a91511d-34f699759838a1e6.js` |
| 128.5 kB | 35.4 kB | `static/chunks/8261-400ab31ab7946e38.js` |
| 115.2 kB | 36.4 kB | `static/chunks/6814-05d8caae0b581b64.js` |
| 109.5 kB | 28.5 kB | `static/chunks/8069-fa217f3e17b08db9.js` |

## Initial Graph Package Evidence

String scan of baseline app manifest chunks:

| Route chunk set | Evidence |
|-----------------|----------|
| `/layout` | `crypto-browserify`, `Capacitor`, `wallet-adapter`, `Phantom`, `Solflare`, `Lazorkit` found |
| `/landing/page` | `crypto-browserify`, `Capacitor`, `Phantom`, `Solflare`, `Lazorkit` found |
| `/idea/page` | `crypto-browserify`, `Capacitor`, `Phantom`, `Solflare`, `Lazorkit` found |
| `/idea/[id]/page` | `crypto-browserify`, `Capacitor`, `Phantom`, `Solflare`, `Lazorkit` found |

## Evidence Links

- Build output: captured in terminal; key metrics copied above.
- Realtime inventory: [realtime-inventory.md](./realtime-inventory.md)
- Entry import inventory: [entry-import-inventory.md](./entry-import-inventory.md)
- Smoke checklist template: [smoke-checklist.md](./smoke-checklist.md)

## Checklist

- [x] Production build command runs after precondition icon import fix.
- [x] Baseline metrics table filled for build and route asset sizes.
- [x] Analyzer-equivalent artifact lists top route chunks by size.
- [x] Realtime inventory complete with file paths.
- [x] Confirmed production realtime default from env semantics.
- [x] Current-state Network HAR captured after phase work; original pre-Phase 1 HAR remains unavailable.
- [x] Current-state Lighthouse mobile captured; original pre-Phase 1 Lighthouse remains unavailable.
- [x] Browser smoke run on desktop/tablet/375px mobile recorded for the final local state.

## Residual Risks

- Phase 0 still does not have a true original pre-change HAR or Lighthouse capture; browser/Lighthouse tooling was added later and records the final local state instead.
- Authenticated smoke coverage still requires a test user and wallet/session credentials.
- Local `.env.local` points at a devnet RPC URL placeholder containing `YOUR_HELIUS_API_KEY`; wallet paths may fail until a real RPC is supplied.
- The work continues under user-requested sequential execution instead of waiting for per-phase approval.

## Sign-off

Product: local waiver by user instruction to continue phases in one run
Eng: Codex
