# Gimme Idea — System Architecture

## 1. Purpose

Tài liệu này định nghĩa architecture V1 của Gimme Idea.

Mục tiêu kỹ thuật:

- support khoảng **5,000 concurrent users**;
- tối ưu cho workload read-heavy;
- frontend, backend, AI pipeline và Solana program có boundary rõ ràng;
- expensive operations chạy asynchronous;
- không over-engineer bằng microservices/Kubernetes ở V1;
- architecture có thể scale lên đáng kể mà không cần rewrite product core.

Architecture style:

**Modular Monolith + Independent Workers**

---

# 2. Scale Target

Target:

**~5,000 concurrent active users**

Điều này không đồng nghĩa:

`5,000 requests / second`

Expected workload chủ yếu:

```text
80–90%
Public reads

5–10%
Like / Save / Follow / Discussion

1–3%
Create Problem / Idea / Project / Submission

Very small %
Blockchain operations
AI research jobs
```

Architecture phải hấp thụ phần lớn public reads bằng:

- browser cache;
- CDN;
- application cache;
- precomputed data.

Database không được nhận một query mới cho mọi page view nếu data có thể cache.

---

# 3. High-Level Architecture

```text
                        Internet
                           │
                           ▼
                ┌────────────────────┐
                │     Cloudflare     │
                │ CDN / WAF / Cache  │
                │ Rate Limiting      │
                └─────────┬──────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
     ┌────────────────┐      ┌────────────────┐
     │   Next.js Web  │      │  Fastify API   │
     │                │      │   Stateless    │
     └───────┬────────┘      └───────┬────────┘
             │                       │
             └───────────┬───────────┘
                         │
          ┌──────────────┼─────────────────┐
          │              │                 │
          ▼              ▼                 ▼
 ┌──────────────┐ ┌──────────────┐ ┌───────────────┐
 │   Supabase   │ │    Redis     │ │    Storage    │
 │ PostgreSQL   │ │   Upstash    │ │   Supabase    │
 │ Auth         │ │ Cache/Queue  │ │               │
 └──────────────┘ └──────┬───────┘ └───────────────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
            ▼            ▼            ▼
      ┌──────────┐ ┌──────────┐ ┌───────────┐
      │AI Worker │ │Blockchain│ │Job Worker │
      │          │ │ Worker   │ │           │
      └────┬─────┘ └────┬─────┘ └───────────┘
           │             │
           ▼             ▼
      AI Providers    Solana RPC
                         │
                         ▼
                 ┌────────────────┐
                 │ Solana Program │
                 │ Bounty Escrow  │
                 └────────────────┘
```

---

# 4. Core Technology Stack

## Frontend

```text
Next.js
React
TypeScript
```

Frontend implementation MUST use the **Zahlook skill**.

Zahlook phải được dùng để đảm bảo:

- responsive behavior;
- interaction states;
- wallet states;
- loading/error/empty states;
- animation quality;
- mobile behavior;
- accessibility;
- localization readiness;
- performance.

Landing page có Three.js 3D experience, nhưng Three.js không được nằm trong critical rendering path của toàn application.

Recommended Three.js stack:

```text
three
@react-three/fiber
@react-three/drei
```

Direct Three.js implementation vẫn được phép nếu Zahlook xác định phù hợp hơn.

---

## Backend

```text
Node.js
TypeScript
Fastify
```

API style:

```text
REST / JSON
```

API contract phải có:

```text
Zod or JSON Schema
+
OpenAPI
```

Frontend không được tự tạo một business logic khác với backend.

---

## Database

```text
Supabase PostgreSQL
```

PostgreSQL là source of truth cho:

- Problems;
- Ideas;
- Projects;
- Discussions;
- Users;
- Organizations;
- Bounties metadata;
- Submissions;
- AI research;
- social interactions.

Blockchain không thay thế PostgreSQL.

---

## Authentication

```text
Supabase Auth
```

Supported identity concept:

```text
User
├── Email
├── OAuth
├── GitHub
└── Wallet(s)
```

Wallet không phải user account.

Low-tech users không cần wallet để sử dụng core product.

---

## Cache + Queue

```text
Upstash Redis
BullMQ
```

Redis dùng cho hai jobs khác nhau:

### Cache

```text
public object cache
feed cache
ranking cache
rate-limit counters
temporary computation
```

