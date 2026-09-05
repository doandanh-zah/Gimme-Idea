# Gimme Idea Backend V1 Convergence Report

Audit date: 2026-09-05 (Asia/Ho_Chi_Minh)  
Scope: Phase 3 backend, database, worker, storage, AI/import, frontend adapters, and Solana integration.  
Verdict: substantial local convergence; **not complete for real-money launch or mainnet**.

## 1. Executive summary

Canonical shared product state now flows from the frontend through Fastify to PostgreSQL. Server-verified identity, private submissions/projects, canonical terms, two-stage Bounty invariants, signed storage, worker boundaries, chain-event deduplication, and reconciliation are implemented. A 5,000-request local origin benchmark completed with zero errors. Full economic E2E remains blocked because the reviewed hardened Solana binary is not deployed and transaction preparation/relayer execution are not implemented.

## 2. Current architecture after Phase 3

`apps/web` calls `apps/api`; PostgreSQL is workflow truth; Supabase Storage owns bytes; Redis/BullMQ coordinates optional background work; `apps/worker` performs research, imports, notifications, and Solana reconciliation. Solana alone determines funded/settled/refunded truth. `V1_SYSTEM_MAP.json` is the machine-readable inventory.

## 3. Database migrations

The timestamped non-destructive migration `20260904211500_backend_v1_convergence.sql` evolves legacy identity, domain, social, submission, research, import, and escrow structures. IDs and demo rows are preserved. Details and rollback guidance are in `docs/V1_DATABASE_MIGRATION.md`.

## 4. Final ER/domain model

The model keeps Problem, Idea, Project, Submission, Result, and Bounty distinct. Every Bounty has one Problem; Build Bounties require a paid parent Idea Bounty and its selected Idea. Historical Projects may exist without Ideas. See `docs/V1_DOMAIN_GRAPH.mmd`.

## 5. Authentication implementation

Bearer tokens are verified server-side through `@privy-io/server-auth`. Routes derive an actor from provider claims and never accept a client user ID as identity. Dev HMAC tokens are available only outside production and behind `ENABLE_DEV_MOCK_AUTH=true`; tests cover the production guard.

## 6. Privy user synchronization

`POST /v1/me/sync` resolves `(auth_provider, auth_subject)` and creates or reuses a user. Provider data supplies defaults. The current upsert still needs a stronger field-level “user edited” policy before rich profile editing ships.

## 7. Reward wallet synchronization

Privy-attested embedded Solana addresses are stored as verified reward wallets without private keys. External wallets use a short-lived, single-use, domain-separated Ed25519 challenge. Submission payout addresses are immutable verified snapshots.

## 8. Organization permission matrix

Owner/admin can create/fund/configure; owner/admin/judge can review and request resolution; entrants see their own submissions; Build participants receive only the selected-direction access bound to accepted terms. Complete membership/invite CRUD and audited moderator escalation are outstanding.

## 9. Funding wallet model

Organization funding context and user reward wallets remain separate. Funding intent records the external funder, mint, raw amount, expected PDA, expiry, and idempotency key. The platform does not claim ownership of or sign with the sponsor wallet.

## 10. Problem API

Public list/detail and authenticated create/publish are implemented. Structured Problem fields, organization ownership, visibility, version, provenance, and research state are persisted. Patch/archive/admin-promotion endpoints remain open.

## 11. Idea API

Public list/detail and authenticated create/publish are implemented. A published Idea has a primary Problem. Winning submission promotion is modeled and performed transactionally during winner selection, but cannot become economically final until chain settlement is observed.

## 12. Project API

Public list/detail and authorized private Build Project creation are implemented. Historical Projects do not require an Idea. Team invite/member, outcome, and imported-project claiming APIs are not complete.

## 13. Quote/Post API

Posts and replies persist in PostgreSQL. The target must exist and be public; reply parents must belong to the same Post. Public contextual Posts are included in Home and `GET /v1/posts/:id` hydrates cross-device Post detail plus replies. Complete likes/follows/collections API migration remains technical debt.

## 14. Bounty API

Contextual Idea- and Build-Bounty creation, terms acceptance, funding intents, submissions, judging, winner choice, and resolution requests exist. Repository constraints prevent orphan Bounties and early Build funding. Economic responses explicitly remain non-canonical until reconciliation.

## 15. Private Submission architecture

Idea payloads and Project snapshots are private by default. Owner and authorized company reviewers receive filtered access; unknown and unauthorized identifiers converge on 404 after auth. Public list/search/Home queries do not include submissions.

