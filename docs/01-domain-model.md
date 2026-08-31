# Gimme Idea — Domain Model

## 1. Purpose

Tài liệu này định nghĩa các domain entity cốt lõi của Gimme Idea, quan hệ giữa chúng, lifecycle và boundary giữa các object.

Mục tiêu:

- AI/dev dùng cùng một vocabulary;
- tránh duplicate business logic;
- tránh nhét nhiều khái niệm khác nhau vào cùng một bảng;
- frontend, backend và smart contract hiểu cùng một product model;
- giữ architecture đủ đơn giản cho V1 nhưng không khóa đường scale về sau.

Core lifecycle:

`Problem → Idea → Project → Submission → Result`

Economic layer:

`Problem → optional Bounty`

Social layer:

`Problem / Idea / Project → Discussion`

---

# 2. Core Domain Objects

## 2.1 User

User đại diện cho một cá nhân sử dụng Gimme Idea.

Một User có thể đồng thời là:

- creator;
- problem scout;
- idea author;
- builder;
- founder;
- researcher;
- company member;
- bounty solver;
- discussion participant.

Không lưu một `role` duy nhất kiểu:

`user.role = builder`

vì một người có thể làm nhiều việc.

Authorization nên dựa trên:

- ownership;
- organization membership;
- permissions;
- action-specific rules.

### Core relationships

```text
User
├── creates Problems
├── creates Ideas
├── joins Projects
├── submits Submissions
├── creates Discussions
├── likes objects
├── saves objects
├── follows objects/users
└── belongs to Organizations
```

---

# 3. Organization

Organization đại diện cho:

- company;
- startup;
- DAO;
- protocol;
- university;
- community;
- nonprofit;
- government organization;
- ecosystem organization.

Organization có thể:

- publish Problem;
- fund Bounty;
- sponsor Problem;
- review Submission;
- hire builders;
- own Project;
- maintain profile.

Một Problem được đăng bởi company không cần trở thành một loại Problem khác.

Organization chỉ là provenance/ownership metadata.

Ví dụ:

```text
Problem
posted_by_user_id: ...
organization_id: Company X
```

---

# 4. Problem

Problem là domain object trung tâm.

Problem mô tả một real-world need, pain point, inefficiency, constraint hoặc unmet demand.

Problem phải có thể tồn tại độc lập với:

- Idea;
- Project;
- Bounty;
- Company;
- Solution.

Ví dụ:

```text
Small restaurants struggle to predict daily demand,
causing food waste and lost inventory value.
```

Problem không được assume trước cách giải.

---

## 4.1 Problem Relationships

```text
Problem
│
├── has many Ideas
├── has many Discussions
├── may have Bounties
├── may have Research
├── may be followed/saved
└── may be associated with an Organization
```

Problem không bắt buộc phải có Idea.

Problem không bắt buộc phải có Bounty.

---

## 4.2 Problem Provenance

Problem cần biết nguồn gốc.

Ví dụ:

```text
origin_type:
- user_created
- organization_created
- imported
- community_research
- external_source
```

Nếu imported:

```text
source_name
source_url
source_reference
imported_at
```

Provenance không phải status.

---

## 4.3 Problem Lifecycle

Lifecycle tối thiểu:

```text
draft
→ researching
→ published
→ archived
```

Không dùng:

```text
open
organization
funded
```

như status.

Funding thuộc Bounty.

Company ownership thuộc provenance.

---

# 5. Idea

Idea là một proposed approach để giải một Problem.

Idea không phải Problem.

Idea không được chứa một bản copy độc lập của Problem nếu Problem đã tồn tại.

Một Idea bắt buộc phải có:

**1 Primary Problem**

---

## 5.1 Primary Problem

Ví dụ:

```text
Idea:
AI inventory forecasting for small restaurants

Primary Problem:
Restaurants struggle to predict daily inventory demand
```

Quan hệ này phải rõ ràng.

Một Idea không được publish nếu không có Primary Problem.

---

## 5.2 Secondary Problems

Một Idea có thể tác động tới nhiều Problem.

Ví dụ:

```text
Idea:
Stablecoin payroll platform

Primary Problem:
Freelancers struggle with cross-border payments

Secondary Problem:
SMEs struggle to pay global contractors

Secondary Problem:
International transfers have high settlement cost
```

Database nên dùng relationship table.

Ví dụ:

```text
idea_problem_links

idea_id
problem_id
relation_type:
- primary
- secondary
```

Constraint:

Một Idea chỉ có tối đa một `primary`.

---

# 6. Idea Authorship

Core thesis của Idea thuộc về creator.

User tự viết tối thiểu:

```text
title
one_line_description
opportunity
solution
```

Problem được reference thông qua `primary_problem_id`.

Nếu user chưa tìm thấy Problem phù hợp:

```text
Create new Problem
```

