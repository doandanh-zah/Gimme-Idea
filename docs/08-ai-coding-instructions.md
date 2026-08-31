# Gimme Idea — AI Coding Instructions

## 1. Purpose

Tài liệu này định nghĩa cách AI coding agent phải làm việc với Gimme Idea.

Mục tiêu:

- đọc đúng context trước khi code;
- không tự thay đổi product model;
- không tự thêm feature lớn;
- không over-engineer;
- không biến frontend thành generic SaaS;
- không phá domain invariants;
- build theo phase rõ ràng;
- ưu tiên skeleton đúng trước khi polish sâu.

---

# 2. Required Reading Order

Trước khi viết code, agent phải đọc toàn bộ docs theo đúng thứ tự:

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

Không được chỉ đọc file architecture rồi bắt đầu code.

Product docs có quyền ưu tiên hơn implementation convenience.

---

# 3. Frontend Requirement

Nếu task liên quan frontend, UI, UX, animation, responsive hoặc visual system:

**MUST USE ZAHLOOK SKILL FIRST.**

Agent không được:

```text
skip Zahlook
↓
generate generic Tailwind SaaS dashboard
```

Zahlook phải được dùng trước khi:

- chọn layout;
- chọn design system;
- tạo major components;
- implement landing;
- implement Three.js experience;
- implement responsive navigation;
- quyết định motion behavior.

---

# 4. Product Truth Hierarchy

Nếu có conflict giữa docs:

Priority:

```text
Product intent
↓
Domain rules
↓
Core flows
↓
Architecture
↓
Database implementation
↓
Frontend implementation detail
```

Ví dụ:

Nếu ORM khiến relation `Idea → exactly one Primary Problem` khó implement:

Không được bỏ rule đó.

Phải thay implementation.

---

# 5. Do Not Redesign Product While Coding

Agent không được tự đổi:

```text
Problem → Idea
```

thành:

```text
Idea contains problem text
```

chỉ vì code dễ hơn.

Không được tự:

- merge Problem và Idea;
- merge Project và Submission;
- merge Submission Result và Project Outcome;
- biến PreviousAttempt thành unrelated top-level marketplace;
- bắt mọi Problem có Bounty;
- bắt mọi user có wallet;
- đưa social comments trực tiếp vào Idea page;
- đưa full product state on-chain.

Nếu muốn đề xuất thay đổi:

Tạo section:

```text
PROPOSED ARCHITECTURE CHANGE
```

và giải thích.

Không implement trước khi được approved.

---

# 6. No Speculative Features

Không tự build:

```text
token
NFT
DAO
futarchy
advanced reputation
creator payout algorithm
AI recommendation engine
talent marketplace
complex hiring CRM
real-time chat
microservices
Kubernetes
```

nếu chưa có explicit requirement.

V1 phải giữ scope.

---

# 7. Architecture Style

V1:

**Modular Monolith + Workers**

Không tách thành independent microservices.

Expected:

```text
apps/
├── web
├── api
└── worker
```

plus:

```text
programs/bounty-escrow
packages/*
```

---

# 8. First Coding Objective

Phase 1 không phải:

> build complete production product.

Phase 1 là:

> create a stable, coherent skeleton matching all docs.

Kết quả Phase 1 phải cho phép tiếp tục development mà không rewrite foundation.

---

# 9. Phase 1 — Repository Skeleton

Create:

```text
apps/
  web/
  api/
  worker/

packages/
  db/
  contracts/
  ui/
  auth/
  solana/
  config/
  utils/

programs/
  bounty-escrow/

docs/
```

Setup:

```text
pnpm workspace
Turborepo
TypeScript
ESLint
Prettier
environment validation
shared tsconfig
```

Do not add unnecessary tooling.

---

# 10. Phase 2 — Shared Domain Contracts

Before frontend/backend independently invent payloads:

Create shared typed contracts.

Examples:

```text
ProblemDTO
IdeaDTO
ProjectDTO
DiscussionDTO
BountyDTO
SubmissionDTO
ResearchStatusDTO
```

Use:

```text
Zod
```

or equivalent schema validation.

These contracts should power:

- API validation;
- OpenAPI;
- frontend types.

---

# 11. Phase 3 — Database

Agent must first:

1. produce ERD;
2. check against domain invariants;
3. choose ORM/query builder;
4. explain choice briefly;
5. generate migrations incrementally.

Do not generate all tables blindly in one giant migration.

---

# 12. ORM Selection

Agent may choose:

```text
Drizzle
Prisma
Kysely
```

but must evaluate:

- PostgreSQL compatibility;
- partial indexes;
- migrations;
- transaction handling;
- generated type quality;
- performance;
- Fastify integration.

Once chosen, document:

```text
docs/implementation/orm-decision.md
```

Do not switch ORM casually later.

---

# 13. Phase 4 — Backend Skeleton

Build Fastify API with modules:

```text
auth
users
organizations
problems
ideas
projects
discussions
bounties
submissions
collections
research
blockchain
notifications
imports
```

Each module should include where relevant:

```text
route
schema
service
repository
authorization
tests
```

Do not put all routes in one file.

---

# 14. API Principles

All important writes:

```text
Frontend
→ API
→ validation
→ auth
→ business rule
→ database
```

Frontend must not bypass API domain logic.

Every endpoint must define:

```text
input schema
output schema
error cases
authorization
```

---

# 15. API Error Model

Use consistent errors.

Example:

```text
{
  code: "BOUNTY_NOT_FUNDED",
  message: "This bounty has not been funded yet."
}
```

Avoid returning arbitrary:

```text
500 Something went wrong
```

for expected domain failures.

---

# 16. Phase 5 — Auth

Implement:

```text
Supabase Auth
```

Core user flow must work without wallet.

Wallet linking is separate.

Support conceptually:

```text
Email/OAuth account
+
0..N verified wallets
```

---

# 17. Phase 6 — Frontend Foundation

Before creating dozens of screens:

Use Zahlook.

Then create:

- tokens;
- typography;
- layout system;
- navigation;
- surfaces;
- interaction rules;
- responsive breakpoints;
- base states.

Do not start from dashboard.

---

# 18. Phase 7 — Required Frontend Prototypes

Before expanding frontend, implement realistic prototypes for exactly:

```text
1. Landing Page
2. Problem Page
3. Idea Page
4. Discussion Thread
5. Funded Bounty Page
```

These establish most of the design system.

Use realistic seeded data.

No Lorem Ipsum.

---

# 19. Landing Page Requirement

Landing MUST include Three.js.

Required narrative:

```text
Problem
↓
Idea emergence
↓
Connections
↓
Build
↓
Funded problem / economic layer
```

Core visual:

**3D Brain**

As user scrolls:

- brain rotates;
- brain opens/fragments;
- idea objects emerge;
- puzzle/light bulb/code/network fragments appear;
- fragments connect;
- scene transitions into build metaphor.

---

# 20. Three.js Implementation Rule

Three.js must be:

```text
lazy-loaded
route-isolated
performance-budgeted
mobile-aware
reduced-motion-aware
```

Do not import Three.js into application shell if not needed.

---

# 21. Three.js Prototype First

Before polishing full landing:

Prototype only:

```text
Brain Scene
Scroll Controller
Idea Fragments
Camera
Mobile Fallback
```

Test performance.

Only then integrate full marketing copy.

---

# 22. Phase 8 — CRUD Core

Implement complete basic flows:

```text
Create Problem
Read Problem
Create Idea
Read Idea
Create Project
Read Project
Create Discussion
Read Discussion
Like
Save
Follow
```

Do not implement every secondary feature before these are stable.

---

# 23. Problem Creation UX

Required user input must remain lightweight.

Do not expose full research schema.

User enters:

```text
title
one-line
problem
who experiences it
why it matters
```

Optional details later.

---

# 24. Idea Creation UX

Idea flow:

```text
Choose/Create Problem
↓
Title
One-line
Opportunity
Solution
↓
Optional details
↓
AI research
```

Do not ask user to fill AI research fields unless they want to.

---

# 25. Phase 9 — AI Pipeline Skeleton

Before integrating expensive provider calls, create:

```text
ResearchJob
VerificationJob
ResearchResult schema
VerificationResult schema
```

Use mock provider first.

Test lifecycle:

```text
QUEUED
RESEARCHING
VERIFYING
READY
```

Only then connect real provider.

---

# 26. AI Provider Isolation

Create abstraction:

```text
ResearchProvider
VerifierProvider
```

Domain code must not directly depend on one provider SDK.

---

# 27. AI Research Rule

Researcher can fill only allowlisted fields.

Protected user fields must not be overwritten.

Every AI-derived factual claim must support:

```text
source
confidence
verification status
```

---

# 28. Phase 10 — Redis / Queues

Set up Redis only after core skeleton compiles.

Queues:

```text
ai-research
ai-verification
blockchain-events
blockchain-payouts
notifications
imports
```

Workers must be independently runnable.

---

# 29. Queue Rules

Every job must support:

```text
stable job ID
retry
backoff
timeout
failure logging
idempotency
```

Do not queue anonymous arbitrary payloads without schemas.

---

# 30. Phase 11 — Cache

Only cache after main API flows are correct.

Cache candidates:

```text
Problem public detail
Idea public detail
Project public detail
Trending
Public profile
Research result
```

Do not cache personalized/private payloads in shared edge cache.

---

# 31. Phase 12 — Bounty Off-Chain Flow

Before smart contract integration, implement bounty product state with mock escrow adapter.

Flow:

```text
Draft
Awaiting Funding
Open
Closed
Judging
Completed
```

But UI must clearly mark mock/dev mode during development.

Do not fake production funding.

---

# 32. Phase 13 — Smart Contract Skeleton

Before generating full Rust implementation:

Agent must produce:

```text
Account Diagram
State Machine
Instruction Matrix
Authority Matrix
Threat Model
Test Matrix
```

Then implement Anchor program.

---

# 33. Contract Scope

Smart contract handles only:

```text
Escrow
Funding
Activation
Settlement
Refund
Dispute resolution states
```

Do not move:

```text
Problem
Idea
Project
Submission body
Discussion
AI research
```

on-chain.

---

# 34. Smart Contract Invariant

After activation:

```text
Sponsor cannot unilaterally withdraw funds.
```

This is non-negotiable.

---

# 35. Phase 14 — Blockchain Adapter

Backend must interact through an adapter.

Concept:

```text
BountyEscrowService
```

Methods:

```text
initialize
fund
activate
getState
settle
refund
```

Do not scatter Solana SDK logic across route handlers.

---

# 36. Phase 15 — Webhook Processing

Implement:

```text
Webhook Receiver
↓
Validate
↓
Enqueue
↓
Return
↓
Blockchain Worker
↓
Verify Chain State
↓
Update DB
```

Must be idempotent.

Do not trust webhook alone without verifying expected chain state where security requires it.

---

# 37. Phase 16 — Submission / Judging

Implement:

```text
Submit
Review
Shortlist
Score
Select Winner
```

Submission type depends on bounty type:

```text
Idea
Prototype
Build
```

Do not force same required fields for all three.

---

# 38. Phase 17 — Settlement

Only after winner selection is stable:

Integrate:

```text
PayoutIntent
↓
Solana
↓
Confirmation
↓
Submission Result
```

Project Outcome remains separate.

---

# 39. Phase 18 — Import Skeleton

Implement generic import pipeline:

```text
Raw Dataset
↓
Raw Payload
↓
Normalization
↓
Duplicate Candidates
↓
Draft Canonical Entity
```