## 16. Idea winner promotion

Winner selection locks the Bounty, enforces one winner, selects a submitted Idea, snapshots the verified payout wallet, and creates a restricted canonical Idea. It does not auto-publish the winner.

## 17. Private Project snapshot design

A Build submission stores a versioned immutable snapshot; later Project edits do not alter judging evidence. Team payout acknowledgement and the verified payout address are captured at submission.

## 18. Judging

Reviews reference submissions and criteria, with a unique reviewer/submission constraint. Access is limited to organization owners/admins/judges. Private judge-note serialization needs a dedicated DTO and broader adversarial coverage before launch.

## 19. Winner selection saga

Serializable/locked database work prevents concurrent winners, records audit evidence, creates the restricted winner entity/result/payout intent, and moves to `winner_pending_chain`. The missing next step is a signed judge/arbitrator transaction preparation endpoint.

## 20. Payout integration

Payout recipient must equal the verified submission wallet snapshot. The API now returns `chainCommitRequired: true` and does not pretend a settlement worker exists. Backend relayer execution and retry/dead-letter operations remain launch blockers.

## 21. DB ↔ Solana mapping

Mapping persists cluster, program, expected PDA, UUID-derived bounty ID, terms hash, mint, prize, fee, total, winner, slot, status, and errors. Reconciliation compares every commitment before projecting product state.

## 22. Event/indexer implementation

An HMAC-protected chain-event endpoint persists raw decoded evidence and deduplicates `(chain, signature, event_index)`. Scheduled account reconciliation is authoritative recovery. A production webhook/provider adapter and durable cursor advancement are incomplete.

## 23. Reconciliation

The worker reads finalized account context, validates program ownership, decodes the escrow, and calls the repository reconciler. Mismatches create error/resolution evidence instead of promoting financial state. RPC timeout wrappers and per-account isolation need hardening.

## 24. Resolution/refund operations

Resolution intents and audited reasons are durable. The API returns `chainActionRequired: true`; it does not enqueue a nonexistent executor. Arbitration/refund transaction preparation and authority operations are not implemented.

## 25. User withdrawal architecture

Withdrawal metadata is idempotent and requires a verified source wallet. The response requires the user's signature and makes no custody claim. A prepared transfer transaction, confirmation tracking, and reward-history projection remain open.

## 26. Historical Project import

Historical Projects are first-class imported records with preserved source facts and outcomes. They may link directly to Problems and do not masquerade as community Projects or canonical Ideas.

## 27. Colosseum importer

The worker consumes only a configured HTTPS official JSON feed, normalizes minimally, hashes raw payloads, and upserts idempotently. The live feed was not configured or exercised in this environment.

## 28. Problem Signals

Problem Signals are non-canonical records with evidence, confidence, review status, and potential promotion. Admin review/promotion APIs and UI remain outstanding.

## 29. Historical relationships

`problem_project_links` records relation type, similarity score/method, rationale, and human review. The model avoids labeling every old or failed Project a “previous attempt.”

## 30. AI Researcher

The researcher is provider-abstracted, version-bound, schema-checked, public-data-only, and requires HTTPS evidence for factual claims. It can be disabled without breaking core product flows.

## 31. AI Verifier

A distinct second prompt returns supported/unsupported/unknown verdicts and evidence coverage. Unit tests cover result/source validation. No live provider-quality result is claimed.

## 32. AI privacy controls

General AI input excludes private submissions, private Projects, judge notes, attachments, and organization-only records. Private landscape checking is not enabled. Provider retention/DPA controls must be selected before any private AI feature.

## 33. Search

Public full-text search includes Problems, Ideas, Projects, Bounties, and Organizations only. Query length and result count are bounded. Private-content and direct-ID checks passed in local integration.

## 34. Home feed

Home ranks open verified Bounties first, then public Problems, contextual Posts, and public Projects, while applying a per-type quota so a burst in one category cannot starve all others. It excludes private and restricted competition work. Seed Bounties awaiting funding are intentionally absent rather than displayed as funded opportunities.

## 35. Object storage

Public and private buckets are separate. Submission attachments must use the private bucket. Local verification passed owner download, anonymous 401, stranger 404, and a 300-second signed URL. Malware scanning/quarantine is not implemented.

## 36. Notification system

Notifications persist, list per actor, mark read, and deduplicate by optional key. Winner notification creation exists. External delivery is a truthful no-adapter worker result, not a false success.

## 37. Moderation

Authenticated users can create durable moderation flags. Complete moderator queue, audited private-content access, decisions, appeals, and notification workflows are not implemented.