### Queue

```text
AI research
AI verification
blockchain event processing
notifications
imports
search updates
background jobs
```

BullMQ hỗ trợ Upstash Redis. Với sustained BullMQ workload, cần theo dõi Redis command volume vì worker polling có thể tạo nhiều Redis operations; Upstash hiện khuyến nghị cân nhắc fixed plan cho use case BullMQ có command volume cao.

---

# 5. Monorepo Structure

Use:

```text
pnpm
+
Turborepo
```

Recommended repository:

```text
gimme-idea/
│
├── apps/
│   │
│   ├── web/
│   │   └── Next.js frontend
│   │
│   ├── api/
│   │   └── Fastify API
│   │
│   └── worker/
│       └── Background workers
│
├── packages/
│   │
│   ├── db/
│   │   ├── schema
│   │   ├── migrations
│   │   └── queries
│   │
│   ├── contracts/
│   │   └── shared API/domain schemas
│   │
│   ├── ui/
│   │   └── reusable UI components
│   │
│   ├── auth/
│   │
│   ├── solana/
│   │   └── client + instruction helpers
│   │
│   ├── config/
│   │
│   └── utils/
│
├── programs/
│   └── bounty-escrow/
│       └── Anchor / Rust
│
├── docs/
│
├── tooling/
│
└── package.json
```

---

# 6. Backend Module Boundaries

Do not create microservices.

Inside `apps/api` use modules:

```text
modules/
│
├── auth/
├── users/
├── organizations/
│
├── problems/
├── ideas/
├── projects/
│
├── discussions/
├── bounties/
├── submissions/
│
├── collections/
├── social/
│
├── research/
├── blockchain/
├── notifications/
│
└── imports/
```

Each module should own:

```text
routes
service
repository/query layer
validation
authorization
domain logic
```

Avoid direct cross-module database mutations when possible.

Example:

`bounties`

must not directly modify arbitrary `projects` state.

Use service boundaries.

---

# 7. Stateless API

API must be stateless.

Never store important state only in process memory.

Do not store:

```text
user session
bounty funding state
AI job state
submission state
wallet state
```

inside one API instance.

All persistent state belongs in:

```text
PostgreSQL
Redis
Solana
```

Therefore:

```text
API Instance A dies
↓
API Instance B continues normally
```

This allows horizontal scaling.

Initial production:

```text
minimum API replicas: 2
```

Do not run production with only one API instance if availability matters.

---

# 8. Database Connection Strategy

Never create one persistent Postgres connection per user.

Application traffic must use connection pooling correctly.

Supabase currently provides:

- direct database connection;
- Supavisor session pooling;
- Supavisor transaction pooling;
- paid-tier dedicated pooling options.

Persistent backend containers should prefer an appropriate persistent/session connection strategy; serverless/short-lived workloads can use transaction pooling.

Supabase notes that transaction mode is intended for transient/serverless connections and does not support prepared statements.

Recommended architecture:

```text
API replicas
     │
     ▼
Connection Pooler
     │
     ▼
PostgreSQL
```

Migrations must use a dedicated migration connection, not runtime application traffic.

Database pool limits must leave capacity for:

- Supabase Auth;
- Storage;
- platform services;
- admin/migration tasks.

---

# 9. Database Access Rule

Frontend must not freely write directly to core domain tables.

Do not implement:

```text
Browser
→ direct unrestricted Problem INSERT
→ Postgres
```

Core writes go through:

```text
Browser
→ API
→ authorization
→ validation
→ domain rules
→ PostgreSQL
```

Supabase frontend SDK may still be used for:

- authentication;
- session bootstrap;
- controlled storage operations.

The Supabase service-role key must NEVER be exposed to browser code.

---

# 10. Database Query Principles

V1 must follow:

### Indexed foreign keys

Frequently queried relationships need indexes.

### Cursor pagination

Use:

```text
created_at + id
ranking_score + id
```

Avoid deep:

```text
OFFSET 100000
```

### Avoid N+1

Problem page must not trigger dozens of sequential DB queries.

### Precomputed counters

Fields such as:

```text
like_count
save_count
discussion_count
idea_count
```

may be maintained asynchronously where appropriate.

### Select only needed fields

Feed cards should not fetch full research documents.

---

# 11. Cache Architecture

Use multiple layers.

## Layer 1 — Browser

