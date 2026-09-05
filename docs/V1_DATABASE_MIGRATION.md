# V1 database migration

Migration: `20260904211500_backend_v1_convergence.sql`.

## Previous shape

The foundation schema assumed UUID authentication subjects, required every Project to reference an Idea, had no Idea/Build distinction for Bounties, represented submission content through overloaded Idea/Project foreign keys, and kept Discussions separate from the browser Quote/Post model. Escrow rows lacked enough commitments and observation metadata to reconcile PostgreSQL with Solana safely.

## V1 shape

- Identity uses `(auth_provider, auth_subject)`; the legacy UUID is nullable and preserved.
- Organization wallets, invitations, role permissions, and Problem ownership are explicit.
- Problems and Ideas gain visibility, content versions, richer structured fields, archive timestamps, and provenance.
- Projects may be community, winner-derived, or historical imports; imported Projects do not need an Idea.
- Bounties are `idea` or `build`, always belong to a Problem, and Build rows require a parent Idea Bounty plus selected Idea. Prize and fee remain raw integers.
- Terms payload/hash, participants, funding intents, escrow reconciliation data, payout intents, resolutions, and withdrawal intents are durable.
- Submissions are private, typed, versioned snapshots. Reviews point to a Submission; a partial unique index permits at most one winner per Bounty.
- Discussions are evolved in place into Posts. Replies, quoted snapshots, media metadata, and entity attachments share one model.
- Research runs are entity-version and pipeline-version bound. Import facts, Problem Signals, historical links, chain events/cursors, notifications, moderation, and audit data are durable.

Critical states are guarded with CHECK constraints and mirrored TypeScript/Zod values. PostgreSQL RLS is enabled as defense in depth; the Fastify access service remains the primary authorization boundary for service-role access.

## Data assumptions

Existing IDs are preserved. Legacy identities use provider `legacy` and their former UUID text as subject. Existing Projects retain their Idea link. Existing Bounties become Idea Bounties, begin outside the funded state, and receive versioned canonical terms. Existing Discussions become public discussion Posts. Existing submissions stay private; seed submissions intentionally have no verified payout snapshot and therefore cannot be selected as winners.

The migration never promotes prior private content to public. Seed URLs that are illustrative use the explicit `demo.gimme-idea.local` domain. Imported source data remains separate from canonical Problems until a human promotion decision.

## Rollback

This migration is intentionally forward-only in production because identity, privacy, and chain evidence would be lost by reverting. Before rollout, take a verified database snapshot and rehearse restore in a separate environment. Application rollback may target the preceding release only while writes are stopped; do not drop new tables or coerce non-UUID auth subjects back into `auth_user_id`. A failed rollout should restore the snapshot, not attempt a lossy down migration.

## Verification

Run `pnpm db:reset`, `pnpm db:seed:verify`, privacy/API integration tests, and the two-context E2E suite. The seed verifier checks primary Problem links, two-stage Bounty relationships, non-canonical private submissions, winner uniqueness, terms hashes, and escrow consistency.
