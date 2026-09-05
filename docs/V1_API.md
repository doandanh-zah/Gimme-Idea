# V1 API

Base path: `/v1`. JSON errors use `{ code, message, requestId }`. Authenticated routes require a verified bearer token. Economic mutations require an `Idempotency-Key` header where noted. Lists accept bounded `limit`/`offset` where implemented.

## Public discovery

- `GET /home` — public Problems, public Projects, open chain-confirmed Bounties, and public contextual Posts.
- `GET /problems`, `/ideas`, `/projects`, `/bounties`, `/organizations`
- `GET /problems/:slug`, `/ideas/:slug`, `/projects/:slug`, `/bounties/:slug`, `/organizations/:slug`
- `GET /search?q=` — public catalog only; no submission corpus.

## Auth and profile

- `POST /me/sync` — resolve/create the verified actor and sync provider defaults/reward wallet without accepting a client user ID.
- `POST /auth/mock` — development only and only when explicitly enabled; absent in production.

## Organization

Organization reads are public. Membership/permission checks are enforced for Bounty creation, judging, winner selection, and resolution. Full membership/invitation CRUD and dashboard aggregation remain a V1 blocker.

## Problem, Idea, and Project

- `POST /problems`, `POST /ideas`
- `POST /problems/:id/publish`, `POST /ideas/:id/publish`
- `POST /bounties/:id/projects` — create a private Build workspace after exact terms acceptance.

Patch/archive APIs, Project team invites, outcomes, and claiming imported Projects are not implemented yet.

## Bounty

- `POST /problems/:problemId/idea-bounties`
- `POST /ideas/:ideaId/build-bounties`
- `POST /bounties` — compatibility entry point; repository invariants are identical.
- `POST /bounties/:id/funding-intents` (`Idempotency-Key`)
- `POST /funding-intents/:id/submitted`
- `POST /bounties/:id/accept-terms`
- `POST /bounties/:id/winner` (`Idempotency-Key`)
- `POST /bounties/:id/resolutions`

Intent responses use `canonical: false`. Winner selection returns `chainCommitRequired: true`; resolution returns `chainActionRequired: true`. No endpoint claims settlement before reconciliation observes final Solana state.

## Private submission and judging

- `POST /bounties/:id/submissions`
- `GET /bounties/:id/submissions` — entrant sees own; assigned/organization judges see authorized set.
- `GET /submissions/:id` — unauthorized and unknown both return 404 after authentication.
- `PUT /submissions/:id/review`

Submissions require a verified payout-wallet snapshot. Project snapshots additionally require team payout acknowledgement.

## Social Quote/Post

- `POST /posts`
- `GET /posts?entityType=&entityId=`
- `GET /posts/:id`
- `POST /posts/:id/replies`

The server verifies that quote targets are public and captures a quoted snapshot. Likes, follows, and collections are modeled in the database but their complete APIs are outstanding.

## Research and imports

- `POST /research/runs` — queues a version-bound public research run.

Colosseum import runs in the worker through a configured official JSON feed; there is no public mutation endpoint. Admin review/promotion endpoints remain outstanding.

## Search

`GET /search` is bounded to 200 query characters and 100 rows. It includes public Problems, Ideas, Projects, Bounties, and Organizations only.

## Wallet and storage

- `POST /wallets/link-intent`, `POST /wallets/verify` — ten-minute, one-time, actor/address-bound Ed25519 challenge.
- `POST /withdrawals` (`Idempotency-Key`) — records an intent and returns `userSignatureRequired: true`; no platform hot-wallet transfer is implied.
- `POST /uploads/intents`, `POST /uploads/:id/complete`, `POST /uploads/:id/attach`
- `GET /uploads/:id/download` — authorized private download URL, 300-second expiry.

## Notifications, moderation, chain, operations

- `GET /notifications`, `PATCH /notifications/:id/read`
- `POST /moderation/flags`
- `POST /chain/events` — HMAC-protected ingestion with `(chain, signature, event_index)` deduplication.
- `GET /health`, `GET /ready`

Admin moderation/import/bounty operation endpoints, OpenAPI publication, and a real settlement relayer API are remaining work.