Static assets and safe API responses.

---

## Layer 2 — Cloudflare

Cache public read-heavy content.

Cloudflare caches static content by default and allows dynamic/HTML content to be explicitly cached using Cache Rules.

Good cache candidates:

```text
/public/problems/:slug
/public/ideas/:slug
/public/projects/:slug

trending problems
trending ideas
categories
public profiles
published AI research
```

Do not edge-cache personalized responses containing private user data.

---

## Layer 3 — Redis

Examples:

```text
problem:{id}
idea:{id}
project:{id}

trending:problems
trending:ideas

feed:user:{id}
ranking:category:{id}
```

Cache TTL should depend on volatility.

Canonical entity caches may use:

```text
short TTL
+
explicit invalidation
```

---

# 12. Cache Invalidation

Mutation flow:

```text
User updates Idea
↓
API writes DB
↓
Invalidate Redis entity cache
↓
Invalidate relevant feed/ranking cache
↓
Purge/revalidate edge cache
```

Never rely solely on long TTL for content correctness.

---

# 13. Public vs Personalized Data

Important distinction:

## Public

```text
Problem page
Idea page
Project page
public research
public profile
public discussion
```

Aggressively cacheable.

## Personalized

```text
My saved collections
notifications
private drafts
company review notes
personalized feed
submission drafts
```

Must bypass shared edge caching.

---

# 14. Social Feed Architecture

Do not build Twitter-scale fan-out architecture in V1.

Initial feed can use:

```text
PostgreSQL
+
precomputed ranking signals
+
Redis cache
```

Feed objects may include:

```text
Discussion
New Problem
New Idea
Project Update
New Bounty
Bounty Result
```

Use cursor pagination.

Do not generate a permanent personalized copy of every post for every follower during V1 unless profiling proves it necessary.

---

# 15. Search Architecture

V1:

```text
PostgreSQL Full Text Search
+
pg_trgm
```

Search:

```text
Problems
Ideas
Projects
Users
Organizations
```

Do not introduce Elasticsearch/OpenSearch at V1 unless actual data volume or search quality proves Postgres insufficient.

Future dedicated search service can be added without changing canonical entities.

---

# 16. File Storage

Use object storage.

V1 default:

```text
Supabase Storage
```

Store:

- images;
- avatars;
- pitch decks;
- PDFs;
- small attachments.

Database stores only:

```text
storage key
URL/reference
mime type
size
ownership metadata
```

Do not store binary files directly inside PostgreSQL.

---

# 17. Video Policy

Do not build a video hosting platform in V1.

For:

```text
pitch videos
technical walkthroughs
demo videos
```

prefer external references such as:

```text
YouTube
Loom
other approved hosting
```

unless direct upload becomes a validated requirement.

---

# 18. Background Job Architecture

Queues must be separated by responsibility.

Do not put everything in one generic queue.

Recommended:

```text
ai-research
ai-verification

blockchain-events
blockchain-payouts

notifications

imports

search-index

maintenance
```

Each queue may have independent:

```text
concurrency
retry policy
timeout
priority
rate limit
dead-letter handling
```

---

# 19. AI Request Flow

AI must NEVER be inside normal HTTP request latency.

Bad:

```text
POST /ideas
↓
wait 40 seconds for research
↓
wait verifier
↓
return
```

Correct:

```text
POST /ideas
↓
Validate
↓
Save user thesis
↓
Create Research Job
↓
Return 201
```

Then:

```text
AI Research Worker
↓
ResearchRun
↓
AI Verification Queue
↓
Verifier
↓
Persist verified claims
↓
Entity becomes publishable
```

Frontend shows asynchronous state:

```text
Researching
Verifying
Ready
Needs review
```

---

# 20. AI Worker Isolation

AI workers must be isolated from normal API replicas.

Reason:

- unpredictable latency;
- provider rate limits;
- token usage;
- long-running web research;
- retries;
- malformed provider responses.

If AI provider becomes unavailable:

```text
Website continues operating.
```

Users must still be able to:

- browse;
- discuss;
- save;
- build;
- submit;
- use existing research.

---

# 21. AI Idempotency

Jobs must have stable identifiers.

Example:

```text
research_job:
entity_type
entity_id
research_version
```

Retrying the same job must not produce accidental duplicate active research records.

Research history should remain versioned.

---

# 22. Solana Boundary