## 38. Audit logs

Bounty creation, funding intent, winner selection, resolution, wallet link, and withdrawal events emit durable audit rows. A privacy scrubber, retention policy, and immutable export are still required.

## 39. Redis/BullMQ

Queues exist for research, chain reconciliation, imports, and notifications with scheduled reconciliation/import jobs. Unit tests pass. Redis runtime verification is blocked on this host because Docker cannot resolve `docker-credential-desktop` and no Redis service/image is available.

## 40. Caching

Redis is not canonical. The current API mostly reads PostgreSQL directly; Next server fetches use bounded revalidation. A visibility-aware cache-key scheme and invalidation service are not yet implemented, so no cache-performance claim is made.

## 41. Security controls

Controls include server auth, explicit dev-auth guard, Helmet, allow-listed credentialed CORS, 1 MiB body limit, rate limiting, Zod validation, parameterized SQL, request IDs, webhook HMAC comparison, wallet signature verification, private storage checks, and economic idempotency. Root overrides remediated the 19 advisories with upstream fixes; `pnpm audit --prod` now reports 3 high advisories in unpatched `bigint-buffer` and `image-size` transitive paths. CSRF for future cookie auth, secret rotation, upstream dependency remediation/risk acceptance, and external review remain.

## 42. Privacy tests

API tests prove anonymous rejection, same-subject stability, and stranger non-disclosure. Integration checks prove private titles are absent from search/direct public reads. Storage authorization checks pass. The full four-role matrix still needs production-like E2E fixtures.

## 43. Cross-device tests

The API integration script proved Problem and Post persistence across clients. Playwright now creates a canonical Problem/Post in one isolated browser context and reads it from another with empty localStorage. Important shared state is server-backed.

## 44. Chain failure tests

Local Anchor tests cover wrong mint/amount/terms, unauthorized actors, replay, cancellation, resolution, settlement, and separate escrows. Backend event deduplication and mismatch handling are tested. RPC timeout, rejected wallet transaction, missed webhook recovery, and relayer retry are not end-to-end verified.

## 45. AI/worker failure tests

AI-disabled behavior and schema/source rejection are unit tested. Import normalization is tested. Redis outage/resume and worker restart durability were not runtime-tested because Redis was unavailable.

## 46. E2E results

The first full run against stale Phase 1 fixture assumptions produced 57 passed, 31 failed, and 2 skipped, exposing genuine harness/model drift. After migrating tests to signed dev auth, canonical API writes, balanced Home feed selection, and server-backed Post detail reads, the authoritative full rerun completed with **85 passed, 2 skipped, 0 failed** across mobile 360, tablet 768, and desktop 1280. The skips are the intentionally viewport-gated screenshot cases. Complete economic Idea→Build journeys remain blocked, not skipped into a false success.

## 47. Load-test results

`artifacts/load-v1-2026-09-05.json` records 5,000 requests at concurrency 50: 0 failures, 3,155.9 requests/second, p50 13 ms, p95 30.4 ms, p99 149.7 ms, duration 1,584 ms. This is a local origin benchmark with logging disabled and benchmark-only raised rate limit; it is not internet or 5,000-browser capacity evidence.

## 48. Remaining technical debt

Finish CRUD/team/outcome/social/admin APIs; publish OpenAPI; centralize authorization as a Fastify plugin; add typed DTO serializers; implement RPC deadlines and circuit breaking; add Redis/cache/runtime recovery tests; add media malware scanning; replace deprecated Privy server package path if upstream requires; remediate/accept dependency advisories.

## 49. Remaining product blockers

Organization onboarding/invites, complete company dashboard, clarification threads, losing-Idea publication choice, imported Project claim, optional interview/contract flow, moderation operations, and research/admin promotion flows are incomplete.

## 50. Remaining real-money launch blockers

Deploy and verify the reviewed program; implement funding/judge/resolution transaction preparation; implement and secure the permissionless settlement relayer; verify payout reconciliation and reward history; configure production RPC/storage/Redis/Privy; add monitoring/incident procedures; complete dependency and independent contract/backend security reviews.

## 51. Mainnet readiness

**NO.** External contract audit: none. Mainnet mint/RPC: unset. Upgrade, pause, arbitration, treasury, and relayer custody: not production-reviewed. Monitoring and incident procedures: incomplete. The Devnet deployed hash differs from the reviewed local binary and lacks the reviewed `security.txt`; the available wallet is not upgrade authority. No mainnet deployment is authorized or recommended.