rồi tạo Idea link tới Problem đó.

AI không được tự đổi primary thesis của creator.

---

# 7. Idea Research Layer

Idea có thể có research information do:

- creator cung cấp;
- community bổ sung;
- AI Researcher bổ sung;
- AI Verifier xác nhận.

Mỗi field hoặc research claim cần provenance.

Ví dụ:

```text
source_type:
- user_provided
- ai_researched
- ai_verified
- imported
- external
```

Research không được overwrite silently creator-authored information.

---

# 8. Previous Attempt

Previous Attempt là embedded/nested object trong Idea.

Nó không phải top-level domain entity trong V1.

Mục tiêu:

> ghi lại những attempt trước đây có thesis hoặc solution tương tự.

Một Idea có thể có nhiều Previous Attempts.

---

## 8.1 Previous Attempt Fields

```text
name
company_or_project_name
period_start
period_end
region

approach_summary
outcome

failure_factors[]
root_cause

what_worked
what_failed

was_problem_validated
was_solution_invalid

what_changed_since

relevance_to_current_idea

sources[]
confidence
```

---

## 8.2 Outcome Types

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

Không tự động coi:

`shutdown = bad idea`

---

## 8.3 Failure Factors

Possible tags:

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

`failure_factors` có thể có nhiều giá trị.

Failure được xem là multi-factor.

---

# 9. Project

Project là một implementation/build thực tế xuất phát từ Idea.

Idea là proposal.

Project là thứ builder thực sự đang làm.

Ví dụ:

```text
Problem
→ Freelancer cross-border payment

Idea
→ Stablecoin payroll solution

Project
→ PayFlow
```

---

## 9.1 Project Relationships

```text
Project
├── belongs to an Idea
├── may solve multiple Problems indirectly
├── has Team Members
├── may have GitHub
├── may have Demo
├── may have Website
├── may create many Submissions
├── has Project Updates
└── eventually has Outcome data
```

Project không bắt buộc phải tồn tại để Idea được publish.

---

## 9.2 Project Status

Recommended:

```text
planning
building
testing
live
paused
archived
shutdown
```

Không dùng:

```text
success
failed
```

làm build status.

Success/failure thuộc outcome analysis.

---

# 10. Project Team

Một Project có thể có nhiều User.

Nên dùng:

```text
project_members

project_id
user_id
role
joined_at
```

`role` có thể là free-text hoặc normalized sau.

Ví dụ:

```text
Founder
Frontend Engineer
Rust Engineer
Designer
Researcher
```

Không cần over-normalize trong V1.

---

# 11. Project Outcome

Project Outcome mô tả kết quả ngoài đời thực của Project.

Phải tách khỏi Submission Result.

Ví dụ:

```text
Submission:
Winner at Hackathon

Project Outcome:
Shutdown after 8 months
```

hoặc:

```text
Submission:
Not selected

Project Outcome:
Reached 100k users
```

---

## 11.1 Outcome Data

Có thể gồm:

```text
current_state
launch_date

users
active_users
revenue
funding
grants
customers

major_milestones

success_factors[]
failure_factors[]

why_it_worked
why_it_failed
why_it_paused

lessons_learned
```

Metrics optional.

Không ép mọi project phải công khai revenue/users.

---

# 12. Submission

Submission đại diện cho một lần Idea hoặc Project được nộp vào một opportunity.

Opportunity có thể là:

- Gimme Idea Bounty;
- hackathon;
- external bounty;
- grant;
- accelerator;
- competition.

Một Project có thể có nhiều Submission.

---

## 12.1 Submission Target

Submission phải reference một target.

Ví dụ:

```text
target_type:
- bounty
- hackathon
- grant
- external_opportunity
```

Nếu internal bounty:

```text
bounty_id
```

Nếu external:

```text
external_name
external_url
```

---

## 12.2 Submission Source

Submission có thể submit:

```text
Idea
```

hoặc:

```text
Project
```

Tùy requirement.

Ví dụ Idea bounty:

```text
submission.idea_id
project_id = null
```

Prototype bounty:

```text
submission.project_id
```

---

# 13. Submission Result

Submission Result chỉ mô tả outcome của lần nộp đó.

Ví dụ:

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

Có thể thêm:

```text
rank
prize_amount
judge_feedback
result_announced_at
```

Không dùng Submission Result để quyết định Project Outcome.

---

# 14. Bounty

Bounty là economic activation attached vào Problem.

Frontend có thể gọi:

**Funded Problem**

hoặc:

**Bounty**

tùy context.

Backend vẫn nên giữ Bounty là object riêng.

---

## 14.1 Why Bounty Is Separate

Một Problem có thể:

- chưa có bounty;
- có bounty hiện tại;
- bounty kết thúc;
- sau này có bounty mới;
- có sponsor khác muốn chạy challenge khác.

