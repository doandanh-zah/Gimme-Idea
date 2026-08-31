# Gimme Idea — PRD Core Flows

## 1. Purpose

Tài liệu này định nghĩa các core product flows của Gimme Idea V1.

Mục tiêu:

- frontend biết user phải đi qua những screen/state nào;
- backend biết action nào cần API;
- AI/worker biết job nào chạy async;
- smart contract biết khi nào cần tham gia;
- tránh việc một flow bị implement theo nhiều cách khác nhau.

Core flows:

1. Create Problem
2. Create Idea
3. AI Research + Verification
4. Browse / Read / Save / Follow
5. Discuss
6. Create Project
7. Create Bounty
8. Fund Bounty
9. Submit to Bounty
10. Review Submission
11. Select Winner
12. Payout
13. External Submission
14. Claim Imported Entity
15. Hiring Opportunity

---

# 2. Global Product Principles

## 2.1 Canonical Objects

Problem, Idea và Project là canonical content objects.

Discussion không được chỉnh sửa nội dung canonical.

Ví dụ:

User disagree với Idea.

Không sửa Idea.

User bấm:

`Discuss`

và tạo Discussion Post riêng.

---

## 2.2 Async by Default for Expensive Work

Các action sau không được block request chính:

- AI research;
- AI verification;
- blockchain confirmation;
- notifications;
- indexing;
- heavy import jobs.

Frontend phải nhận response nhanh và hiển thị processing state.

---

## 2.3 AI Must Not Rewrite User Thesis

Các field creator-authored như:

- title;
- one-line description;
- opportunity;
- solution;

không được AI silently overwrite.

Nếu AI phát hiện contradiction hoặc factual issue:

- flag;
- suggest;
- annotate;

không tự sửa thesis.

---

# 3. Flow — Create Problem

## Goal

Cho phép bất kỳ user hợp lệ nào đăng một Problem mới.

Bounty không bắt buộc.

---

## User Flow

```text
User
↓
Create
↓
New Problem
↓
Fill Problem Overview
↓
Optional Details
↓
Submit
↓
AI Research
↓
Verification
↓
Publish
```

---

## Required Fields

V1:

```text
title
one_line_description
problem_statement
who_experiences_this_problem
why_it_matters
```

---

## Optional User Fields

```text
region
industry
current_workaround
existing_solutions
desired_outcome
evidence
source_links
constraints
```

User có thể bỏ qua.

AI có thể research phần thiếu.

---

## Submit Behavior

Khi user submit:

Backend:

1. validate required fields;
2. create Problem;
3. status = `researching`;
4. preserve user-authored content;
5. enqueue `PROBLEM_RESEARCH`;
6. return immediately.

Frontend:

```text
Problem submitted
Researching...
```

User không cần đứng chờ trên page.

---

## Publish Rule

Problem có thể publish khi:

- required user fields hợp lệ;
- không vi phạm moderation rules;
- research pipeline hoàn thành hoặc timeout an toàn;
- verifier không phát hiện critical misinformation cần hold.

AI research không bắt buộc phải tìm đủ mọi field mới được publish.

`Unknown` là acceptable.

---

# 4. Flow — Create Idea

## Goal

User đề xuất một solution cho một Problem.

---

## Entry Points

User có thể:

### From Problem Page

```text
Problem
→ Propose Idea
```

Primary Problem tự động được attach.

### From Global Create

```text
Create
→ New Idea
→ Search Problem
```

User phải:

- chọn existing Problem;
- hoặc create new Problem.

---

## Required Fields

```text
title
one_line_description
primary_problem_id
opportunity
solution
```

---

## Optional Fields

```text
how_it_works
target_segment
why_now
business_model
go_to_market
technical_approach
dependencies
risks
competitors
previous_attempts
success_metrics
```

User có thể điền phần họ biết.

---

## Submit Behavior

```text
User submits
↓
Idea = researching
↓
AI Research Worker
↓
AI Verifier
↓
Publish
```

User thesis phải được lưu trước khi AI chạy.

---

# 5. Flow — AI Research

## Goal

Bổ sung information user chưa điền.

---

## Research Input

AI nhận:

- creator-authored fields;
- linked Problem;
- existing optional fields;
- current date;
- source policy;
- duplicate candidates nếu có.