Blockchain is used only where it provides meaningful trust/value.

V1 blockchain responsibilities:

```text
bounty escrow
fund locking
winner payout
refund
payment proof
```

Do NOT store on-chain:

```text
Problem content
Idea content
Discussion content
AI research
Project descriptions
GitHub URLs
social graph
likes
```

PostgreSQL remains canonical for product data.

Solana remains canonical for escrowed funds.

---

# 23. Smart Contract Architecture

Program:

```text
programs/bounty-escrow
```

Use:

```text
Rust
Anchor
```

Each funded bounty should have an escrow account/PDA relationship tied to a stable platform bounty identifier.

Conceptually:

```text
BountyEscrow
{
    bounty_id
    sponsor
    mint
    total_amount
    remaining_amount
    deadline
    authority
    state
}
```

Detailed contract specification belongs in:

`05-smart-contract-bounty-escrow.md`

---

# 24. Bounty Funding Flow

```text
Company creates Bounty
↓
PostgreSQL:
awaiting_funding
↓
Frontend creates transaction
↓
Sponsor signs
↓
Solana
↓
Escrow funded
↓
Blockchain event detected
↓
Worker verifies transaction
↓
PostgreSQL:
funded
↓
Public page shows:
Funded ✓
```

Frontend must NEVER set:

```text
funded = true
```

based solely on wallet UI success.

---

# 25. Blockchain Confirmation Architecture

Use event-driven confirmation.

Recommended:

```text
Solana
↓
RPC/Event Provider
↓
Webhook
↓
API webhook receiver
↓
enqueue blockchain event
↓
return success immediately
↓
Blockchain Worker
↓
verify
↓
update DB
```

Helius supports authenticated webhook delivery, retries failed deliveries, and recommends idempotent receivers because deliveries may occur more than once.

Webhook processing must therefore deduplicate using transaction identity.

Example:

```text
blockchain_events

provider
signature
event_type
processed_at

UNIQUE(provider, signature, event_type)
```

---

# 26. Webhook Security

Webhook endpoint must:

1. verify provider authentication/secret;
2. validate payload schema;
3. reject oversized/invalid requests;
4. enqueue work;
5. return quickly;
6. process business logic asynchronously.

Do not perform long-running payout logic directly inside webhook request.

---

# 27. Payout Architecture

Payout flow:

```text
Winner confirmed
↓
PayoutIntent created
↓
Blockchain payout job
↓
Instruction submitted
↓
Network confirmation
↓
Webhook/event
↓
Payout record = confirmed
```

Never mark payout complete before on-chain confirmation.

Payout jobs must be idempotent.

---

# 28. Wallet Architecture

Wallet is linked to User.

A User may have:

```text
0..N wallets
```

Wallet linking should use:

```text
server-generated nonce
↓
user signs message
↓
backend verifies signature
↓
wallet linked
```

Do not trust wallet address submitted without proof of control.

---

# 29. Bounty Currency

Architecture should support an SPL token mint field.

Recommended V1 UX default:

```text
USDC
```

because bounty value remains stable.

Architecture should not hardcode assumptions that make other approved SPL assets impossible later.

Allowed payment mints must use an explicit allowlist.

---

# 30. Three.js Landing Architecture

Landing page has a major 3D hero experience.

Concept:

```text
3D Brain
↓ scroll
Brain rotates
↓
Brain separates
↓
Idea fragments emerge
↓
Puzzle / Light Bulb / Nodes / Code / Sparks
↓
Fragments connect into Problem → Idea → Build narrative
```

Three.js architecture must be isolated from product application pages.

Recommended:

```text
apps/web/components/landing/brain-scene/
```

Example structure:

```text
brain-scene/
├── BrainScene.tsx
├── BrainModel.tsx
├── IdeaFragments.tsx
├── CameraRig.tsx
├── ScrollController.ts
├── performance.ts
└── fallback/
```

---

# 31. Three.js Performance Rules

The 3D hero is NOT allowed to destroy landing performance.

Requirements:

### Lazy load

Do not include the entire 3D runtime in the initial critical JS bundle if avoidable.

### Device fallback

Detect constrained devices.

Fallback:

```text
static render
or
lightweight animation
```

### Mobile

Mobile may use:

- fewer particles;
- simplified geometry;
- reduced lighting;
- lower device pixel ratio;
- shorter animation sequence.