Do đó bounty data không được nhét trực tiếp vào Problem.

---

## 14.2 Bounty Relationships

```text
Bounty
├── belongs to Problem
├── funded by User or Organization
├── has escrow
├── has many Submissions
├── may have multiple Winners
└── creates payout records
```

---

# 15. Bounty Type

Bounty creator chọn expected submission level.

```text
idea
prototype
build
```

### Idea

Solver chỉ cần proposed solution.

### Prototype

Cần demo hoặc working prototype.

### Build

Cần working implementation theo requirements.

Không dùng một submission schema giống hệt cho cả ba rồi bắt mọi field required.

Validation phải phụ thuộc `bounty_type`.

---

# 16. Bounty Funding

Nếu monetary bounty:

Bounty không được trở thành:

```text
funded
```

cho tới khi blockchain escrow xác nhận tiền đã lock.

State:

```text
draft
awaiting_funding
funded
open
judging
completed
cancelled
refunded
```

`funded` có thể là state hoặc funding flag nội bộ.

Frontend chỉ hiển thị badge:

**Funded**

khi on-chain state confirmed.

---

# 17. Bounty Prize Structure

V1 nên hỗ trợ:

```text
winner_take_all
ranked_prizes
```

Ví dụ:

```text
#1 60%
#2 25%
#3 15%
```

Tỷ lệ configurable.

Không hardcode 50/30/20.

---

# 18. Winner

Một Bounty có thể có nhiều winner.

Không lưu:

```text
winner_user_id
```

trực tiếp trong Bounty.

Dùng:

```text
bounty_winners

bounty_id
submission_id
rank
amount
payout_status
```

---

# 19. Hiring Opportunity

Hiring không phải part của Bounty lifecycle bắt buộc.

Sau Result, organization có thể:

- contact builder;
- offer contract;
- offer employment;
- invite to another project.

Winning không tự động tạo employment relationship.

Gimme Idea có thể dùng result/reputation để xây:

**Verified Builder Pool**

sau này.

---

# 20. Discussion

Discussion là social conversation object.

Discussion có thể reference:

```text
Problem
Idea
Project
```

Không cần reference mọi thứ ngay từ V1.

Primary use:

```text
User clicks Discuss on Idea
→ create Discussion
→ attach idea_reference
```

---

## 20.1 Discussion Relationships

```text
Discussion
├── created by User
├── references optional Problem
├── references optional Idea
├── references optional Project
├── has Replies
├── has Likes
└── appears in Social Feed
```

Canonical object hiển thị discussions liên quan.

---

# 21. Reply

Reply thuộc Discussion.

V1 không cần recursive reply tree vô hạn.

Có thể dùng:

```text
discussion_id
parent_reply_id nullable
```

và giới hạn visual nesting.

---

# 22. Save

User có thể Save:

```text
Problem
Idea
Project
```

Save không chỉ là boolean nếu có Collections.

Model tốt hơn:

```text
Collection
CollectionItem
```

---

# 23. Collection

User có thể tạo folder riêng.

Ví dụ:

```text
Ideas for AI
Interesting Problems
Build Later
Vietnam Market
```

Collection có thể chứa:

- Problem;
- Idea;
- Project.

---

# 24. Like / Reaction

V1 có thể dùng Like đơn giản.

Không cần reaction system phức tạp ngay.

Like là engagement signal.

Like không đồng nghĩa validation.

Không được dùng:

```text
most_liked = best_idea
```

một cách trực tiếp.

---

# 25. Follow

User có thể Follow:

- User;
- Problem;
- Idea;
- Project.

Follow được dùng cho:

- feed;
- notification;
- update tracking.

---

# 26. Research

Research nên là supporting layer thay vì top-level product object với user.

Backend có thể có:

```text
ResearchRun
ResearchClaim
ResearchSource
VerificationResult
```

nhưng UI expose nó như:

**Research**

trong Problem/Idea.

---

# 27. Research Run

Mỗi lần AI research nên immutable hoặc versioned.

Không overwrite research cũ mà mất lịch sử.

Ví dụ:

```text
research_runs

id
entity_type
entity_id
status
model
started_at
completed_at
version
```

---

# 28. Research Claim

AI research phải breakdown thành claims khi có factual information.

Ví dụ:

```text
claim:
"The market grew 22% YoY in 2025"

source:
...

confidence:
0.91
```

Claim có verification state.

---

# 29. Verification

Verification không đánh giá:

> Idea good/bad.

Nó đánh giá:

```text
supported
partially_supported
unsupported
contradicted
unknown
```

Verification cần reference source/evidence.

---

# 30. Import Source

Imported data cần lưu provenance.

Ví dụ Colosseum:

```text
import_source:
colosseum

external_id:
...

external_url:
...

imported_at:
...

last_synced_at:
...
```