---

## Research Tasks

Có thể gồm:

```text
competitor research
previous attempts
market evidence
technical feasibility
regulatory constraints
business risks
distribution risks
timing signals
related companies
related research
supporting sources
```

---

## Research Output

Mỗi factual claim cần:

```text
claim
source
source_date
confidence
research_run_id
```

Không có source đủ tốt:

```text
insufficient_evidence
```

---

# 6. Flow — AI Verification

## Goal

Audit research output.

Không judge Idea tốt/xấu.

---

## Verifier Checks

```text
source_exists
source_supports_claim
source_freshness
contradiction
unsupported_inference
duplicate_source
claim_confidence
```

---

## Possible Verification Result

```text
supported
partially_supported
unsupported
contradicted
unknown
```

---

## Publish Outcomes

### Pass

Publish normally.

### Partial Issues

Publish nhưng mark affected claims:

```text
Low confidence
Needs verification
```

### Critical Issue

Hold research block hoặc whole entity nếu necessary.

Do not delete user thesis.

---

# 7. Flow — Browse Problem

## Goal

User có thể research Problem nhanh.

---

## Default Problem Page

Hiển thị:

```text
Overview
Research
Ideas
Discussions
Projects
Bounty if available
```

Không hiển thị comment thread trực tiếp.

---

## Core Actions

```text
Like
Save
Follow
Discuss
Propose Idea
Share
```

Nếu Problem có Bounty:

```text
View Bounty
Submit Solution
```

---

# 8. Flow — Browse Idea

## Goal

User hiểu solution và context.

---

## Page Sections

```text
Overview
Research
Previous Attempts
Linked Problem
Projects
Discussions
Sources
```

---

## Core Actions

```text
Like
Save
Follow
Discuss
Build This Idea
Share
```

---

# 9. Flow — Save to Collection

## Goal

Cho user tổ chức Problems/Ideas/Projects.

---

## Flow

```text
Save
↓
Choose Collection
↓
Existing Collection
or
Create New Collection
```

Default collection:

```text
Saved
```

---

## Supported Objects V1

```text
Problem
Idea
Project
```

---

# 10. Flow — Follow

User có thể follow:

```text
User
Problem
Idea
Project
```

Follow dùng cho:

- feed;
- notification;
- update tracking.

Follow không đồng nghĩa save.

---

# 11. Flow — Discuss

## Goal

Tách conversation khỏi canonical object.

---

## Entry

User bấm:

`Discuss`

trên:

- Problem;
- Idea;
- Project.

---

## Flow

```text
Discuss
↓
Create Post
↓
Canonical object automatically attached
↓
Write viewpoint
↓
Publish
↓
Appears in Social Feed
```

---

## Discussion Card

Discussion phải hiển thị reference card nhỏ tới object gốc.

Ví dụ:

```text
@zah

I think this idea underestimates distribution cost...

Referenced Idea:
Stablecoin Payroll for SEA Freelancers
```

---

## Replies

User reply vào Discussion.

Không reply trực tiếp vào Idea.

---

## Reverse Indexing

Idea/Problem/Project page phải query được:

```text
Discussions about this object
```

Có thể sort:

```text
Top
Recent
Most Discussed
```

---

# 12. Flow — Create Project

## Goal

Builder biến Idea thành thứ đang được build thật.

---

## Entry

```text
Idea
→ Build This Idea
```

---

## Required Fields

```text
project_name
one_line_description
idea_id
```

---

## Optional Fields

```text
team
github
demo
website
tech_stack
technical_notes
milestones
```

---

## Project Initial Status

```text
planning
```

Builder có thể đổi:

```text
planning
→ building
→ testing
→ live
```

---

# 13. Flow — Project Update

## Goal

Cho Project có lifecycle sống.

---

## Update Can Include

```text
status change
milestone
demo update
github update
team change
blocker
progress note
launch
```

Update không cần tạo Discussion automatically.

Nhưng user có thể:

`Discuss Update`

sau này.

---

# 14. Flow — Create Bounty

## Goal

Cho company/user attach economic incentive vào Problem.

---

## Entry

```text
Problem
→ Create Bounty
```

