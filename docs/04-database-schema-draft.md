# Gimme Idea — Database Schema Draft

## 1. Purpose

Tài liệu này định nghĩa database schema V1 cho Gimme Idea.

Database chính:

**PostgreSQL / Supabase**

Mục tiêu:

- map chính xác domain model sang relational database;
- đủ để AI tạo migrations và repository layer;
- support khoảng 5k concurrent users khi kết hợp đúng index, cache và connection pooling;
- giữ provenance của user/AI/imported data;
- support Problem → Idea → Project → Submission lifecycle;
- support optional Bounty + Solana escrow;
- không over-normalize V1.

Đây là schema draft.

AI/dev không được tự thêm business entity lớn mới mà không update docs.

---

# 2. Global Conventions

## Primary Keys

Dùng:

```text
UUID
```

Recommended:

```text
gen_random_uuid()
```

Không dùng sequential public ID làm canonical identifier.

Có thể tạo slug riêng cho URL.

---

## Timestamp

Hầu hết bảng cần:

```text
created_at timestamptz
updated_at timestamptz
```

Default:

```text
now()
```

---

## Soft Delete

Các canonical user-generated entity nên có:

```text
deleted_at timestamptz nullable
```

Không hard delete ngay:

- Problem;
- Idea;
- Project;
- Discussion;
- Organization.

---

## Public IDs / Slugs

Public-facing entities nên có:

```text
slug text
```

Unique theo entity type.

Ví dụ:

```text
/problems/restaurant-food-waste
/ideas/ai-demand-forecasting
/projects/payflow
```

Slug có thể đổi nhưng entity UUID không đổi.

---

# 3. users

Supabase Auth quản lý identity/authentication.

Application profile nằm ở:

```text
users
```

Fields:

```text
id uuid PK
auth_user_id uuid UNIQUE NOT NULL

username text UNIQUE
display_name text
bio text

avatar_url text
location text

website_url text
github_url text
linkedin_url text
x_url text

profile_visibility text

created_at
updated_at
deleted_at
```

`auth_user_id` reference Supabase auth user.

Không duplicate:

```text
password
password_hash
OAuth tokens
```

vào application table.

---

# 4. user_wallets

Một User có thể có nhiều wallet.

```text
user_wallets

id uuid PK
user_id uuid FK users

chain text
address text

is_primary boolean
verified_at timestamptz

created_at
updated_at
```

Constraint:

```text
UNIQUE(chain, address)
```

V1:

```text
chain = solana
```

Wallet chỉ được tạo sau signature verification.

---

# 5. organizations

```text
organizations

id uuid PK
slug text UNIQUE
name text NOT NULL

organization_type text

one_line_description text
description text

logo_url text
website_url text

location text
industry text

verification_status text

created_by uuid FK users

created_at
updated_at
deleted_at
```

Suggested `organization_type`:

```text
company
startup
protocol
dao
community
university
government
nonprofit
fund
other
```

---

# 6. organization_members

```text
organization_members

organization_id uuid FK organizations
user_id uuid FK users

role text
permission_level text

joined_at timestamptz
```

Composite key:

```text
PRIMARY KEY (organization_id, user_id)
```

Suggested permission:

```text
owner
admin
member
reviewer
```

Do not rely on role label alone for authorization.

---

# 7. problems

Core Problem object.

```text
problems

id uuid PK
slug text UNIQUE NOT NULL

title text NOT NULL
one_line_description text NOT NULL

problem_statement text NOT NULL
who_experiences text NOT NULL
why_it_matters text NOT NULL

region text
industry text

current_workaround text
existing_solutions text
desired_outcome text

constraints_summary text

creator_user_id uuid FK users
organization_id uuid FK organizations nullable

origin_type text NOT NULL

publish_status text NOT NULL

research_status text

published_at timestamptz

like_count bigint DEFAULT 0
save_count bigint DEFAULT 0
follow_count bigint DEFAULT 0
idea_count bigint DEFAULT 0
discussion_count bigint DEFAULT 0

created_at
updated_at
deleted_at
```

---

## Problem publish_status

```text
draft
researching
review
published
archived
rejected
```

`rejected` chỉ dùng cho moderation/information quality cases.

Không dùng để judge problem “không đáng giải”.

---

## Problem origin_type

```text
user_created
organization_created
community_curated
imported
external_source
```

---

# 8. problem_sources

