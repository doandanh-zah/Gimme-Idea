# Gimme Idea — Security Audit

Audit date: 2026-09-05 (Asia/Ho_Chi_Minh)  
Mode: Daily, confidence gate 8/10  
Scope: Next.js frontend, Fastify API, PostgreSQL/Supabase data layer, Redis/BullMQ worker, Privy authentication boundary, Solana Anchor escrow, dependencies, CI/CD, and production HTTP posture.  
Standards: [OWASP Top 10:2025](https://owasp.org/Top10/), [OWASP ASVS 5.0.0](https://owasp.org/www-project-application-security-verification-standard/), STRIDE, and GitHub Actions secure-use guidance.

## Executive verdict

The public read-only experience has several sound controls: TLS/HSTS, a strict API CORS allowlist, global API rate limiting, generic 5xx responses, parameterized SQL, fail-closed authentication, signed wallet-link challenges, private uploads, replay-protected webhooks, and deterministic smart-contract CI.

The system is **not ready for real-money/mainnet operation**. The audit found one High, seven Medium, and two Low findings. The most important issue is a confirmed authorization mismatch: collection/search endpoints enforce visibility, while public detail endpoints do not. A private published Problem or Idea, or a draft/cancelled Bounty, can therefore be returned when its slug is known. Auth-dependent findings are currently dormant in production because Privy is not configured, but they become reachable as soon as login is enabled.

Recommended release gate: close GI-SEC-001 and GI-SEC-008 before enabling bounties or real funds; close GI-SEC-002, GI-SEC-003, GI-SEC-005, and GI-SEC-006 before enabling production authentication and AI processing.

## Architecture and attack surface

| Layer | Technology | Exposed surface |
|---|---|---|
| Web | Next.js 16 on Vercel | Public localized pages, client-side Privy integration, calls to REST API |
| API | Fastify 5 | Public catalog/detail/health routes; authenticated profile, wallet, entity, bounty, review, media, research, notification routes; chain webhook |
| Data | PostgreSQL on Supabase | Privileged server connection; RLS exists but server-side authorization remains authoritative |
| Storage | Supabase Storage | Signed upload intents and private submission media |
| Worker | BullMQ/Redis | Research, chain reconciliation, import, and notification jobs |
| Auth | Privy boundary | Server token verification; currently unconfigured and fail-closed in production |
| Chain | Anchor/Solana | Upgradeable Devnet bounty escrow; no mainnet deployment |
| Delivery | GitHub, Vercel, backend hosting | Vercel auto-deploys the web; backend deploy is path-filtered; only contract-specific GitHub CI exists |

## Verified security controls

- Production frontend and API use HTTPS with HSTS.
- API CORS accepted `https://www.gimmeidea.com` and rejected an untrusted test origin.
- API uses a 1 MiB body limit and a global 120 requests/minute rate limit.
- API 5xx responses are generic; server details stay in logs.
- Privy tokens are verified server-side for expected app and issuer; development tokens are rejected when development auth is disabled.
- Missing Privy configuration returns 401 rather than silently trusting the client.
- Wallet-link verification uses a random nonce, a domain-separated signed message, a ten-minute expiry, and one-time consumption.
- Uploads require authentication, ownership, type/size validation, signed URLs, and private storage for submissions.
- Chain webhook secrets are compared with a timing-safe digest; chain events have a uniqueness guard against replay.
- No runtime `eval`, `new Function`, `dangerouslySetInnerHTML`, direct `innerHTML`, or production child-process execution was found.
- Reviewed SQL value inputs are parameterized. Dynamic table selection in publishing is constrained by an internal enum.
- GitHub Actions use read-only repository permissions, full commit-SHA action pins, exact tool versions, a pinned Docker digest, and locked dependency installation.
- Current tracked files contain no known live Vercel, Render, Supabase secret, or personal-access-token prefixes supplied during deployment.
- Repository tests, lint, typecheck, frontend production build, and Rust tests passed during this audit.

## Findings

### HIGH — GI-SEC-001: Public detail endpoints bypass entity visibility and lifecycle restrictions

**Confidence:** 9/10  
**Phase:** 9 — OWASP assessment  
**Category:** OWASP A01:2025 Broken Access Control / STRIDE Information Disclosure  
**Location:** `packages/db/src/repository.ts:70`, `packages/db/src/repository.ts:148`, `packages/db/src/platform-repository.ts:307`, `packages/db/src/platform-repository.ts:383`, `apps/api/src/app.ts:262`, `apps/api/src/app.ts:275`

**Description:** Public catalog and search queries require `visibility='public'`, but public Problem and Idea detail queries only require `status='published'`. Related Ideas, the primary Problem, and a linked Project are also loaded without a visibility predicate. The public Bounty detail query has no lifecycle restriction and can return draft or cancelled records. Owners are allowed to publish entities whose visibility remains private or organization-only.

**Exploit scenario:**

1. An authenticated owner creates a private or organization-only Problem/Idea and publishes it, or an organization creates a draft Bounty.
2. An attacker learns or guesses the slug through a shared link, logs, browser history, analytics, or another relation.
3. The attacker calls the unauthenticated detail route.
4. The API returns content that the collection/search policy deliberately hides; an Idea response can also reveal the title and summary of a linked private Problem or Project.

**Evidence:** `findProblem` and `findIdea` contain `status='published'` but no visibility condition. `findBounty` filters only by slug. In contrast, `listCatalog` at `packages/db/src/platform-repository.ts:266` explicitly enforces public visibility and excludes draft/cancelled Bounties.

**Remediation:** Centralize a single public-visibility predicate and reuse it in list, search, home, detail, and relationship queries. Require `visibility='public' AND status='published'` for unauthenticated Problem/Idea reads, `visibility='public'` for linked Projects, and an explicit public Bounty status allowlist. Add integration tests for private, organization-only, draft, cancelled, and linked-private records.

**Priority:** P0 — fix now

### MEDIUM — GI-SEC-002: Profile sync can claim and reassign an unproved reward wallet

**Confidence:** 10/10  
**Phase:** 9 — Authentication and access control  
**Category:** OWASP A01/A07:2025 / STRIDE Spoofing and Elevation of Privilege  
**Location:** `packages/contracts/src/index.ts:140`, `apps/api/src/app.ts:155`, `packages/db/src/platform-repository.ts:235`

**Description:** The authenticated profile-sync route accepts any 32–64 character reward wallet address. The repository immediately marks it verified as `provider_attested`, and its conflict clause reassigns an existing `(chain,address)` row to the current user. This bypasses the signed-nonce wallet-link flow.

**Exploit scenario:**

1. After authentication is enabled, an attacker submits another user's known Solana address to `/v1/me/sync`.
2. The server records that address as the attacker's verified reward wallet and can move an existing wallet row away from its legitimate owner.
3. The attacker can satisfy downstream “verified wallet” checks and disrupt the legitimate owner's account. Direct withdrawal theft was not demonstrated because on-chain payout still requires the relevant signer/state flow.

**Evidence:** `syncActor` inserts `verified_at=now()` without a signature and executes `on conflict(chain,address) do update set user_id=excluded.user_id`.

**Remediation:** Remove `rewardWalletAddress` from profile sync. Only create or promote wallet records after the signed challenge succeeds. Never reassign an address on conflict; return 409 when it belongs to another user. If Privy embedded wallets are accepted as provider-attested, verify ownership server-to-server against Privy claims/API and bind the wallet to the authenticated Privy user.

**Priority:** P1 — fix this sprint

### MEDIUM — GI-SEC-003: Entity creation accepts foreign organization and private Problem identifiers

**Confidence:** 10/10  
**Phase:** 9 — Authorization  
**Category:** OWASP A01/A06:2025 / STRIDE Spoofing and Tampering  
**Location:** `packages/contracts/src/index.ts:152`, `packages/contracts/src/index.ts:168`, `packages/db/src/platform-repository.ts:330`, `packages/db/src/platform-repository.ts:354`

**Description:** `createProblem` accepts an arbitrary `organizationId` and inserts it without checking membership. `createIdea` links to an arbitrary `problemId` without checking existence, visibility, ownership, or organization access. This permits false organizational attribution and cross-tenant relationship creation.

**Exploit scenario:**

1. An authenticated attacker obtains a public or leaked organization/Problem UUID.
2. They create a Problem attributed to that organization, or an Idea linked to a Problem they cannot access.
3. They publish their entity, creating misleading attribution; combined with GI-SEC-001, linked private summaries may be disclosed publicly.

**Evidence:** Both UUIDs are schema-valid inputs, but the insert paths contain no organization membership or Problem visibility/ownership query. The Bounty creation path provides a positive contrast by checking owner/admin membership.

**Remediation:** Require appropriate organization membership before accepting `organizationId`. For Idea creation, allow public Problems or Problems the actor/organization can access, and reject all other IDs before insertion. Add cross-tenant negative tests.

**Priority:** P1 — fix this sprint

### MEDIUM — GI-SEC-004: Production frontend lacks CSP and anti-framing headers

**Confidence:** 10/10  
**Phase:** 5 and 9 — Infrastructure and security misconfiguration  
**Category:** OWASP A02:2025 / STRIDE Tampering and Elevation of Privilege  
**Location:** `apps/web/next.config.ts:2`; production response from `https://www.gimmeidea.com/en`

**Description:** The final production HTML response includes HSTS but no Content-Security-Policy, `frame-ancestors`, `X-Frame-Options`, `X-Content-Type-Options`, Referrer-Policy, or Permissions-Policy. No current XSS sink was found, so this is defense-in-depth rather than a confirmed XSS. The missing anti-framing policy permits clickjacking once authenticated actions are enabled.

**Exploit scenario:**

1. An attacker embeds Gimme Idea inside a transparent or misleading cross-origin iframe.
2. A logged-in user is induced to click controls aligned with the framed site.
3. A sensitive action may be triggered under the user's authenticated context.

**Evidence:** A live `curl -L -D -` check on 2026-09-05 showed the final 200 response with HSTS and none of the headers above. `next.config.ts` defines no `headers()` policy. MDN documents CSP `frame-ancestors` as the modern clickjacking control.

**Remediation:** Add a nonce-compatible CSP and at minimum `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a minimal Permissions-Policy. Roll CSP out in report-only mode first because Privy and wallet providers require an explicit allowlist.

**Priority:** P1 — fix this sprint

### MEDIUM — GI-SEC-005: Any authenticated user can enqueue unowned research runs and arbitrary versions

**Confidence:** 9/10  
**Phase:** 7 and 9 — AI security and insecure design  
**Category:** OWASP A06/A10:2025 / STRIDE Denial of Service  
**Location:** `apps/api/src/app.ts:690`, `packages/contracts/src/index.ts:291`, `packages/db/src/platform-repository.ts:1075`

**Description:** The research endpoint validates only entity type, UUID shape, and a positive integer version. It creates a database row and queue job without first checking entity existence, current content version, public visibility, ownership, or a role. Worker-side rejection occurs after resources have already been consumed. Arbitrary version values bypass the deduplication tuple.

**Exploit scenario:**

1. An authenticated attacker repeatedly submits random UUIDs or the same UUID with different positive versions.
2. Each unique tuple produces a database record and queue job.
3. Once the AI provider is enabled, valid public targets may also trigger avoidable provider spend. The global per-IP limit reduces rate but does not establish authorization or quota.

**Evidence:** `queueResearch` inserts directly into `research_runs`; the API immediately enqueues when the row is created. No ownership/current-version lookup precedes either action.

**Remediation:** Resolve the entity server-side, enforce public-or-owner access, derive the current version from the database, add per-user/daily quotas and concurrency limits, and enqueue only after an atomic authorized insert. Monitor failed runs and cost anomalies.

**Priority:** P1 — before enabling AI

### MEDIUM — GI-SEC-006: Production web/API deploys are not gated by application CI

**Confidence:** 10/10  
**Phase:** 4 — CI/CD pipeline security  
**Category:** OWASP A03/A08:2025 / STRIDE Tampering  
**Location:** `.github/workflows/verifiable-program-build.yml:3`

**Description:** The only repository workflow is scoped to smart-contract paths and the rebuild branch. Production deploys from `main` can proceed without repository-wide lint, tests, typecheck, build, dependency audit, secret scanning, or a required approval/status check.

**Exploit scenario:**

1. A vulnerable or simply broken application change reaches `main`.
2. Hosting auto-deploys it because no application security/test workflow is a required gate.
3. The defect becomes public before automated controls detect it.

**Evidence:** The workflow triggers only on `rebuild-gimme-idea-v2` and contract-related paths. The font commit received a Vercel production deployment while the contract workflow was not applicable.

**Remediation:** Add a `main` pull-request/push workflow covering frozen install, lint, typecheck, tests, production build, `pnpm audit`, `cargo audit`, secret scan, and optionally SBOM/SAST. Configure protected `main` with required checks and least-privilege deployment environments. Retain the existing full-SHA action pins.

**Priority:** P1 — fix this sprint

### MEDIUM — GI-SEC-007: Production dependency graphs contain known denial-of-service and cryptographic advisories

**Confidence:** 10/10 for package presence; exploit reachability not proven  
**Phase:** 3 — Dependency supply chain  
**Category:** OWASP A03/A04:2025 / Supply chain  
**Location:** `pnpm-lock.yaml`, `Cargo.lock`, `programs/bounty-escrow/Cargo.toml:19`

**Description:** `pnpm audit --prod` reports three High advisories: `bigint-buffer@1.1.5` through `@solana/spl-token`, and two `image-size@1.2.1` infinite-loop advisories through Privy/React Native/Metro. `cargo audit` reports `RUSTSEC-2024-0344` (`curve25519-dalek@3.2.0`) and `RUSTSEC-2022-0093` (`ed25519-dalek@1.0.1`), plus unmaintained/unsound transitive warnings. The Rust crypto path is pulled in by Anchor SPL's default Token-2022 features even though this program documents legacy SPL Token only.

**Exploit scenario:** An attacker would need a reachable application path that passes crafted buffers or unsafe key material into the vulnerable APIs. Such a path was not established in this audit. The immediate risk is vulnerable, unnecessarily broad code entering build/runtime artifacts and becoming reachable after later feature changes.

**Evidence:** JavaScript scan: 967 production dependencies, 0 Critical, 3 High. Rust scan: 289 locked dependencies and 2 vulnerabilities. `cargo tree -e features` shows Anchor SPL default features enabling Token-2022 and the affected Solana SDK crypto branch.

**Remediation:** Disable Anchor SPL default features and enable only the legacy token/associated-token features actually used, then rebuild and rerun tests/audit. Track upstream fixes or replace `bigint-buffer`; verify whether it enters deployed server/client bundles. Ask Privy/upstream to remove or upgrade the Metro `image-size` path and confirm it is absent from the production Next bundle. Add audited exceptions only with owner, reachability rationale, and expiry.

**Priority:** P1 — before real-money launch

### MEDIUM — GI-SEC-008: The deployed Devnet escrow binary does not match the reviewed source

**Confidence:** 10/10  
**Phase:** 9 — Software/data integrity and Solana  
**Category:** OWASP A08:2025 / STRIDE Tampering / Smart-contract integrity  
**Location:** `SMART_CONTRACT_V1_HARDENING_REPORT.md:157`

**Description:** The reviewed deterministic local executable hash differs from the current Devnet program hash, and the deployed binary lacks the repository's `security.txt`. The available wallet is not the upgrade authority. Therefore source review and local tests do not describe the code currently running on Devnet.

**Exploit scenario:** Users or backend code treat the reviewed repository as authoritative and submit Devnet transactions, but the executed bytecode is an older, unverified build with different behavior. Any fixed invariant in the current source may remain unfixed on-chain.

**Evidence:** Local reviewed hash begins `4a5901ec…`; deployed hash begins `e70ea81a…`. The current Devnet `security.txt` query fails. The existing hardening report records the ProgramData/authority check and explicitly concludes mainnet readiness “NO.”

**Remediation:** The actual upgrade authority must deploy the verified artifact, compare the post-deploy executable hash byte-for-byte, verify `security.txt`, run Devnet smoke/reconciliation, and archive the build provenance. Do not enable value-bearing flows until parity is proved. For custody invariants, add property/fuzz tests and obtain independent audit/formal evidence; the optional `qedgen-formal-verification` skill is not installed in this environment.

**Priority:** P0 — deployment blocker before any funds

### LOW — GI-SEC-009: Unauthorized scoring falls through to a server error

**Confidence:** 10/10  
**Phase:** 9 — Exceptional condition handling  
**Category:** OWASP A10:2025 / STRIDE Denial of Service  
**Location:** `packages/db/src/platform-repository.ts:717`

**Description:** When a caller is not an authorized reviewer, the access query returns zero rows, but the code immediately dereferences `access.rows[0].bounty_id`. This yields a 500 response and error log instead of a deliberate 403/404. It does not grant review access.

**Exploit scenario:** An authenticated user submits repeated unauthorized scoring requests, creating avoidable exceptions and noisy error logs. Global rate limiting caps the immediate volume.

**Evidence:** There is no `rowCount` or first-row guard between the access query and the insert.

**Remediation:** Check the access result and throw a typed 403 or 404 before starting the review insert. Add a negative authorization test.

**Priority:** P2 — fix this month

### LOW — GI-SEC-010: Public readiness endpoint exposes dependency configuration state

**Confidence:** 10/10  
**Phase:** 5 — Infrastructure shadow surface  
**Category:** OWASP A02:2025 / STRIDE Information Disclosure  
**Location:** `apps/api/src/app.ts:136`; production `/ready`

**Description:** The unauthenticated readiness response reveals whether database, AI provider, Redis, Solana, and storage integrations are configured, available, failed, or disabled. It does not expose credentials, but it improves attacker reconnaissance and reveals incident/deployment state.

**Exploit scenario:** An attacker polls `/ready` to learn when dependencies fail or new high-value integrations are enabled, then times targeted probing accordingly.

**Evidence:** Live `/ready` returns named component states; the route has no authentication or response redaction.

**Remediation:** Keep a minimal public liveness response and restrict detailed readiness to the hosting platform/private network, or return only aggregate ready/not-ready externally.

**Priority:** P2 — fix this month

## OWASP Top 10:2025 coverage

| Category | Result |
|---|---|
| A01 Broken Access Control | Failing: GI-SEC-001, 002, 003 |
| A02 Security Misconfiguration | Partial: API headers strong; frontend headers and readiness exposure remain |
| A03 Software Supply Chain Failures | Failing: GI-SEC-006, 007 |
| A04 Cryptographic Failures | Partial: timing-safe secret checks and TLS are good; transitive Rust crypto advisories remain |
| A05 Injection | No reportable finding: parameterized SQL and no dangerous runtime sinks found |
| A06 Insecure Design | Failing: organization/link authorization and research quota/authorization gaps |
| A07 Authentication Failures | Partial: verifier is sound/fail-closed; wallet provider attestation bypass remains |
| A08 Software or Data Integrity Failures | Failing: production CI gate absent and Devnet artifact parity fails |
| A09 Security Logging and Alerting Failures | Partial: structured request/error/audit logging exists; external alerting was not evidenced |
| A10 Mishandling of Exceptional Conditions | Partial: generic 5xx handling exists; scoring path and research failure amplification remain |

## STRIDE threat model

| Threat | Important assets | Current posture |
|---|---|---|
| Spoofing | User and wallet ownership, organization identity | Token verification good; wallet and organization association fail authorization checks |
| Tampering | Published data, CI artifacts, escrow program | Audit logs and pinned contract build help; app CI gate and Devnet parity fail |
| Repudiation | Bounty lifecycle, terms, payouts, wallet links | Terms hashes, chain signatures, idempotency, and audit records are positive controls |
| Information disclosure | Private ideas/problems/projects/submissions | Submission/project gates exist; public detail relations bypass visibility |
| Denial of service | API, AI budget, parsers | Global rate/body limits help; research queue and vulnerable parsers remain |
| Elevation of privilege | Judge/admin/wallet roles | Explicit Bounty role checks exist; wallet sync and cross-tenant entity links weaken the boundary |

## Data classification

| Class | Examples | Required handling |
|---|---|---|
| Public | Public catalog, published public content, on-chain addresses/signatures/state | Integrity controls, cache correctness, abuse controls |
| Internal | Readiness detail, research runs, operational logs, reconciliation state | Least privilege, redaction, retention, monitoring |
| Confidential | Private/org Problems and Ideas, Projects, submissions, reviews, user profiles, organization membership | Object-level authorization on every read/write, private storage, audit trail |
| Restricted secrets | Auth tokens, Privy secret, database credentials, Supabase service key, webhook secret, deployment tokens, upgrade keypair | Never in client/logs/repository; rotate after exposure; managed secret store; scoped access |
| High-integrity financial | Terms bytes/hash, prize/fee amounts, payout wallet, escrow PDA/vault, program artifact hash | Idempotency, signer/authority proof, finalized-chain reconciliation, independent audit |

## Remediation roadmap

### P0 — before enabling bounties or funds (about 1–3 engineering days plus authority coordination)

1. GI-SEC-001: unify and test public visibility/lifecycle rules.
2. GI-SEC-008: deploy the reviewed binary with the real authority and prove hash/security metadata parity.

### P1 — before production authentication/AI (about 3–6 engineering days)

1. GI-SEC-002: remove unproved wallet attestation/reassignment.
2. GI-SEC-003: add organization and Problem object-level authorization.
3. GI-SEC-004: deploy CSP and browser security headers.
4. GI-SEC-005: authorize, quota, and deduplicate research runs server-side.
5. GI-SEC-006: protect `main` with required app/security checks.
6. GI-SEC-007: minimize features, update/replace vulnerable dependencies, and document time-bounded exceptions.

### P2 — this month (about 2–4 hours)

1. GI-SEC-009: return a deliberate authorization error for scoring.
2. GI-SEC-010: separate public liveness from private detailed readiness.

## Verification record

- `pnpm test`: 16/16 tasks successful; all reported application tests passed across packages that contain tests.
- `pnpm lint`: 16/16 tasks successful.
- `pnpm typecheck`: 16/16 tasks successful.
- Frontend production build and responsive visual checks: passed before commit.
- `cargo test --workspace`: 6 Rust tests passed.
- `pnpm audit --prod`: 3 High, 0 Critical advisories.
- `cargo audit`: 2 vulnerabilities in 289 locked Rust dependencies; additional unmaintained/unsound warnings recorded.
- Production Vercel status for commit `0030fa6`: successful.
- Production frontend/API HTTP/TLS/CORS/header probes: completed non-destructively.
- Current tracked-file known-secret-prefix scan: clean.

## Limitations

- No destructive production exploit, credential replay, or data mutation was performed.
- Production Privy is not configured, so authenticated paths were verified by code trace/tests rather than live exploitation.
- No external penetration test, browser-driven DAST, independent smart-contract audit, formal verification, or mainnet test was performed.
- Full historical secret scanning could not be completed because Git revision traversal repeatedly stalled in this working copy. Current tracked content was scanned successfully; run Gitleaks/TruffleHog from a fresh clone and rotate any deployment/provider/server credential ever pasted into chat or another non-secret channel.
- Advisory presence is confirmed; reachability of the vulnerable JavaScript/Rust functions in production artifacts was not proven.

## Confidence calibration

- Total findings: 10
- CRITICAL: 0
- HIGH: 1 (average confidence 9/10)
- MEDIUM: 7 (average confidence 9.9/10)
- LOW: 2 (average confidence 10/10)
- INFO: 0
- False-positive candidates filtered: 12
- Mode: Daily (8/10 confidence gate)
- Baseline comparison: first full CSO report; 10 new, 0 resolved, 0 persistent.

Filtered examples include placeholder `.env.example` values, local/test keypairs covered by `.gitignore`, localhost HTTP/CORS, development logs, source maps, Anchor IDL/PDA visibility, static-enum SQL identifiers, fail-closed missing auth, and build-only dependency paths without established runtime reachability.