hoặc company dashboard:

```text
New Bounty
→ Select Problem
```

---

## Required Fields

```text
problem_id
bounty_type
title
description
submission_requirements
judging_criteria
deadline
prize_structure
currency
total_prize
```

---

## Bounty Types

```text
idea
prototype
build
```

---

## Prize Structure

V1:

```text
winner_take_all
ranked_prizes
```

Example:

```text
1st: 60%
2nd: 25%
3rd: 15%
```

Customizable.

---

## Optional Fields

```text
eligibility
region
required_skills
IP_terms
open_to_hiring
sponsor_message
```

---

## Initial State

```text
draft
```

Nếu monetary reward:

```text
awaiting_funding
```

sau khi creator xác nhận setup.

---

# 15. Flow — Fund Bounty

## Goal

Lock prize trước khi Bounty được coi là funded.

---

## Flow

```text
Company creates Bounty
↓
Review funding details
↓
Connect wallet
↓
Approve USDC/SOL
↓
Create / Fund Escrow
↓
Wait for blockchain confirmation
↓
Webhook
↓
Blockchain Worker
↓
DB updated
↓
Bounty = funded/open
```

---

## Source of Truth

Frontend transaction success không đủ.

Chỉ sau khi backend verify on-chain state:

```text
funded = true
```

---

## User Experience

Before confirmation:

```text
Funding pending...
```

After confirmation:

```text
Funded ✓
$10,000 locked in escrow
```

---

# 16. Flow — Submit to Bounty

## Goal

Builder submit Idea hoặc Project.

---

## Entry

```text
Bounty
→ Submit
```

---

## Validation by Bounty Type

### Idea Bounty

Require:

```text
idea_id
submission_statement
```

Optional:

```text
deck
attachments
```

---

### Prototype Bounty

Require:

```text
project_id
demo
submission_statement
```

Optional:

```text
github
video
deck
```

---

### Build Bounty

Require configurable fields such as:

```text
project_id
working_demo
github_or_source_access
technical_description
submission_statement
```

---

## Submission State

```text
draft
submitted
under_review
```

Submission becomes immutable after deadline except admin-controlled correction.

---

# 17. Flow — Review Submissions

## Goal

Sponsor/company review candidate solutions.

---

## Company Dashboard

Display:

```text
Submission
Team
Idea/Project
Demo
GitHub
Research
Submitted At
Eligibility
```

---

## Review Features V1

```text
view
shortlist
internal note
score
judge feedback
```

Scoring rubric derived from judging criteria.

---

# 18. Flow — Select Winners

## Goal

Convert judging result into final award structure.

---

## Flow

```text
Review complete
↓
Select Submission(s)
↓
Assign rank
↓
Validate prize totals
↓
Confirm result
```

System must enforce:

```text
sum(prizes) <= escrowed_amount
```

---

## Result

Examples:

```text
winner
runner_up
ranked
not_selected
```

---

## Important

Selecting winner does not automatically mean Project is successful.

It only determines Submission Result.

---

# 19. Flow — Payout

## Goal

Release escrow according to final result.

---

## Flow

```text
Sponsor confirms winners
↓
Backend creates payout intent
↓
Blockchain instruction
↓
Escrow releases funds
↓
Webhook confirmation
↓
Payout record updated
↓
Submission Result finalized
```

---

## Payout Rules

V1 should support:

```text
single payout
multiple ranked payouts
```

---

## Failure State

If blockchain transaction fails:

```text
payout_pending
```

Do not mark paid until confirmed.

---

# 20. Flow — Refund / Cancel Bounty

## Goal

Handle unused funds safely.

---

## Possible Cases

```text
bounty cancelled before opening
no valid submissions
deadline passed without result
admin dispute resolution
```

Refund rules must be defined before launch.

Smart contract must not allow arbitrary unilateral withdrawal after valid submissions without policy.

Detailed dispute logic belongs in smart contract specification.

---

# 21. Flow — External Submission

## Goal

Track Project history outside Gimme Idea.

---

## Example

Project submitted to:

- Colosseum;
- Superteam Earn;
- grant;
- accelerator.

---

## Flow

```text
Project
→ Add Submission
→ External Opportunity
```

Fields:

```text
opportunity_name
opportunity_type
external_url
submitted_at
result
rank
prize
```

This allows Project history to be preserved.

---

# 22. Flow — Import External Data

## Goal

Bootstrap Gimme Idea using public datasets.

---

## Initial Sources

Potential examples:

```text
Colosseum
public hackathon directories
Superteam ecosystem data
other public builder databases
```

---

## Import Flow

```text
Fetch / Upload Dataset
↓
Parse
↓
Normalize
↓
Detect Duplicate Candidates
↓
Create Imported Entity
↓
AI Research
↓
Verification
↓
Curated Publish
```

---

## Imported Data Rule

Imported entity must retain:

```text
source
source_url
external_id
imported_at
```

Do not pretend imported content was authored natively.

---

# 23. Flow — Claim Imported Entity

## Goal

Cho founder/builder claim Project/Idea được imported.

---

## Flow

```text
Imported Project
↓
Claim This Project
↓
Verification
↓
Ownership approved
```

Verification methods may later include:

- GitHub verification;
- domain/email verification;
- social verification;
- manual review.

V1 can start manual.

---

# 24. Flow — Duplicate Detection

## Goal

Tránh fragmented Problem/Idea graph.

---

## Create-Time Flow

User types title/problem.

System suggests:

```text
Similar Problems already exist
```

User can:

- select existing;
- continue creating new.

Do not hard block based only on similarity score.

---

## Post-Create Flow

AI may create:

```text
duplicate_candidate
```

Admin/trusted reviewer can:

```text
confirm duplicate
not duplicate
merge
```

---

# 25. Flow — Hiring Opportunity

## Goal

Turn demonstrated skill into employment/contract opportunities.

---

## Bounty Option

Sponsor can enable:

```text
Open to hiring top builders
```

This must be visible before submission.

---

## After Results

Company may:

```text
Contact Builder
Offer Contract
Invite to Interview
```

No automatic employment.

Gimme Idea only facilitates opportunity.

---

# 26. Flow — Notification

V1 notification triggers may include:

```text
new idea on followed problem
new discussion on followed idea
project update
bounty created on followed problem
bounty funded
submission status changed
winner selected
payout confirmed
someone replied
```

Notifications should be async.

---

# 27. Flow — Feed

## Goal

Show relevant activity without becoming generic social media.

Feed content should primarily reference domain objects.

Examples:

```text
New Problem
New Idea
Discussion
Project Update
New Bounty
Bounty Funded
Winner
Project Launch
```

---

## Avoid

Generic status posting unrelated to:

- Problem;
- Idea;
- Project;
- build;
- research;
- ecosystem opportunity.

Gimme Idea social layer should remain domain-focused.

---

# 28. MVP Priority

## P0 — Must Have

```text
Auth
Create Problem
Browse Problem
Create Idea
Browse Idea
AI Research
AI Verification
Like
Save
Discuss
Create Project
Create Bounty
Fund Escrow
Submit
Review
Select Winner
Payout
```

---

## P1 — Important After Core Stable

```text
Follow
Notifications
Collections
External Submissions
Imported Project Claim
Advanced Project Updates
Hiring Flow
Organization Dashboard
```

---

## P2 — Later

```text
Advanced reputation
Creator monetization
Problem scouting rewards
Recommendation engine
AI alerts
market intelligence
advanced hiring marketplace
futarchy
```

---

# 29. Out of Scope for V1

Do not build unless explicitly approved:

```text
DAO governance
token economy
tradable idea ownership
NFT-based reputation
fully on-chain social graph
generic freelance marketplace
full project management suite
real-time Discord-like chat
complex recursive forum system
algorithmic creator revenue sharing
```

---

# 30. Primary End-to-End Journey

A healthy Gimme Idea journey should look like:

```text
User discovers Problem
↓
Reads research
↓
Saves / Follows
↓
Explores existing Ideas
↓
Creates or Discusses Idea
↓
Builder creates Project
↓
Company adds funded Bounty
↓
Builder submits
↓
Company selects winner
↓
Escrow pays builder
↓
Project continues building
↓
Outcome becomes part of Gimme Idea knowledge base
```

The platform must preserve every step as structured data rather than reducing the entire journey into disconnected social posts.