Evidence/source user hoặc system attach vào Problem.

```text
problem_sources

id uuid PK
problem_id uuid FK problems

url text
title text
publisher text
published_at timestamptz

source_type text
added_by_user_id uuid FK users nullable
research_claim_id uuid nullable

created_at
```

`source_type`:

```text
user_provided
ai_researched
imported
external
```

---

# 9. ideas

```text
ideas

id uuid PK
slug text UNIQUE NOT NULL

title text NOT NULL
one_line_description text NOT NULL

opportunity text NOT NULL
solution text NOT NULL

how_it_works text
target_segment text
why_now text

value_proposition text
business_model text
go_to_market text

technical_approach text
dependencies text
risks_user_provided text

creator_user_id uuid FK users
organization_id uuid FK organizations nullable

publish_status text NOT NULL
research_status text

published_at timestamptz

like_count bigint DEFAULT 0
save_count bigint DEFAULT 0
follow_count bigint DEFAULT 0
discussion_count bigint DEFAULT 0
project_count bigint DEFAULT 0

created_at
updated_at
deleted_at
```

Idea không lưu duplicate:

```text
problem_statement
```

Problem được reference qua relationship table.

---

# 10. idea_problem_links

```text
idea_problem_links

idea_id uuid FK ideas
problem_id uuid FK problems

relation_type text NOT NULL

created_at
```

Composite:

```text
PRIMARY KEY (idea_id, problem_id)
```

Allowed:

```text
primary
secondary
```

Business invariant:

**Một Idea phải có đúng một Primary Problem khi published.**

Database migration nên enforce bằng partial unique index:

```text
UNIQUE idea_id
WHERE relation_type = 'primary'
```

---

# 11. previous_attempts

Về product, `PreviousAttempt` là sub-object của Idea.

Trong relational database vẫn nên dùng bảng riêng thay vì JSON blob vì:

- một Idea có nhiều attempts;
- cần source riêng;
- cần filter/query failure factors;
- AI cần update từng attempt;
- provenance rõ hơn.

Nhưng đây **không phải top-level product entity**.

```text
previous_attempts

id uuid PK
idea_id uuid FK ideas NOT NULL

name text NOT NULL
company_or_project_name text

period_start date
period_end date
region text

approach_summary text

outcome text
root_cause text

what_worked text
what_failed text

was_problem_validated text
was_solution_invalid text

what_changed_since text
relevance_to_current_idea text

confidence numeric

created_by_type text

created_at
updated_at
```

---

## previous_attempt outcome

```text
unknown
active
successful
partial_success
failed
shutdown
acquired
pivoted
abandoned
```

---

# 12. previous_attempt_failure_factors

Avoid storing failure tags as comma-separated text.

```text
previous_attempt_failure_factors

previous_attempt_id uuid FK previous_attempts
factor text

PRIMARY KEY (previous_attempt_id, factor)
```

Allowed initially:

```text
timing
distribution
capital
regulation
technical_limitations
unit_economics
market_readiness
competition
team
execution
pricing
product_market_fit
customer_behavior
dependency_failure
other
```

---

# 13. previous_attempt_sources

```text
previous_attempt_sources

id uuid PK
previous_attempt_id uuid FK previous_attempts

url text
title text
publisher text
published_at timestamptz

source_type text

created_at
```

---

# 14. projects

```text
projects

id uuid PK
slug text UNIQUE NOT NULL

idea_id uuid FK ideas NOT NULL

name text NOT NULL
one_line_description text NOT NULL
description text

status text NOT NULL

website_url text
github_url text
demo_url text

tech_stack text
technical_notes text

launch_date date

creator_user_id uuid FK users
organization_id uuid FK organizations nullable

published_at timestamptz

like_count bigint DEFAULT 0
save_count bigint DEFAULT 0
follow_count bigint DEFAULT 0
discussion_count bigint DEFAULT 0

created_at
updated_at
deleted_at
```

---

## Project status

```text
planning
building
testing
live
paused
archived
shutdown
```

Không có:

```text
successful
failed
```

trong status.

---

# 15. project_members

```text
project_members

project_id uuid FK projects
user_id uuid FK users

role text
is_owner boolean DEFAULT false

joined_at timestamptz

PRIMARY KEY (project_id, user_id)
```

---

# 16. project_updates

```text
project_updates

id uuid PK
project_id uuid FK projects

author_user_id uuid FK users

update_type text
title text
content text

previous_status text
new_status text

created_at
updated_at
deleted_at
```

