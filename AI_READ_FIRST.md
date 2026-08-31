# STOP — AI READ THIS BEFORE WRITING CODE

You are working on **Gimme Idea**.

Do **not** begin coding immediately.

Do **not** redesign the product from assumptions.

Do **not** generate a generic SaaS application from the README alone.

The project already has product, domain, architecture, database, AI, blockchain, and frontend decisions documented.

Your first job is to understand them.

---

# 1. Mandatory Reading

Before modifying architecture or writing implementation code, read:

```text
README.md
```

Then read ALL files below in this exact order:

```text
docs/00-product-overview.md
docs/01-domain-model.md
docs/02-prd-core-flows.md
docs/03-system-architecture.md
docs/04-database-schema-draft.md
docs/05-smart-contract-bounty-escrow.md
docs/06-ai-research-pipeline.md
docs/07-frontend-design-brief.md
docs/08-ai-coding-instructions.md
```

Do not skip documents because you believe you already understand the system.

Many concepts intentionally look similar but are NOT the same.

Examples:

```text
Problem ≠ Idea

Idea ≠ Project

Project ≠ Submission

Submission Result ≠ Project Outcome

Problem ≠ Bounty

Canonical Object ≠ Discussion

AI Research ≠ Creator Thesis
```

---

# 2. After Reading, Summarize Before Coding

Before making a large implementation change, internally verify that you understand:

```text
Problem
Idea
PreviousAttempt
Project
Submission
SubmissionResult
ProjectOutcome
Bounty
Discussion
Research
```

You should be able to correctly explain:

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

and separately:

```text
Problem
↓
optional Bounty
↓
Submission
↓
Winner
↓
Payout
```

and separately:

```text
Problem / Idea / Project
↓
Discuss
↓
Discussion
↓
Replies
```

If you cannot distinguish these flows, re-read the docs before coding.

---

# 3. Product Definition

Gimme Idea is primarily a:

**Problem Network**

It is not primarily:

```text
Idea generator
Reddit clone
Upwork clone
Hackathon directory
Generic social network
Generic bounty board
Crypto dashboard
```

Problems are the central knowledge objects.

Ideas are proposed solutions.

Projects are real builds.

Bounties create economic incentives around Problems.

Discussion is the social layer.

---

# 4. Critical Product Invariants

You MUST NOT silently violate these.

### Invariant 1

Problem and Idea remain separate entities.

### Invariant 2

Every published Idea has exactly one Primary Problem.

### Invariant 3

A Problem may exist without an Idea.

### Invariant 4

A Problem may exist without a Bounty.

### Invariant 5

Bounty is optional and attached to a Problem.

### Invariant 6

Funded Bounty requires confirmed on-chain escrow.

### Invariant 7

Project and Submission remain separate.

### Invariant 8

Submission Result does not determine Project Outcome.

### Invariant 9

PreviousAttempt is a small object associated with Idea.

Do not turn it into a major marketplace entity without approval.

### Invariant 10

Discussion remains separate from canonical Problem/Idea/Project content.

### Invariant 11

AI does not silently rewrite creator-authored thesis.

### Invariant 12

Imported content always preserves provenance.

### Invariant 13

AI can suggest duplicate candidates but cannot automatically merge important canonical entities.

### Invariant 14

PostgreSQL is canonical for product data.

### Invariant 15

Solana is canonical for escrow money state.

---

# 5. User Thesis Is Protected

For Ideas, the creator provides the thesis.

At minimum:

```text
Title
One-line description
Primary Problem
Opportunity
Solution
```

The AI Researcher may research missing information.

It MUST NOT silently transform:

> A tool for students to find teammates.

into:

> An AI-powered decentralized Solana reputation protocol for global talent liquidity.

Do not “improve” the business idea by changing its meaning.

---

# 6. AI Architecture

There are two distinct responsibilities:

```text
Researcher
↓
Verifier
```

Researcher finds evidence and context.

Verifier audits:

- claims;
- sources;
- contradictions;
- freshness;
- unsupported inference.

Verifier does NOT decide whether an Idea is commercially good or bad.

Unknown information is acceptable.

Never hallucinate fields just to make the schema complete.

---

# 7. Frontend Work — Zahlook Is Mandatory

If your task touches:

```text
frontend
UI
UX
layout
responsive design
animation
interaction
landing page
Three.js
component design
visual system
wallet states
```

you MUST use the **Zahlook skill first**.

Do not generate generic frontend styling before using Zahlook.

---

# 8. Landing Page Requirement

The landing page requires a Three.js experience.

Core concept:

**3D Brain / Idea Brain**

Scroll behavior should communicate:

```text
Problems
↓
Brain reacts / rotates
↓
Brain opens
↓
Ideas emerge
↓
Puzzle pieces / light bulbs / code / nodes / fragments
↓
Connections form
↓
Ideas become builds
↓
Funded problems introduce economic opportunity
```

The experience must have:

```text
desktop cinematic version
mobile simplified version
reduced-motion fallback
low-power fallback
lazy loading
route isolation
performance budget
```

Do not load Three.js across the entire application.

---

# 9. Frontend Pages Are Not All the Same

Problem page:

> canonical description of a problem.

Idea page:

> canonical proposed solution + research.

Discussion page:

> social conversation.

Project page:

> real implementation/build.

Bounty page:

> economic opportunity attached to a Problem.

Do not render all five using one generic content template.

---

# 10. Do Not Add Comments Directly to Idea

The intended interaction is:

```text
Idea
↓
Discuss
↓
Discussion Post referencing Idea
↓
Replies
```

Idea page may show:

```text
Discussions about this Idea
```

but the full conversation lives in Discussion.

---

# 11. Architecture

V1 architecture is:

**Modular Monolith + Independent Workers**

Expected:

```text
apps/web
apps/api
apps/worker

packages/*

programs/bounty-escrow
```

Do NOT introduce microservices unless there is a measured reason.

Do NOT introduce Kubernetes for V1.

---

# 12. Scale Target

Architecture target:

**~5,000 concurrent users**

This is mainly read-heavy traffic.

Use:

```text
Cloudflare caching
Redis caching
PostgreSQL indexes
connection pooling
cursor pagination
stateless APIs
async workers
```

Do not attempt to solve 5k concurrent users by prematurely sharding the database.

---

# 13. Async Work

The following MUST NOT block normal HTTP requests:

```text
AI research
AI verification
blockchain confirmation
notifications
imports
heavy indexing
```

Expected:

```text
Request
↓
Save state
↓
Queue job
↓
Return
```

Then worker handles expensive work.

---

# 14. Blockchain Scope

Solana is used primarily for:

```text
Bounty Escrow
Funding
Settlement
Payout
Refund
Payment Proof
```

Do NOT move these onto chain:

```text
Problem
Idea
Project content
Submission content
Discussion
AI research
Likes
Social graph
```

---

# 15. Escrow Security

After a Bounty is fully funded and activated:

**Sponsor cannot unilaterally withdraw the money.**

There must never be an:

```text
admin_withdraw_any_escrow
```

instruction.

Platform admins must not be able to arbitrarily drain Bounty vaults.

---

# 16. Never Trust Frontend Money State

The browser saying:

```text
Transaction successful
```

is NOT enough to mark:

```text
Bounty = Funded
```

Expected:

```text
Wallet transaction
↓
Solana
↓
Webhook/event
↓
Blockchain worker
↓
Verify chain state
↓
Database update
```

---

# 17. Database

Primary database:

```text
Supabase PostgreSQL
```

Core business writes go through the backend API.

Do not expose the Supabase service-role key to the browser.

Do not let frontend directly bypass domain rules.

---

# 18. Database Schema

The draft schema already exists.

Read:

```text
docs/04-database-schema-draft.md
```

Before generating migrations:

1. Produce ERD.
2. Compare ERD to domain invariants.
3. Choose ORM/query builder.
4. Document ORM choice.
5. Generate migrations incrementally.