Do not build Colosseum-specific parsing directly into domain modules.

Create adapters.

Example:

```text
ColosseumImporter
SuperteamImporter
SpreadsheetImporter
```

---

# 40. Internal Data Rule

Any source marked:

```text
is_internal = true
```

must default to:

```text
NOT PUBLIC
```

No AI agent may expose internal source content automatically.

---

# 41. Duplicate Handling

AI may:

```text
suggest duplicates
```

but must never:

```text
auto merge canonical entities
```

without controlled review.

---

# 42. Phase 19 — Search

Start with PostgreSQL:

```text
FTS
pg_trgm
```

No Elasticsearch/OpenSearch at V1.

Add dedicated search only after measured need.

---

# 43. Phase 20 — Load Testing

Before claiming:

> supports 5k concurrent

run load tests.

Use realistic mix:

```text
85% reads
8% social lightweight writes
4% personalized reads
2% content creation
1% heavy
```

Test AI and blockchain separately.

---

# 44. Required Load Scenarios

At minimum:

```text
Public Problem/Idea spike
Feed browsing
Discussion spike
Like/save burst
AI submission burst
Bounty deadline burst
Duplicate webhook delivery
Redis degradation
```

---

# 45. Performance Targets

Initial target:

```text
Cached p95 < 200ms
Origin read p95 < 400ms
Normal write p95 < 600ms
Error rate < 1%
```

These must be validated, not assumed.

---

# 46. Test Strategy

Every major module should have:

```text
unit tests
integration tests
critical flow tests
```

High-value end-to-end flows:

```text
Create Problem
Create Idea
AI research lifecycle
Discuss
Create Project
Create Bounty
Fund
Submit
Select Winner
Payout
```

---

# 47. Seed Data

Development environment must include realistic seed data.

At minimum:

```text
5 Problems
10 Ideas
3 Projects
several Previous Attempts
10 Discussions
2 Organizations
1 unfunded Bounty
1 funded mock/dev Bounty
multiple Submissions
```

Seed data should include:

- success;
- failure;
- shutdown;
- timing issues;
- regulatory uncertainty.

---

# 48. Environment Separation

Support:

```text
local
test
staging
production
```

Never reuse production:

```text
database
wallet authority
RPC secrets
webhook secret
```

in local environment.

---

# 49. Solana Environment

Recommended:

```text
local validator
↓
devnet
↓
mainnet controlled pilot
```

Do not start with unlimited mainnet bounty amounts.

---

# 50. Secret Management

Never commit:

```text
service role key
AI keys
RPC keys
wallet keypair
webhook secrets
```

to git.

Provide:

```text
.env.example
```

with names only.

---

# 51. Feature Flags

Use feature flags for high-risk/incomplete capabilities.

Examples:

```text
AI_RESEARCH_ENABLED
BOUNTY_MAINNET_ENABLED
EXTERNAL_IMPORT_ENABLED
HIRING_ENABLED
```

Avoid large unfinished features appearing publicly.

---

# 52. Logging

Structured logs must include where relevant:

```text
request_id
user_id
entity_id
job_id
bounty_id
transaction_signature
error_code
```

Never log:

```text
access token
private key
secret
full sensitive payload
```

---

# 53. Do Not Hide Technical Debt

If agent uses temporary implementation:

Mark clearly:

```text
TODO(PRODUCT)
TODO(SECURITY)
TODO(PERFORMANCE)
```

and document meaningful debt.

Do not pretend temporary mock infrastructure is production-ready.

---

# 54. Documentation During Coding

When architecture decision is made that docs do not cover:

Create:

```text
docs/implementation/
```

Examples:

```text
orm-decision.md
hosting-decision.md
cache-strategy.md
ai-provider-decision.md
solana-rpc-decision.md
```

Keep them concise.

---

# 55. Change Control

If implementation requires changing a core invariant:

Agent must stop and state:

```text
BLOCKED BY PRODUCT DECISION
```

Then explain:

- current rule;
- technical conflict;
- proposed alternatives;
- trade-offs.

Do not silently alter the rule.

---

# 56. UI Change Control

Frontend agent may freely improve:

```text
spacing
layout
responsive behavior
motion
component composition
visual hierarchy
```

using Zahlook.

Frontend agent may NOT freely change:

```text
what Problem means
what Idea means
Discuss behavior
Bounty funding semantics
AI provenance
user thesis ownership
```

---

# 57. No Fake Functionality

Do not create buttons that appear production-functional but only:

```text
console.log()
```

without clear dev label.

For incomplete feature:

- disable;
- hide via feature flag;
- show development state.

Especially for:

```text
Fund
Payout
Hire
AI Verified
```

---

# 58. Security Before Polish

For financial flows:

Priority:

```text
correctness
security
state integrity
auditability
↓
visual polish
```

Never weaken escrow checks for easier UX.

---

# 59. Frontend Quality Before Quantity

Do not generate 30 mediocre screens.

Prefer:

```text
5 excellent foundational screens
↓
shared design system
↓
expand
```

Required first screens:

```text
Landing
Problem
Idea
Discussion
Bounty
```

---

# 60. Responsive Completion Rule

A screen is not “done” until checked at:

```text
mobile
tablet
desktop
wide desktop
```

for core layouts.

---

# 61. State Completion Rule

A feature is not “done” with only success state.

Must consider:

```text
loading
empty
error
permission denied
logged out
processing
success
archived/deleted where relevant
```

---

# 62. AI Coding Style

Prefer:

```text
simple
explicit
typed
testable
modular
```

over:

```text
clever abstractions
deep inheritance
meta-frameworks
unnecessary generic factories
```

V1 should be readable by normal engineers.

---

# 63. Naming

Use domain terminology exactly:

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
```

Do not invent synonyms like:

```text
ChallengeEntity
InnovationUnit
SolutionNode
```

inside core domain without reason.

---

# 64. Git Workflow

Recommended implementation:

Small logical commits.

Examples:

```text
feat(db): add problem and idea schema
feat(api): add problem creation flow
feat(web): prototype idea canonical page
feat(worker): add research job lifecycle
```

Avoid one giant “initial app” commit if possible.

---

# 65. First Deliverable

The first meaningful coding deliverable should be:

```text
Repository compiles
↓
DB migrations run
↓
Seed data loads
↓
API boots
↓
Frontend boots
↓
Worker boots
↓
Problem + Idea pages render real seeded data
```

No smart contract or AI provider is required for this first milestone.

---

# 66. Second Deliverable

Then:

```text
Problem creation
Idea creation
Discussion
Project creation
Auth
Save/Like
```

working end-to-end.

---

# 67. Third Deliverable

Then:

```text
AI Research + Verification
```

with real queue/provider integration.

---

# 68. Fourth Deliverable

Then:

```text
Bounty
Submission
Judging
```

with mock escrow adapter first.

---

# 69. Fifth Deliverable

Then:

```text
Solana Escrow
Funding
Settlement
Payout
```

on devnet.

---

# 70. Sixth Deliverable

Then:

```text
Import
Search
Notifications
Load Testing
Security hardening
```

---

# 71. Definition of Done for Skeleton

Skeleton phase is complete when:

- monorepo structure exists;
- all apps boot;
- shared contracts compile;
- DB schema/migrations work;
- seed data works;
- core domain modules exist;
- Problem/Idea relationships are correct;
- frontend design foundation uses Zahlook;
- landing Three.js prototype exists;
- canonical Problem and Idea pages exist;
- no major domain invariant is violated.

---

# 72. Final Instruction

Do not optimize Gimme Idea for:

> “How quickly can AI generate a lot of code?”

Optimize for:

> “How confidently can we continue building without rewriting the foundation?”

A smaller correct skeleton is better than a large incorrect application.