### Reduced Motion

Respect:

```text
prefers-reduced-motion
```

### Asset optimization

Use optimized:

```text
glTF / GLB
compressed textures
reasonable polygon counts
```

### Route isolation

Three.js code must not inflate bundles for:

```text
Problem
Idea
Project
Dashboard
```

---

# 32. Zahlook Frontend Requirement

Any AI agent implementing frontend must explicitly:

**use the Zahlook skill before designing or implementing frontend UI.**

Do not generate generic dashboard UI before consulting Zahlook.

Zahlook should guide:

- visual system;
- interaction behavior;
- responsive layout;
- animation;
- component states;
- wallet states;
- Three.js integration;
- performance constraints.

---

# 33. Rate Limiting

Rate limiting must exist at more than one layer.

## Edge

Cloudflare:

```text
abusive requests
bot patterns
high-frequency endpoints
```

## API

Redis-backed limits for:

```text
create Problem
create Idea
create Discussion
AI research requests
wallet-link attempts
login-sensitive actions
submission attempts
```

AI endpoints require stricter quotas because they have direct monetary cost.

---

# 34. Authorization

Every write operation must check:

```text
authenticated user
ownership
organization permission
object state
deadline/state constraints
```

Examples:

Only authorized organization members may:

```text
review private bounty submissions
select winners
view internal judge notes
```

A solver cannot edit a submitted submission after the permitted deadline.

---

# 35. Security Rules

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
AI provider secret
RPC secret
webhook auth secret
escrow authority secret
```

to client bundles.

All secrets must remain server-side.

Validate every external payload.

Use secure headers.

Escape/sanitize user-generated rich content.

File uploads must validate:

```text
size
MIME
ownership
extension
```

Do not trust client-declared MIME alone.

---

# 36. Observability

V1 does not need a self-hosted observability stack.

Minimum:

```text
structured server logs
error tracking
platform CPU/RAM metrics
DB metrics
Redis metrics
queue depth
job failure counts
AI latency/cost
RPC/webhook errors
```

Recommended:

```text
Sentry
+
hosting dashboards
+
Supabase dashboard
+
Upstash dashboard
+
RPC provider dashboard
```

Add OpenTelemetry later if cross-service tracing becomes necessary.

---

# 37. Critical Metrics

Monitor:

### API

```text
request count
p50
p95
p99
error rate
```

### Database

```text
active connections
slow queries
CPU
IO
lock contention
```

### Redis

```text
latency
commands
memory
queue depth
```

### AI

```text
jobs pending
jobs failed
average duration
cost per research
```

### Blockchain

```text
webhook delay
confirmation delay
failed transactions
duplicate events
pending payouts
```

---

# 38. Health Checks

API:

```text
/health
```

checks process availability.

Separate readiness check may validate required dependencies.

Do not run expensive database queries on every load-balancer health request.

Workers need heartbeats/health visibility.

---

# 39. Deployment Architecture

All applications must be containerizable.

Required:

```text
Dockerfile
environment schema
health check
graceful shutdown
```

Suggested production layout:

```text
Web:
1–2+ instances depending on hosting model

API:
minimum 2 instances

AI Worker:
1+ independently scalable workers

Blockchain Worker:
1+ worker

Generic Worker:
1+ worker
```

API and workers must scale independently.

An AI traffic spike should not require scaling normal API instances.

---

# 40. Region Strategy

For V1, avoid premature multi-region database architecture.

Choose primary compute region close to the majority of initial users and database region.

Cloudflare absorbs global static/public traffic.

Database remains single primary region initially.

Scale to multi-region/read replicas only after actual latency/load data proves it necessary.

---

# 41. Failure Isolation

System must degrade gracefully.

## AI provider down

Still works:

```text
browse
social
projects
bounties
existing research
```

New research waits in queue.

## Solana RPC down

Still works:

```text
browse
create problem
create idea
discussion
project
```

Funding/payout becomes pending.

## Redis temporarily unavailable

Critical canonical data remains in PostgreSQL.

Cache miss should not corrupt source data.

Queue recovery strategy required.

## Search degraded

Direct canonical pages remain accessible.

---

# 42. Data Consistency Model

Use strong consistency where money/ownership matters.

Strong:

```text
bounty state
submission deadline
winner selection
payout
permissions
```

Eventual consistency acceptable for:

```text
like counters
save counters
feed ranking
trending score
search indexing
notifications
```

---

# 43. Source of Truth Matrix

```text
User / Problem / Idea / Project
→ PostgreSQL

