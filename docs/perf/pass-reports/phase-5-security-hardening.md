# Pass Report - Phase 5: Security Hardening

Date: 2026-07-20; updated 2026-07-26
Branch / commit: main / 68afd91 + working tree changes
Author: Codex

## Evidence

- Markdown raw HTML disabled: `MarkdownContent` no longer imports or configures `rehype-raw`.
- Next security headers added in `frontend/next.config.js`: CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`; `X-Powered-By` disabled.
- Local header proof: `curl -sI http://localhost:3002/idea` returned CSP, nosniff, strict-origin referrer policy, permissions policy, and no `X-Powered-By`.
- Admin API proof: `curl -i http://localhost:3001/api/admin/status` returned `401 Unauthorized` with `{"message":"No token provided"}`.
- CORS proof: unknown origin preflight to `/api/admin/status` returned no `Access-Control-Allow-Origin`.
- Backend CORS changed to explicit `CORS_ORIGINS`/`FRONTEND_URL` allowlist with no wildcard credentials.
- Backend high/critical audit: `npm audit --audit-level=high` exits 0 after overrides; 12 moderate remain.
- Backend auth now sets `HttpOnly` cookie `gimme_auth_token` on wallet, email, and agent login/register flows, and clears it on `POST /api/auth/logout`.
- Auth guards now read session JWT from cookie first, with bearer token as a legacy/API fallback.
- Cookie proof: locally signed test JWT passed the guard via `Cookie: gimme_auth_token=...`; `/api/auth/me` returned `401 User not found`, proving auth reached user lookup rather than failing with `No token provided`.
- Logout proof: `curl -i -X POST http://localhost:3001/api/auth/logout` returned `Set-Cookie: gimme_auth_token=; ... HttpOnly; SameSite=Lax`.
- Frontend admin direct `fetch()` calls now use `credentials: 'include'` and no longer read `auth_token` from `localStorage`.
- Source scan: `rg "localStorage\\.(getItem|setItem)\\(['\\\"]auth_token|Authorization.*auth_token|Bearer .*auth_token"` across `frontend backend` returned no app-source matches.
- Secret scan: `rg` for common OpenAI/GitHub/Slack/private-key/Supabase-service-key patterns returned no matches outside ignored build/dependency artifacts.
- Markdown XSS guard added: `npm run security:markdown` renders 7 script/event/javascript/data payloads through `react-markdown` and passed. It also bans `rehype-raw` and unreviewed `dangerouslySetInnerHTML`.
- `crypto-browserify` direct dependency and webpack crypto fallback removed; `npm ls crypto-browserify` no longer shows it after prune.
- Frontend audit guard added: `npm run audit:high` now fails on unwaived high/critical findings or waiver expiry, while accepting the current MetaDAO/Solana waivers through 2026-10-18.
- Next upgraded to `16.2.12`; `sharp` overridden to `0.35.3` to clear the libvips high advisory without downgrading Next.
- Backend `brace-expansion` overridden to `5.0.8`, leaving no backend high/critical audit findings.
- Final Chromium XSS evidence: [summary](../browser-evidence/2026-07-26T09-43-28Z/summary.md).
- Browser XSS proof rendered 7 payloads in Chromium; all had `executed=false` and 0 dangerous rendered patterns.
- OAuth redirect allowlist requirements are documented in [oauth-redirect-allowlist.md](../../security/oauth-redirect-allowlist.md). Dashboard verification still requires Supabase project access.

## Token Storage Review

- New frontend logins no longer persist backend JWTs in `localStorage`; `api-client` stores only a non-sensitive `gimme_auth_session` hint and removes the legacy `auth_token`.
- Backend default `JWT_EXPIRES_IN` is now `7d` when unset.
- Cookie options are configurable through `AUTH_COOKIE_DOMAIN`, `AUTH_COOKIE_SAMESITE`, and `AUTH_COOKIE_SECURE`.
- Legacy bearer token fallback remains to avoid hard-cutting existing sessions and API clients.

## Dependency Audit

- Raw frontend `npm audit --audit-level=high` still exits 1 with 5 high vulnerabilities in Solana/MetaDAO transitives.
- Active machine-readable waivers: `frontend/audit-waivers.json`.
- Waiver rationale: `docs/security/npm-audit-waivers.md`.

## Checklist

- [x] Unrestricted raw HTML markdown removed.
- [x] CSP/security headers present locally.
- [x] Admin endpoints enforce backend auth guard.
- [x] CORS unknown origins are not allowed.
- [x] Backend high/critical audit clean.
- [x] httpOnly cookie migration complete for new web sessions.
- [x] Basic secret scan clean.
- [x] Frontend high audit guard passes with active expiring waivers.
- [x] Automated markdown XSS guard passes.
- [x] Browser XSS payload execution test captured in Chromium.
- [ ] OAuth redirect allowlist verified in Supabase dashboard.
- [ ] Production/staging curl proof captured.

## Residual Risks

- Phase 5 local web hardening is complete with Chromium XSS evidence.
- Remaining highest-bar proof requires Supabase dashboard access for OAuth redirect allowlist verification and a staging/production deployment URL for curl header/CORS proof.
- Bearer-token fallback is intentionally temporary for backwards compatibility. Remove it after a session migration window if no external API clients depend on it.
