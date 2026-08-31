# Gimme Idea

> V2 Foundation is implemented on `rebuild-gimme-idea-v2`. It deliberately includes public read paths only: no authentication flow, AI provider, Redis queue, wallet, funding, payout, or deployed Solana program.

## Run the foundation

Requirements: Node `22.23.2`, pnpm `10.18.3`, Docker Desktop, and Corepack.

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
pnpm db:start
pnpm db:reset
pnpm db:seed:verify
pnpm dev
```

Public services:

- Web: `http://localhost:3000/en` (Vietnamese at `/vi`)
- API: `http://localhost:3001/health`
- Worker: `http://localhost:3002/health`
- Supabase Studio: `http://localhost:54323`

Quality gate:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Drizzle schema is the typed source in `packages/db/src/schema.ts`; timestamped SQL is reviewed and replayed through `supabase/migrations`. Never use `drizzle-kit push` on shared environments.

Gimme Idea is a **Problem Network** where people discover real problems, propose ideas, discuss different approaches, build projects, and fund solutions.

The product is not just an Idea Bank.

Its core model is:

```text
Problem
   ↓
Idea
   ↓
Project
   ↓
Submission
   ↓
Result
```

A Problem may also have an optional:

```text
Bounty
```

when a company, organization, sponsor, or individual wants to financially incentivize people to solve it.

---

# Product Vision

Problems, ideas, attempts, discussions, builds, hackathon submissions, research, and failure lessons are currently scattered across:

- social media;
- Discord;
- GitHub;
- hackathons;
- bounty platforms;
- startup databases;
- communities;
- research reports;
- private knowledge.

Gimme Idea aims to turn this fragmented information into a living network.

The platform should help answer:

- What problems are worth solving?
- Who actually experiences them?
- What solutions have already been proposed?
- Has someone tried this before?
- Why did previous attempts succeed or fail?
- Was failure caused by the idea, execution, regulation, distribution, or timing?
- What has changed since?
- Who is building a solution now?
- Is anyone willing to pay to have this problem solved?

---

# Core Objects

## Problem

A real-world problem, pain point, inefficiency, unmet demand, or constraint.

A Problem can exist without:

- an Idea;
- a Project;
- a Bounty;
- a company sponsor.

Problems can be posted freely.

---

## Idea

A proposed approach to solving a Problem.

Every published Idea must have exactly one **Primary Problem**.

A Problem may have many competing or complementary Ideas.

---

## Previous Attempt

A small research object inside an Idea describing similar approaches that have already been tried.

It may contain:

- project/company;
- period;
- approach;
- outcome;
- failure factors;
- root cause;
- what worked;
- what failed;
- what changed since;
- evidence.

A previous failure does **not** mean the current Idea is bad.

Timing, infrastructure, regulation, distribution, capital, team, and market readiness may all affect outcome.

---

## Project

A real implementation being built from an Idea.

A Project may contain:

- team;
- GitHub;
- demo;
- website;
- technical information;
- milestones;
- progress;
- real-world outcome.

---

## Submission

A specific submission of an Idea or Project into:

- a Gimme Idea Bounty;
- a hackathon;
- a grant;
- an external bounty;
- another opportunity.

A Project can have multiple Submissions.

A Submission Result is not the same as a Project Outcome.

---

## Bounty

An optional economic layer attached to a Problem.

A Problem does not require a Bounty.

A funded Bounty must lock its prize money in a Solana escrow before being shown as funded.

The blockchain is used for:

- fund locking;
- escrow;
- settlement;
- payout;
- refund;
- payment proof.

Problem, Idea, Discussion, Project, and AI research data stay off-chain.

---

## Discussion

Discussion is separate from canonical Problem/Idea content.

Instead of placing long comment threads directly under an Idea, users use:

**Discuss**

This creates a social post referencing the original Problem, Idea, or Project.

Canonical pages remain the source of truth.

Discussion pages contain the conversation.

---

# AI Philosophy

Gimme Idea is **not an AI idea generator**.

The user owns the thesis.

For an Idea, the creator provides at minimum:

```text
Title
One-line description
Primary Problem
Opportunity
Solution
```

The creator may provide additional information if they know it.

AI then researches the missing context.

The AI pipeline contains two different responsibilities:

```text
AI Researcher
↓
AI Verifier
```

The Researcher finds:

- evidence;
- competitors;
- alternatives;
- previous attempts;
- risks;
- timing;
- technical constraints;
- regulatory constraints;
- market signals.

The Verifier checks:

- whether sources exist;
- whether sources support claims;
- freshness;
- contradictions;
- unsupported inference.

AI must never silently rewrite the creator's thesis.

Unknown information must remain:

```text
Unknown
```

or:

```text
Insufficient evidence
```

instead of being hallucinated.

---

# Product Experience

The core mental model is:

```text
Find a Problem
↓
Understand it
↓
Explore Ideas
↓
Discuss
↓
Build
↓
Submit
↓
Earn / Get Hired
```

Gimme Idea should feel like a living problem and builder network, not:

- Reddit;
- Upwork;
- Product Hunt;
- Notion;
- a generic AI SaaS;
- a generic crypto dashboard.

---

# Frontend Direction

Frontend implementation must use the **Zahlook skill**.

The visual direction should feel:

- intelligent;
- experimental;
- technical;
- builder-focused;
- research-oriented;
- premium;
- playful without becoming childish.

Do not generate a generic SaaS dashboard.

---

# Landing Page

The landing page must include a strong Three.js experience.

Core visual:

**3D Brain / Idea Brain**

Scroll narrative:

```text
Problem signals
↓
Brain rotates
↓
Brain opens / fragments
↓
Ideas emerge
↓
Puzzle pieces / light bulbs / code / nodes appear
↓
Fragments connect
↓
Ideas become builds
↓
Funded problems introduce the economic layer
```

Three.js must be:

- lazy-loaded;
- isolated from core application bundles;
- mobile-aware;
- reduced-motion aware;
- performance-budgeted.

The 3D experience must never compromise the usability of the application.

---

# Architecture

V1 uses:

**Modular Monolith + Independent Workers**

High-level stack:

```text
Cloudflare
    ↓
Next.js Frontend
    ↓
Fastify API
    ↓
Supabase PostgreSQL
    +
Redis / BullMQ
    +
Object Storage

Workers:
- AI Research
- AI Verification
- Blockchain
- Notifications / Jobs

Solana:
- Bounty Escrow Program
```

Target:

**~5,000 concurrent users**

The architecture is read-heavy and should rely strongly on:

- CDN caching;
- Redis caching;
- stateless APIs;
- PostgreSQL connection pooling;
- asynchronous jobs.

---

# Main Technology Stack

## Frontend

```text
Next.js
React
TypeScript
Three.js
```

Recommended Three.js ecosystem:

```text
three
@react-three/fiber
@react-three/drei
```

---

## Backend

```text
Node.js
TypeScript
Fastify
```

---

## Database / Auth

```text
Supabase PostgreSQL
Supabase Auth
```

---

## Cache / Queue

```text
Upstash Redis
BullMQ
```

---

## Blockchain

```text
Solana
Rust
Anchor
SPL Token Program
```

---

# Repository Structure

Recommended:

```text
gimme-idea/
│
├── apps/
│   ├── web/
│   ├── api/
│   └── worker/
│
├── packages/
│   ├── db/
│   ├── contracts/
│   ├── ui/
│   ├── auth/
│   ├── solana/
│   ├── config/
│   └── utils/
│
├── programs/
│   └── bounty-escrow/
│
├── docs/
│
├── AI_READ_FIRST.md
├── README.md
└── package.json
```

---

# Documentation

Before making major implementation decisions, read the documentation in:

```text
/docs
```

Required reading order:

```text
00-product-overview.md
01-domain-model.md
02-prd-core-flows.md
03-system-architecture.md
04-database-schema-draft.md
05-smart-contract-bounty-escrow.md
06-ai-research-pipeline.md
07-frontend-design-brief.md
08-ai-coding-instructions.md
```

AI coding agents must also read:

```text
AI_READ_FIRST.md
```

before writing code.

---

# Important Product Invariants

Do not violate these without an explicit product decision.

1. Problem and Idea are separate objects.
2. Every published Idea has exactly one Primary Problem.
3. A Problem can exist without an Idea.
4. A Problem can exist without a Bounty.
5. Bounty is an optional economic layer attached to a Problem.
6. A funded Bounty requires confirmed escrow.
7. Project and Submission are separate objects.
8. Submission Result and Project Outcome are separate.
9. Previous Attempt remains a sub-object of Idea in product semantics.
10. Discussion is separate from canonical Problem/Idea/Project content.
11. AI may research but must not silently rewrite user thesis.
12. Imported content must preserve provenance.
13. AI may suggest duplicates but may not automatically merge canonical entities.
14. PostgreSQL is the source of truth for product data.
15. Solana is the source of truth for escrowed funds.

---

# V1 Scope

Core V1 includes:

```text
Authentication
Problem creation
Problem discovery
Idea creation
Idea research
AI verification
Discussion
Save / Like / Follow
Project creation
Bounties
Escrow funding
Submission
Judging
Winner selection
Payout
```

Not required for V1:

```text
DAO governance
token economy
NFT reputation
futarchy
advanced creator revenue sharing
full hiring marketplace
generic freelance marketplace
real-time chat
fully on-chain social graph
Kubernetes
large microservice architecture
```

---

# Development Principle

The goal is not:

> generate the maximum amount of code as quickly as possible.

The goal is:

> build a correct foundation that can continue evolving without a major rewrite.

Prefer:

```text
small
clear
typed
testable
modular
```

over unnecessary abstraction.

---

# Current Build Priority

Recommended implementation order:

```text
1. Repository skeleton
2. Shared contracts
3. Database + seed data
4. Backend modules
5. Auth
6. Zahlook design foundation
7. Landing Three.js prototype
8. Problem page
9. Idea page
10. Discussion
11. Bounty page
12. Core CRUD flows
13. AI research pipeline
14. Redis / workers
15. Bounty off-chain flow
16. Solana escrow
17. Submission / judging / payout
18. Imports / search / notifications
19. Load testing
```

The first meaningful milestone is reached when:

```text
Repository builds
Database migrations run
Seed data loads
API boots
Frontend boots
Worker boots
Problem and Idea pages render real seeded data
```

Gimme Idea should evolve from that foundation rather than being generated as one giant application in a single pass.