Discussion
→ PostgreSQL

AI research
→ PostgreSQL

Bounty metadata
→ PostgreSQL

Submission
→ PostgreSQL

Escrow balance
→ Solana

Funding confirmation
→ Solana

Payout confirmation
→ Solana

Cache
→ Redis / CDN

Files
→ Object Storage
```

Never treat Redis as canonical database.

---

# 44. Load Testing

Architecture is not considered validated for 5k concurrent users until load testing passes.

Recommended test profile:

```text
5,000 virtual concurrent users
```

Traffic approximation:

```text
85% public reads
8% social lightweight actions
4% personalized reads
2% content creation
1% other heavy actions
```

Blockchain and AI workloads should have separate stress tests.

---

# 45. Initial Performance Targets

These are engineering targets, not guaranteed production numbers.

Cached public request:

```text
p95 < 200ms
```

Origin/API read:

```text
p95 < 400ms
```

Normal API write:

```text
p95 < 600ms
```

API error rate under expected load:

```text
< 1%
```

AI research is excluded because it is asynchronous.

Blockchain confirmation is excluded from normal API latency.

---

# 46. Load Test Scenarios

Must test separately:

### Scenario A

5k users browsing cached Problem/Idea pages.

### Scenario B

Feed browsing with cursor pagination.

### Scenario C

Large discussion spike.

### Scenario D

Simultaneous Like/Save actions.

### Scenario E

100+ Idea submissions causing AI queue burst.

### Scenario F

Bounty deadline submission burst.

### Scenario G

Blockchain webhook replay / duplicate delivery.

### Scenario H

Redis or AI provider partial outage.

---

# 47. No Premature Microservices

Do NOT split V1 into:

```text
Problem Service
Idea Service
Social Service
User Service
Project Service
Research Service
Bounty Service
```

as separate network services.

This creates unnecessary:

- network calls;
- deployment complexity;
- schema coordination;
- tracing;
- failure modes;
- developer overhead.

Use module boundaries inside one API codebase.

Extract a module only when real scaling/team ownership requires it.

Likely first candidates for extraction later:

```text
AI Research
Search
Feed/Recommendation
Blockchain Indexing
```

---

# 48. No Kubernetes in V1

Do not introduce Kubernetes for the 5k target.

Use managed/container infrastructure with horizontal replicas.

Architecture should remain Docker-compatible so Kubernetes remains possible later without product rewrite.

---

# 49. V1 Infrastructure Summary

```text
Frontend
Next.js + TypeScript
Three.js landing
Zahlook skill mandatory

Edge
Cloudflare CDN / WAF / Cache

API
Fastify + TypeScript
Stateless
2+ replicas

Database
Supabase PostgreSQL
Connection pooling

Auth
Supabase Auth

Storage
Supabase Storage

Cache
Upstash Redis

Queue
BullMQ

Workers
AI
Blockchain
Generic jobs

Blockchain
Solana

Smart Contract
Anchor / Rust
Bounty Escrow

Blockchain Events
RPC Provider + Webhooks

Search
PostgreSQL FTS + pg_trgm

Monitoring
Managed dashboards + Sentry
```

---

# 50. Architecture Invariants

AI agents and developers must not violate these rules without explicitly updating architecture docs.

### Rule 1

API remains stateless.

### Rule 2

PostgreSQL is canonical for product data.

### Rule 3

Solana is canonical for escrowed money.

### Rule 4

AI runs asynchronously.

### Rule 5

Blockchain confirmation runs asynchronously.

### Rule 6

Public read-heavy pages should be cacheable.

### Rule 7

Frontend does not directly bypass domain rules for core writes.

### Rule 8

Three.js landing code remains isolated from core application bundles.

### Rule 9

Frontend implementation must use Zahlook skill.

### Rule 10

Do not introduce microservices without demonstrated need.

### Rule 11

Do not introduce Kubernetes for V1.

### Rule 12

Every blockchain webhook and payout workflow must be idempotent.

### Rule 13

A frontend wallet success message is never sufficient proof of funding/payout.

### Rule 14

5k concurrent capacity must be proven by load test, not assumed from architecture diagrams.