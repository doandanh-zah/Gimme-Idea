# Gimme Idea — Phase 1 (Devnet MVP ~2 weeks)
## Commit-to-Build Marketplace (NO outlaw / NO revshare)

This spec describes the on-chain primitives + state model + escrow + reputation + UX flow for Phase 1.

## Goals
- Validate **demand**: do people actually put money behind ideas? (Support Pool as signal)
- Validate **execution market**: can community select a builder + get milestones delivered?
- Keep UX extremely simple.
- Avoid legal/security framing: **no revenue share, no profit token**.

## Core Flow
Idea → Stake/Support Pool → Builder Proposal → Community Vote → Escrow (milestones) → Proof → Approve → Unlock → Reputation updates

## Smart Contract Primitives (Solana / Anchor)
Program: `programs/gimme-idea`

Accounts (PDA):
- `GlobalConfig`: admin, accepted mint (USDC), proposal fee, vote duration, committee.
- `Idea`: metadata URI, status, totals, pool vault, vote end, winner.
- `StakePosition`: supporter stake per idea.
- `Proposal`: builder, plan URI, requested_total, milestones (max 3), vote_count.
- `VoteRecord`: 1 wallet = 1 vote per idea (MVP).
- `EscrowState`: escrow vault + released amount.
- `ReputationProfile`: counters for builder/supporter.

Token vaults:
- `pool_vault`: owned by Idea PDA.
- `escrow_vault`: owned by Escrow PDA.

## State Model
IdeaStatus: Open → Voting → Building → Completed | Cancelled

ProposalStatus: Submitted → Accepted → Completed (others Rejected)

MilestoneStatus: Pending → SubmittedProof → Approved

EscrowStatus: Active → Finished (or Paused/Cancelled)

## Escrow Rules (MVP)
- Supporters can refund only while Idea is Open/Voting.
- After Building starts, pro-rata refunds are **out of scope** for MVP.
- Milestones fixed to max 3; each milestone has (amount, deadline, proof_uri, status).
- Milestone approval by committee/admin (fast path for devnet demo).

## Reputation (MVP)
- Supporter: `support_count`, `support_amount_total`
- Builder: `proposals_won`, `milestones_completed`

Update points:
- `stake()` updates supporter counters.
- `finalize_winner()` increments builder `proposals_won`.
- `approve_and_release()` increments builder `milestones_completed`.

## UX Screens (MVP)
1) Idea list + detail
- Support (stake) button
- Proposal list + submit proposal

2) Stake modal
- input amount, confirm

3) Submit proposal
- repo/plan URI
- milestone amounts + deadlines

4) Voting
- pick one proposal

5) Building / Milestones
- builder submits proof
- committee approves + unlocks

6) Profile
- basic reputation counters

## Notes
- Voting tally enforcement is minimal on-chain for MVP. Committee finalizes winner after vote ends.
- Replace placeholder program id before deploy.