Không biến imported data ngay thành verified user-generated data.

---

# 31. Imported Entity Ownership

Imported Idea/Project không được giả vờ có creator account nếu creator chưa claim.

Có thể dùng:

```text
owner_status:
unclaimed
claimed
platform_curated
```

Sau này user có thể:

**Claim this project**

qua verification flow.

---

# 32. Duplicate Relationships

Không merge entity tự động chỉ vì AI thấy giống.

Nếu hệ thống nghi duplicate:

```text
duplicate_candidates

entity_a
entity_b
score
reason
status
```

Status:

```text
pending
confirmed_duplicate
not_duplicate
merged
```

Human hoặc trusted workflow quyết định merge.

AI chỉ suggest.

---

# 33. Entity Identity Rules

## Problem identity

Hai Problem giống wording chưa chắc là một Problem.

Phải xét:

- affected user;
- context;
- geography;
- industry;
- desired outcome.

Ví dụ:

```text
"Cross-border payments are expensive"
```

cho freelancer và enterprise treasury có thể là hai Problem khác nhau.

---

## Idea identity

Hai Idea dùng cùng technology chưa chắc duplicate.

Phải xét:

- primary Problem;
- target user;
- mechanism;
- value proposition.

---

# 34. Simplified Entity Map

```text
User ─────────────── Organization
 │                         │
 │                         │
 ▼                         ▼
Problem ◄────────────── Bounty
 │                        │
 │                        ▼
 │                   Submission
 ▼                        │
Idea                      ▼
 │                      Result
 │
 ├── PreviousAttempt[]
 │
 ▼
Project
 │
 └───────────────► Submission

Problem ─────► Discussion
Idea ────────► Discussion
Project ─────► Discussion
```

---

# 35. Canonical Lifecycle

## Knowledge lifecycle

```text
Problem
↓
Idea
↓
Project
↓
Outcome
```

## Opportunity lifecycle

```text
Problem
↓
Bounty
↓
Submission
↓
Result
↓
Payout
```

## Social lifecycle

```text
Problem / Idea / Project
↓
Discuss
↓
Discussion
↓
Replies
```

Các lifecycle này liên quan nhưng không được nhập thành một.

---

# 36. V1 Domain Boundaries

V1 phải hỗ trợ tốt:

- create Problem;
- create Idea;
- AI research;
- discuss;
- save;
- follow;
- create Project;
- attach GitHub/demo;
- create Bounty;
- fund escrow;
- submit;
- choose result;
- payout.

V1 không cần hoàn thiện:

- advanced hiring marketplace;
- full reputation economy;
- complex DAO governance;
- futarchy;
- decentralized moderation;
- secondary markets;
- fully on-chain entity graph.

---

# 37. Core Domain Rules

Các rule này phải được coi là invariant.

### Rule 1

A published Idea must have exactly one Primary Problem.

### Rule 2

A Problem may exist without any Idea.

### Rule 3

A Problem may exist without any Bounty.

### Rule 4

A Bounty must belong to a Problem.

### Rule 5

A funded Bounty must have confirmed escrow funding.

### Rule 6

A Project must originate from at least one Idea in V1.

### Rule 7

Submission Result must not determine Project Outcome.

### Rule 8

Previous Attempt is embedded in Idea for V1.

### Rule 9

AI research must not silently overwrite creator-authored thesis.

### Rule 10

Discussion is separate from canonical Problem/Idea/Project content.

### Rule 11

Imported entities must retain source provenance.

### Rule 12

AI may detect duplicate candidates but must not automatically merge high-value entities without a controlled merge process.

---

# 38. Naming Guidance for Frontend

Backend naming và frontend naming không nhất thiết giống hoàn toàn.

Recommended:

```text
Backend: Problem
Frontend: Problem

Backend: Idea
Frontend: Idea

Backend: Project
Frontend: Project / Build

Backend: Bounty
Frontend:
- Bounty
- Funded Problem
depending on context

Backend: Submission
Frontend: Submission

Backend: Discussion
Frontend: Discussion

Backend: PreviousAttempt
Frontend: Previous Attempts
```

Không expose technical terms như:

- entity;
- foreign key;
- provenance;
- research run;

trực tiếp cho low-tech user trừ khi cần.

---

# 39. Product Mental Model

User nên cảm nhận Gimme Idea như sau:

**Find a Problem**

→ xem context và research

**Explore Ideas**

→ xem nhiều cách giải khác nhau

**Discuss**

→ xem cộng đồng nghĩ gì

**Build**

→ biến Idea thành Project

**Submit**

→ mang Project/Idea tới bounty hoặc opportunity

**Earn / Get Hired**

→ nếu contribution tạo economic value.

Domain model phải hỗ trợ flow này mà không ép user phải hiểu toàn bộ internal architecture.