Do not simplify the domain just because an ORM makes another design easier.

---

# 19. Do Not Overbuild

Do not add these without explicit approval:

```text
DAO
Token
NFT
Futarchy
Creator revenue algorithm
Advanced reputation score
Talent marketplace
Generic freelance marketplace
Real-time chat
Complex recommendation system
Kubernetes
Large microservice architecture
```

---

# 20. Initial Coding Order

Follow roughly:

```text
Phase 1
Repository skeleton

Phase 2
Shared contracts

Phase 3
Database + migrations + seeds

Phase 4
Backend modules

Phase 5
Auth

Phase 6
Zahlook frontend foundation

Phase 7
Landing Three.js prototype

Phase 8
Problem / Idea / Discussion / Bounty prototypes

Phase 9
Core CRUD

Phase 10
AI pipeline

Phase 11
Redis + workers

Phase 12
Bounty off-chain flow

Phase 13
Smart contract

Phase 14
Blockchain adapter + webhooks

Phase 15
Submission / judging / payout

Phase 16
Imports / search / notifications

Phase 17
Load testing / security hardening
```

---

# 21. First Milestone

Do not try to finish the entire product in one generation.

First milestone:

```text
Repository builds
Database migrations work
Seed data works
API starts
Web starts
Worker starts

Problem page renders seeded data
Idea page renders seeded data
```

This is a valid successful first deliverable.

---

# 22. Seed Data Must Be Realistic

Do NOT design screens using:

```text
Lorem Ipsum
Project Alpha
John Doe
```

Seed realistic:

- Problems;
- Ideas;
- Previous Attempts;
- Projects;
- Discussions;
- Bounties;
- Submissions.

The UI must be tested against realistic information density.

---

# 23. Frontend Prototype Priority

Before building dozens of screens, complete:

```text
Landing
Problem Page
Idea Page
Discussion
Funded Bounty Page
```

These five surfaces establish most of the product design language.

---

# 24. No Fake Functionality

Do not make actions look production-ready when they are mocks.

Especially:

```text
Fund
Payout
AI Verified
Hire
```

Use:

- development labels;
- disabled state;
- feature flags;

until real functionality exists.

---

# 25. Ask Before Breaking a Core Decision

If a documented product invariant causes a serious implementation problem:

Do not silently work around it.

Report:

```text
BLOCKED BY PRODUCT DECISION
```

Include:

```text
Current documented rule
Technical issue
Option A
Option B
Trade-offs
Recommendation
```

Wait for a product decision if needed.

---

# 26. What You May Decide Yourself

You may make reasonable implementation decisions about:

```text
file structure inside modules
function names
component composition
testing utilities
small library choices
query organization
spacing
responsive implementation
code style
```

provided they do not alter documented product behavior.

---

# 27. What You May NOT Decide Yourself

Do not independently change:

```text
business model
domain entity relationships
escrow economics
Problem/Idea semantics
AI ownership rules
discussion model
bounty funding semantics
creator monetization
major product scope
```

These require explicit product decisions.

---

# 28. Documentation of New Decisions

If you make a meaningful technical decision not already covered:

Create:

```text
docs/implementation/<decision>.md
```

Examples:

```text
orm-decision.md
hosting-decision.md
redis-strategy.md
rpc-provider-decision.md
ai-provider-decision.md
```

Keep implementation decision docs concise.

---

# 29. Definition of Good Work

Good work on Gimme Idea is not:

> generated a huge amount of code.

Good work is:

- domain model remains correct;
- architecture stays understandable;
- code is typed;
- critical flows are tested;
- UI follows Zahlook;
- Three.js is performant;
- user thesis remains intact;
- money flows are auditable;
- future developers can understand the system.

---

# 30. Final Rule

**Read first. Understand second. Plan third. Code fourth.**

If you are unsure what a core object means:

**do not guess.**

Re-read the documentation.

The existing product decisions are part of the specification.