Possible:

```text
progress
milestone
release
status_change
blocker
launch
general
```

---

# 17. project_outcomes

V1 mỗi Project có tối đa một current outcome record.

```text
project_outcomes

id uuid PK
project_id uuid FK projects UNIQUE

current_state text

users_count bigint
active_users bigint

revenue_amount numeric
revenue_currency text

funding_amount numeric
funding_currency text

customer_count bigint

why_it_worked text
why_it_failed text
why_it_paused text

lessons_learned text

last_evaluated_at timestamptz

created_at
updated_at
```

Metrics đều nullable.

Không bắt creator public financial data.

---

# 18. bounties

```text
bounties

id uuid PK
slug text UNIQUE NOT NULL

problem_id uuid FK problems NOT NULL

title text NOT NULL
description text NOT NULL

bounty_type text NOT NULL

submission_requirements jsonb
judging_criteria jsonb

eligibility text
required_skills text

deadline timestamptz NOT NULL

prize_structure text NOT NULL

currency_type text
token_mint text

total_prize numeric NOT NULL

status text NOT NULL

open_to_hiring boolean DEFAULT false

ip_terms text
sponsor_message text

created_by_user_id uuid FK users
organization_id uuid FK organizations nullable

published_at timestamptz

created_at
updated_at
deleted_at
```

---

## bounty_type

```text
idea
prototype
build
```

---

## prize_structure

```text
winner_take_all
ranked_prizes
```

---

## bounty status

```text
draft
awaiting_funding
funding_pending
open
closed
judging
completed
cancelled
refunded
```

Không cần trạng thái `funded` riêng nếu có funding record.

Frontend xác định funded bằng verified escrow state.

---

# 19. bounty_prizes

Không hardcode 1/2/3.

```text
bounty_prizes

id uuid PK
bounty_id uuid FK bounties

rank integer
amount numeric NOT NULL
percentage numeric nullable

label text

created_at
```

Examples:

```text
1 / First Prize
2 / Second Prize
3 / Third Prize
```

Constraint:

```text
UNIQUE(bounty_id, rank)
```

---

# 20. bounty_escrows

Metadata mirror của on-chain escrow.

Blockchain vẫn là source of truth.

```text
bounty_escrows

id uuid PK
bounty_id uuid FK bounties UNIQUE

chain text NOT NULL
program_id text

escrow_address text UNIQUE

sponsor_wallet text
token_mint text

expected_amount numeric
confirmed_amount numeric

funding_signature text

funding_status text

funded_at timestamptz
last_chain_sync_at timestamptz

created_at
updated_at
```

Suggested funding status:

```text
unfunded
pending
confirmed
partial
failed
refunded
```

Không update `confirmed` dựa vào frontend.

---

# 21. submissions

```text
submissions

id uuid PK

bounty_id uuid FK bounties nullable

submitter_user_id uuid FK users NOT NULL
team_name text

idea_id uuid FK ideas nullable
project_id uuid FK projects nullable

submission_statement text NOT NULL

deck_url text
demo_url text
github_url text
video_url text

status text NOT NULL

submitted_at timestamptz
locked_at timestamptz

created_at
updated_at
```

Constraint logic:

Submission cần ít nhất:

```text
idea_id OR project_id
```

Nếu internal bounty:

```text
bounty_id NOT NULL
```

External submission sẽ dùng target table riêng.

---

## Submission status

```text
draft
submitted
under_review
shortlisted
finalized
withdrawn
disqualified
```

---

# 22. submission_results

```text
submission_results

id uuid PK
submission_id uuid FK submissions UNIQUE

result_type text
rank integer

prize_amount numeric
prize_currency text

judge_feedback text

announced_at timestamptz

created_at
updated_at
```

Allowed result:

```text
pending
shortlisted
finalist
winner
runner_up
ranked
not_selected
disqualified
withdrawn
```

Submission Result không update Project Outcome tự động.

---

# 23. external_opportunities

Cho hackathon/grant/bounty ngoài Gimme Idea.

```text
external_opportunities

id uuid PK

name text NOT NULL
opportunity_type text

organization_name text

url text
starts_at timestamptz
deadline timestamptz

source text

created_at
updated_at
```

---

# 24. external_submissions

