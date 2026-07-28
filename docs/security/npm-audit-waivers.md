# npm Audit Waiver Proposals

Date: 2026-07-20; updated 2026-07-26
Owner: Frontend / Platform
Expiry: 2026-10-18

These are active waivers for residual frontend high-severity advisories after non-breaking fixes, dependency pinning, Next upgrade, wallet adapter surface reduction, and transitive overrides. They require product/security sign-off before Phase 5 can be considered a full external-production pass.

## Frontend Residual High Advisories

| Package | Source path | Status |
|---------|-------------|--------|
| `@metadaoproject/futarchy` | Direct dependency for MetaDAO/pool flows; pulls Anchor, Squads, Solana SPL token, Bundlr, and esbuild transitives | No compatible non-breaking replacement applied. `npm audit fix --force` proposes breaking dependency changes. |
| `@solana/buffer-layout-utils` | Transitive through `@solana/spl-token`, MetaDAO, and Squads | No compatible non-breaking fix identified. |
| `@solana/spl-token` | Direct dependency and transitive through MetaDAO/Squads | Needed by wallet/on-chain pool flows; force fix proposes breaking downgrade. |
| `@sqds/multisig` | Transitive through MetaDAO/Squads integration | No compatible non-breaking replacement applied. |
| `bigint-buffer` | `@solana/buffer-layout-utils` via `@solana/spl-token`, `@metadaoproject/futarchy`, `@sqds/multisig` | No non-breaking fix identified; `npm audit fix --force` proposes breaking Solana package downgrade. |

## Mitigations Already Applied

- Removed `@solana/wallet-adapter-wallets` umbrella dependency.
- Limited wallet/web3 imports to lazy wallet/admin/on-chain boundaries.
- Added CSP and removed raw HTML markdown rendering.
- Migrated new backend web sessions from `localStorage` JWT storage to `HttpOnly` cookie `gimme_auth_token`; only a non-sensitive client session hint remains.
- Removed direct `crypto-browserify` dependency and disabled browser crypto fallback in Next webpack config.
- Upgraded Next to `16.2.12` and overrode `sharp` to `0.35.3` to clear the 2026 libvips high advisory without downgrading Next.
- Added backend `brace-expansion` override `5.0.8`; backend `npm audit --audit-level=high` now exits 0.
- Added `frontend/audit-waivers.json` and `npm run audit:high` guard so high/critical findings require active waivers and expire by policy.
- Added `npm run security:markdown` guard for markdown XSS payload rendering and static markdown-safety checks.
- Added `npm run guard:imports` and bundle budget CI guard.

## Required Follow-Up Before Expiry

- Replace or upgrade MetaDAO/Bundlr/Anchor dependencies when compatible releases remove vulnerable transitives.
- Re-evaluate whether `crypto-browserify` fallback can be removed from wallet chunks.
- Remove legacy bearer-token fallback after the web session migration window, unless an API-client compatibility requirement is explicitly accepted.