```text
external_submissions

id uuid PK

external_opportunity_id uuid FK external_opportunities

user_id uuid FK users

idea_id uuid FK ideas nullable
project_id uuid FK projects nullable

submitted_at timestamptz

result_type text
rank integer

prize_amount numeric
prize_currency text

external_submission_url text

created_at
updated_at
```

---

# 25. discussions

```text
discussions

id uuid PK

author_user_id uuid FK users NOT NULL

content text NOT NULL

referenced_problem_id uuid FK problems nullable
referenced_idea_id uuid FK ideas nullable
referenced_project_id uuid FK projects nullable

visibility text

like_count bigint DEFAULT 0
reply_count bigint DEFAULT 0

created_at
updated_at
deleted_at
```

V1 nên yêu cầu Discussion domain-related.

Một Discussion có thể reference tối đa một canonical primary object ban đầu để UI đơn giản.

---

# 26. discussion_replies

```text
discussion_replies

id uuid PK
discussion_id uuid FK discussions NOT NULL

author_user_id uuid FK users NOT NULL

parent_reply_id uuid FK discussion_replies nullable

content text NOT NULL

like_count bigint DEFAULT 0

created_at
updated_at
deleted_at
```

Nested replies có thể tồn tại trong DB.

Frontend nên giới hạn độ sâu hiển thị.

---

# 27. likes

Dùng polymorphic relation ở V1.

```text
likes

id uuid PK
user_id uuid FK users

entity_type text
entity_id uuid

created_at
```

Constraint:

```text
UNIQUE(user_id, entity_type, entity_id)
```

Allowed entity type:

```text
problem
idea
project
discussion
reply
```

---

# 28. follows

```text
follows

id uuid PK
user_id uuid FK users

entity_type text
entity_id uuid

created_at
```

Allowed:

```text
user
problem
idea
project
```

Constraint:

```text
UNIQUE(user_id, entity_type, entity_id)
```

---

# 29. collections

```text
collections

id uuid PK
user_id uuid FK users

name text NOT NULL
description text

visibility text

created_at
updated_at
deleted_at
```

Default:

```text
Saved
```

được tạo khi cần.

---

# 30. collection_items

```text
collection_items

id uuid PK
collection_id uuid FK collections

entity_type text
entity_id uuid

created_at
```

Allowed:

```text
problem
idea
project
```

Constraint:

```text
UNIQUE(collection_id, entity_type, entity_id)
```

---

# 31. research_runs

Không overwrite AI research cũ.

```text
research_runs

id uuid PK

entity_type text NOT NULL
entity_id uuid NOT NULL

research_type text

status text NOT NULL

provider text
model text

prompt_version text
pipeline_version text

started_at timestamptz
completed_at timestamptz

error_code text
error_message text

created_at
```

Allowed entity:

```text
problem
idea
```

Possibly project later.

---

# 32. research_claims

```text
research_claims

id uuid PK
research_run_id uuid FK research_runs

entity_type text
entity_id uuid

category text

claim text NOT NULL

confidence numeric

provenance_type text

verification_status text

created_at
updated_at
```

Category examples:

```text
market
competitor
technical
regulatory
timing
risk
previous_attempt
demand_signal
other
```

---

# 33. research_sources

```text
research_sources

id uuid PK
research_claim_id uuid FK research_claims

url text NOT NULL
title text
publisher text

published_at timestamptz
retrieved_at timestamptz

source_quality_score numeric

created_at
```

Một claim có thể có nhiều source.

Một source URL có thể support nhiều claims nhưng V1 duplicate metadata nhỏ là acceptable.

Sau này normalize nếu cần.

---

# 34. verification_results

```text
verification_results

id uuid PK
research_claim_id uuid FK research_claims

status text NOT NULL

reason text

verifier_provider text
verifier_model text

confidence numeric

verified_at timestamptz

created_at
```

Status:

```text
supported
partially_supported
unsupported
contradicted
unknown
```

---

# 35. entity_field_provenance

Một số structured field do user hoặc AI fill cần biết nguồn.

Thay vì tạo một column provenance cho mọi field, dùng generic table.

```text
entity_field_provenance

id uuid PK

entity_type text
entity_id uuid

field_name text

source_type text

user_id uuid nullable
research_run_id uuid nullable

confidence numeric

created_at
updated_at
```

Source type:

```text
user_provided
ai_researched
ai_verified
imported
external
platform_curated
```

Example:

```text
entity_type = idea
entity_id = ...
field_name = technical_approach
source_type = ai_researched
```

---

# 36. import_sources

```text
import_sources

id uuid PK

name text NOT NULL
source_type text

base_url text
description text

is_internal boolean DEFAULT false

created_at
updated_at
```

Examples:

```text
Colosseum
Superteam
STVN Internal Idea Bank
```

Internal source không được automatically publish.

---

# 37. imported_entities

```text
imported_entities

id uuid PK

import_source_id uuid FK import_sources

external_id text
external_url text

entity_type text

local_entity_id uuid nullable

raw_payload jsonb

owner_status text

imported_at timestamptz
last_synced_at timestamptz
```

Constraint:

```text
UNIQUE(import_source_id, external_id, entity_type)
```

Owner status:

```text
unclaimed
claimed
platform_curated
not_claimable
```

---

# 38. duplicate_candidates

AI/search chỉ suggest duplicate.

```text
duplicate_candidates

id uuid PK

entity_type text

entity_a_id uuid
entity_b_id uuid

similarity_score numeric

reason text

status text

reviewed_by_user_id uuid nullable

created_at
reviewed_at timestamptz
```

Status:

```text
pending
confirmed_duplicate
not_duplicate
merged
```

---

# 39. entity_redirects

Khi merge duplicate, URL cũ vẫn phải hoạt động.

```text
entity_redirects

id uuid PK

entity_type text
old_entity_id uuid
canonical_entity_id uuid

created_at
```

Frontend/API resolve old → canonical.

Không hard delete duplicate ngay.

---

# 40. bounty_reviews

Internal sponsor/judge review.

```text
bounty_reviews

id uuid PK

bounty_id uuid FK bounties
submission_id uuid FK submissions

reviewer_user_id uuid FK users

score numeric
internal_note text
public_feedback text

created_at
updated_at
```

Internal notes không public.

---

# 41. bounty_judging_criteria

Nếu cần scoring structured thay vì pure JSON.

```text
bounty_judging_criteria

id uuid PK
bounty_id uuid FK bounties

name text
description text

weight numeric

sort_order integer

created_at
```

Recommended dùng table này thay vì chỉ `judging_criteria jsonb` khi implementation bắt đầu.

Tổng weights:

```text
100%
```

nếu dùng percentage scoring.

---

# 42. bounty_review_scores

```text
bounty_review_scores

review_id uuid FK bounty_reviews
criterion_id uuid FK bounty_judging_criteria

score numeric

PRIMARY KEY(review_id, criterion_id)
```

---

# 43. bounty_winners

```text
bounty_winners

id uuid PK

bounty_id uuid FK bounties
submission_id uuid FK submissions

rank integer
amount numeric

payout_status text

created_at
updated_at
```

Constraint:

```text
UNIQUE(bounty_id, rank)
UNIQUE(bounty_id, submission_id)
```

---

# 44. payout_intents

Backend request đưa tiền ra khỏi escrow.

```text
payout_intents

id uuid PK

bounty_id uuid FK bounties
winner_id uuid FK bounty_winners

recipient_wallet text
token_mint text
amount numeric

status text

transaction_signature text

created_at
submitted_at
confirmed_at
updated_at
```

Status:

```text
created
queued
submitted
confirmed
failed
cancelled
```

Never mark `confirmed` before chain confirmation.

---

# 45. blockchain_events

Webhook idempotency.

```text
blockchain_events

id uuid PK

provider text
chain text

signature text NOT NULL
event_type text NOT NULL

payload jsonb

processing_status text

received_at timestamptz
processed_at timestamptz

error_message text
```

Critical constraint:

```text
UNIQUE(provider, signature, event_type)
```

---

# 46. notifications

```text
notifications

id uuid PK
user_id uuid FK users

type text
title text
body text

entity_type text
entity_id uuid

read_at timestamptz

created_at
```

Notification creation nên async.

---

# 47. moderation_flags

Needed because user-generated + AI-generated content.

```text
moderation_flags

id uuid PK

entity_type text
entity_id uuid

flag_type text
reason text

created_by_type text
created_by_user_id uuid nullable

status text

reviewed_by_user_id uuid nullable

created_at
reviewed_at
```

Possible:

```text
spam
abuse
misinformation
duplicate
copyright
private_data
unsafe_content
other
```

---

# 48. Audit Logs

Các economic/security action quan trọng cần audit.

```text
audit_logs

id uuid PK

actor_user_id uuid nullable
organization_id uuid nullable

action text

entity_type text
entity_id uuid

metadata jsonb

created_at
```

Important events:

```text
bounty_created
bounty_funding_requested
winner_selected
payout_requested
organization_permission_changed
entity_claimed
duplicate_merged
```

---

# 49. Recommended Important Indexes

Không index mọi column.

Bắt đầu với query patterns thật.

## problems

```text
(publish_status, published_at DESC)
(industry, published_at DESC)
(organization_id)
(creator_user_id)
```

Full-text:

```text
title
one_line_description
problem_statement
```

---

## ideas

```text
(publish_status, published_at DESC)
(creator_user_id)
```

Through `idea_problem_links`:

```text
(problem_id, relation_type)
```

---

## projects

```text
(idea_id)
(status, updated_at DESC)
```

---

## discussions

```text
(created_at DESC)
(author_user_id, created_at DESC)

(referenced_problem_id, created_at DESC)
(referenced_idea_id, created_at DESC)
(referenced_project_id, created_at DESC)
```

---

## bounties

```text
(problem_id)
(status, deadline)
(organization_id)
```

---

## submissions

```text
(bounty_id, submitted_at DESC)
(submitter_user_id)
(project_id)
(idea_id)
```

---

## notifications

```text
(user_id, read_at, created_at DESC)
```

---

## research

```text
(entity_type, entity_id, created_at DESC)
(research_run_id)
(research_claim_id)
```

---

# 50. Full-Text Search

Create search vectors for:

```text
Problem
Idea
Project
Organization
```

Problem weighted roughly:

```text
title             A
one_line           A
problem_statement  B
industry           C
```

Idea:

```text
title             A
one_line           A
solution           B
opportunity        B
```

Add `pg_trgm` index for fuzzy matching/duplicate assistance.

---

# 51. Counter Strategy

Fields:

```text
like_count
save_count
follow_count
discussion_count
```

exist for fast reads.

Canonical relationship tables remain source of truth.

Counter updates may be:

```text
transactional
```

initially for simplicity,

then moved async if write contention appears.

Counters must be repairable from canonical tables.

---

# 52. Transaction Boundaries

Use DB transactions for operations requiring atomic consistency.

Examples:

### Publish Idea

```text
validate exactly one Primary Problem
+
update publish_status
+
published_at
```

must be atomic.

### Winner Selection

```text
create bounty_winners
+
finalize results
+
lock judging state
```

atomic before payout jobs are created.

---

# 53. Money Fields

Never use floating point for money.

Use:

```text
numeric
```

or integer base units where appropriate.

On-chain amounts should also retain raw integer/base-unit representation when syncing chain state.

Recommended bounty escrow fields later include both:

```text
amount_display numeric
amount_raw numeric/integer-compatible representation
token_decimals integer
```

to prevent rounding ambiguity.

---

# 54. Privacy Boundaries

Never expose publicly by default:

```text
organization internal review notes
private submission drafts
wallet verification nonce
AI provider raw secrets
moderation internal notes
audit metadata containing secrets
```

Public/private fields must be explicitly selected by API DTOs.

Do not return database rows blindly.

---

# 55. RLS / Direct Database Access

Because core business writes go through Fastify API:

Core tables should not allow unrestricted browser writes.

Supabase RLS may be used as defense-in-depth.

Recommended posture:

```text
anonymous:
read explicitly public views only

authenticated frontend:
limited direct access

backend service:
controlled full access
```

Do not depend on RLS alone for complex bounty/business rules.

Those rules remain in API/domain service layer.

---

# 56. Public Read Views

Consider PostgreSQL views/materialized views for common public payloads later.

Examples:

```text
public_problem_cards
public_idea_cards
public_project_cards
```

Only if profiling shows value.

Do not prematurely create dozens of materialized views.

---

# 57. Draft Visibility

Draft entities belong only to:

- creator;
- authorized organization members;
- platform reviewers.

Public API must always include:

```text
publish_status = published
AND deleted_at IS NULL
```

unless requester has explicit permission.

---

# 58. AI Write Rules

AI must not directly execute arbitrary SQL.

Flow:

```text
AI Worker
↓
validated structured output
↓
Research Service
↓
schema validation
↓
database transaction
```

AI output must be treated as untrusted external input.

---

# 59. Import Write Rules

Imports:

```text
raw_payload
↓
normalize
↓
validation
↓
duplicate detection
↓
canonical entity creation
```

Never blindly map spreadsheet columns directly into public entity fields.

Imported entities retain provenance.

---

# 60. Database Entity Map

```text
users
 │
 ├──────────── organizations
 │                 │
 │                 └──── organization_members
 │
 ├──── problems ───────────── bounties
 │       │                       │
 │       │                       ├──── bounty_prizes
 │       │                       ├──── judging_criteria
 │       │                       └──── submissions
 │       │                                │
 │       ▼                                ▼
 │     ideas                        submission_results
 │       │                                │
 │       ├──── previous_attempts          └── bounty_winners
 │       │                                      │
 │       ▼                                      ▼
 │    projects                            payout_intents
 │
 ├──── discussions
 │        └──── discussion_replies
 │
 ├──── collections
 │        └──── collection_items
 │
 ├──── likes
 └──── follows


Problem / Idea
      │
      ▼
research_runs
      │
      ▼
research_claims
      │
      ├──── research_sources
      └──── verification_results
```

---

# 61. V1 Migration Order

Recommended creation order:

```text
1. users
2. user_wallets

3. organizations
4. organization_members

5. problems
6. problem_sources

7. ideas
8. idea_problem_links
9. previous_attempts
10. previous_attempt_failure_factors
11. previous_attempt_sources

12. projects
13. project_members
14. project_updates
15. project_outcomes

16. bounties
17. bounty_prizes
18. bounty_escrows
19. bounty_judging_criteria

20. submissions
21. submission_results
22. bounty_reviews
23. bounty_review_scores
24. bounty_winners
25. payout_intents

26. external_opportunities
27. external_submissions

28. discussions
29. discussion_replies

30. likes
31. follows
32. collections
33. collection_items

34. research_runs
35. research_claims
36. research_sources
37. verification_results
38. entity_field_provenance

39. import_sources
40. imported_entities
41. duplicate_candidates
42. entity_redirects

43. blockchain_events

44. notifications
45. moderation_flags
46. audit_logs
```

---

# 62. What Should NOT Become a Table Yet

Do not create dedicated V1 tables for:

```text
Creator Economy
Reputation Score
Talent Marketplace
Futarchy Markets
Token Rewards
AI Agents
Advanced Recommendations
```

until their product model is defined.

Avoid speculative schema.

---

# 63. ORM Guidance

ORM is intentionally not locked by this document.

Acceptable choices include:

```text
Drizzle
Prisma
Kysely
```

Selection criteria:

- PostgreSQL support;
- migration reliability;
- typed queries;
- partial indexes/check constraints support;
- good handling of transactions;
- low runtime overhead;
- compatibility with Fastify architecture.

If AI chooses an ORM during implementation, it must document the choice before generating all migrations.

---

# 64. Schema Invariants

These must be enforced in domain logic and, where practical, database constraints.

### Invariant 1

Published Idea has exactly one Primary Problem.

### Invariant 2

Problem may have zero Ideas.

### Invariant 3

Problem may have zero Bounties.

### Invariant 4

Bounty always references a Problem.

### Invariant 5

Bounty cannot be publicly displayed as funded without confirmed escrow.

### Invariant 6

Project references an Idea in V1.

### Invariant 7

Submission Result never automatically equals Project Outcome.

### Invariant 8

AI research never silently overwrites creator thesis.

### Invariant 9

Imported entities keep provenance permanently.

### Invariant 10

Duplicate candidates are not automatically merged.

### Invariant 11

Redis/cache counters are never canonical data.

### Invariant 12

Confirmed payout requires confirmed blockchain transaction.

---

# 65. Implementation Instruction for AI Agents

Before generating migrations:

1. Read:
   - `00-product-overview.md`
   - `01-domain-model.md`
   - `02-prd-core-flows.md`
   - `03-system-architecture.md`
   - this document.

2. Produce an ERD proposal.

3. Compare ERD against all domain invariants.

4. Identify implementation-only changes separately.

5. Do not change product relationships simply to make ORM generation easier.

6. Generate migrations incrementally.

7. Add indexes and constraints explicitly.

8. Seed development data for:
   - Problem;
   - Idea;
   - Project;
   - Discussion;
   - funded/unfunded Bounty;
   - Submission;
   - Previous Attempt.

The database must reflect the product model, not dictate it.