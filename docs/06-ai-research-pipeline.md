# Gimme Idea — AI Research Pipeline

## 1. Purpose

Tài liệu này định nghĩa cách AI được sử dụng để research, enrich và verify:

- Problem;
- Idea;
- Previous Attempts;
- supporting evidence;
- risks;
- timing;
- competitors;
- market/context data.

Mục tiêu:

- AI giúp user research những phần họ không biết;
- không biến Gimme Idea thành AI idea generator;
- không làm sai lệch thesis của creator;
- mọi factual claim quan trọng phải có provenance/source;
- failure phải được phân tích theo context, không kết luận đơn giản rằng “idea dở”;
- AI output phải có thể audit;
- AI hallucination phải được fail-safe thay vì được polish rồi publish.

Core principle:

**User owns the thesis.<br>
AI owns the research task.<br>
Evidence owns the factual truth.**

---

# 2. AI Roles

V1 có hai AI role chính:

```text
AI Researcher
AI Verifier
```

Không dùng một agent duy nhất vừa research vừa tự chấm bài mình.

---

# 3. AI Researcher

AI Researcher chịu trách nhiệm:

- tìm information;
- tìm evidence;
- tìm competitor;
- tìm previous attempts;
- tìm market/context signals;
- phát hiện risks;
- phân tích timing;
- fill structured fields user chưa điền;
- tạo factual claims với source.

Researcher không được:

- thay đổi core thesis;
- tự tạo Problem mới để làm Idea nghe hợp lý hơn;
- tự thêm blockchain/AI/Web3 nếu user không đề cập;
- viết market size không có evidence;
- kết luận “idea good/bad”;
- tự tạo founder/project/company không tồn tại;
- fill field chỉ để schema trông đầy đủ.

---

# 4. AI Verifier

AI Verifier là một agent/model/pipeline độc lập về prompt và nhiệm vụ.

Verifier chịu trách nhiệm:

- kiểm tra source;
- kiểm tra claim;
- tìm contradiction;
- kiểm tra freshness;
- phát hiện unsupported inference;
- đánh giá mức confidence;
- yêu cầu Researcher research lại nếu cần;
- quyết định research block nào đủ chất lượng để publish.

Verifier không được:

- rewrite thesis;
- tự biến weak evidence thành strong evidence;
- “củng cố” claim bằng văn phong;
- judge Idea dựa trên taste cá nhân;
- reject Idea chỉ vì market nhỏ;
- reject Idea chỉ vì có competitor;
- reject Idea chỉ vì previous attempt fail.

---

# 5. Human/User Ownership

User là source of truth cho phần họ tự viết.

Đối với Idea, creator tự chịu trách nhiệm tối thiểu cho:

```text
title
one_line_description
primary_problem
opportunity
solution
```

User có thể tự điền thêm:

```text
how_it_works
target_segment
why_now
business_model
go_to_market
technical_approach
dependencies
competitors
risks
previous_attempts
success_metrics
```

AI chỉ fill những phần:

```text
missing
or
explicitly requested for research
```

---

# 6. User Content Must Be Preserved

Khi user submit:

Database phải lưu **original user version** trước khi AI chạy.

Concept:

```text
creator_input_version = 1

title_original
description_original
opportunity_original
solution_original
```

AI không được overwrite các field này silently.

Nếu AI muốn đề xuất correction:

```text
suggested_revision
```

phải là separate suggestion.

Creator có quyền:

```text
accept
reject
edit manually
```

---

# 7. Problem Research vs Idea Research

Problem và Idea cần research khác nhau.

Không dùng cùng một giant prompt cho cả hai.

---

# 8. Problem Research Goals

Problem research tập trung vào:

```text
Who actually has this problem?
How frequently does it happen?
How severe is it?
What is the economic/social impact?
What do people currently do about it?
Why are current workarounds insufficient?
Where does it occur?
Is the problem growing or declining?
What evidence indicates it is real?
What constraints prevent easy resolution?
```

Problem Research không nên đi sâu vào:

```text
Which startup should solve it?
Which exact technology should be used?
```

vì như vậy AI đã bắt đầu invent Solution.

---

# 9. Idea Research Goals

Idea research tập trung vào:

```text
Does this solution already exist?
Who is building something similar?
What alternatives exist?
What previous attempts were made?
What happened to them?
Why did they succeed/fail?
What changed since then?
What technical constraints exist?
What regulatory constraints exist?
What distribution/business risks exist?
What signals support the opportunity?
```

Idea Research luôn reference Primary Problem.

---

# 10. Field Ownership

Mỗi structured field phải có ownership/provenance.

Possible:

```text
user_provided
ai_researched
ai_verified
imported
platform_curated
external
```

Example:

```text
Opportunity
Source: user_provided

Competitor Landscape
Source: ai_researched

Regulatory Constraint
Source: ai_verified
```

Frontend có thể expose provenance ở Details/Research mode.

---

# 11. AI May Fill Only Allowed Fields

Define allowlist.

Example for Idea:

```text
AI_ALLOWED_FIELDS = [
    competitor_landscape,
    alternative_solutions,
    market_evidence,
    previous_attempts,
    technical_feasibility,
    technical_risks,
    regulatory_constraints,
    business_risks,
    distribution_risks,
    timing_signals,
    related_projects,
    supporting_sources
]
```

AI must not modify:

```text
AI_PROTECTED_FIELDS = [
    title,
    one_line_description,
    opportunity,
    solution,
    primary_problem_id,
    creator_user_id
]
```

unless creator explicitly asks for edit assistance.

---

# 12. Research Pipeline

Recommended lifecycle:

```text
User Submit
↓
Freeze User Thesis
↓
Normalize Input
↓
Research Planning
↓
Retrieval
↓
Evidence Extraction
↓
Structured Research
↓
Previous Attempt Analysis
↓
Claim Generation
↓
AI Verification
↓
Re-research if needed
↓
Quality Gate
↓
Publish / Publish with Warnings / Needs Review
```

---

# 13. Stage 1 — Freeze User Thesis

Immediately after submit:

```text
save creator-authored fields
create immutable version reference
create research_run
```

AI receives read-only thesis context.

---

# 14. Stage 2 — Normalize Input

Normalization can include:

- normalize category;
- normalize geography;
- identify entities;
- clean URLs;
- language detection;
- resolve obvious aliases.

Normalization must not reinterpret the business thesis.

Example:

User:

> VN

may normalize to:

> Vietnam

But:

> payroll tool

must not normalize into:

> decentralized Solana payroll protocol

unless user said so.

---

# 15. Stage 3 — Research Planning

Before searching, Researcher creates an internal structured plan.

Example:

```text
Research Questions:

1. Is Problem X documented?
2. Who experiences it?
3. Existing solutions?
4. Similar companies/projects?
5. Previous attempts?
6. Relevant technical constraints?
7. Relevant regulations?
8. Timing changes?
```

Research plan is not necessarily shown publicly.

Purpose:

avoid random browsing and fill-the-schema behavior.

---

# 16. Stage 4 — Retrieval

Researcher retrieves external sources.

Preferred categories:

```text
official documentation
government/regulator
company/project primary source
academic/research institution
reputable industry reports
credible journalism
public databases
GitHub/project repositories
hackathon directories
founder post-mortems
```

Community sources may be used for:

```text
user sentiment
developer experience
anecdotal evidence
community perception
```

but must be labeled appropriately.

---

# 17. Source Hierarchy

Default source trust priority:

## Tier A — Primary / Authoritative

```text
government/regulator
official statistics
company/project official docs
GitHub repository owned by project
academic paper
official legal text
official hackathon/project directory
```

## Tier B — High-quality Secondary

```text
reputable journalism
industry research
recognized analyst reports
reputable databases
```

## Tier C — Community / Anecdotal

```text
Reddit
X
forum
Discord public archive
individual blog
community posts
```

## Tier D — Weak

```text
SEO farms
anonymous reposts
content aggregators
unsourced AI-generated pages
```

Tier D should generally not support important factual claims.

---

# 18. Source Quality Score

Each source may receive internal score:

```text
authority
relevance
freshness
directness
independence
```

Example conceptual:

```text
source_quality_score = 0.0 – 1.0
```

Do not expose fake mathematical precision to users.

Frontend can show simpler labels:

```text
High-quality source
Moderate source
Community evidence
Weak evidence
```

---

# 19. Freshness

Research must track:

```text
published_at
retrieved_at
```

Some claims decay quickly.

Examples:

```text
regulation
company status
product pricing
market adoption
funding
technology capability
```

Some claims decay slowly:

```text
historical events
previous shutdown
academic fundamentals
```

Verifier must consider freshness based on claim category.

---

# 20. Claim-Based Research

Research output should not be one giant essay.

Break factual research into claims.

Example:

```text
Claim:
Company X shut down Product Y in 2023.

Category:
previous_attempt

Evidence:
Source A
Source B

Confidence:
High

Verification:
Supported
```

This makes research auditable and updateable.

---

# 21. Claim Types

Suggested categories:

```text
problem_evidence
market
competitor
alternative
technical
regulatory
timing
risk
previous_attempt
demand_signal
company_status
funding
adoption
other
```

---

# 22. Facts vs Inference vs Hypothesis

Every claim should internally distinguish:

```text
fact
inference
hypothesis
```

Example:

### Fact

> Company X shut down in 2024.

### Inference

> Distribution difficulties likely contributed to shutdown.

### Hypothesis

> The same model may work today because acquisition costs have changed.

Do not present all three with identical confidence.

---

# 23. Previous Attempt Research

Previous Attempts are a core differentiator.

Researcher should search:

```text
similar startup
similar product
similar thesis
same problem + similar mechanism
hackathon attempts
open-source projects
shutdown products
acquired products
pivoted companies
```

---

# 24. Similarity Level

Every Previous Attempt needs:

```text
relevance_to_current_idea
```

Possible:

```text
very_similar
similar
partial_overlap
same_problem_different_solution
same_solution_different_market
weakly_related
```

This prevents:

> “Some random company existed, therefore this idea was already tried.”

---

# 25. Failure Analysis

AI must never use:

```text
Failure reason = bad idea
```

as default.

Failure analysis should separate factors:

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

Multiple factors allowed.

---

# 26. Root Cause vs Final Event

Important distinction:

```text
Ran out of money
```

may be final event.

But root cause may be:

```text
sales cycle too long
customer acquisition too expensive
fundraising market collapsed
technical cost too high
```

Researcher should try to distinguish:

```text
proximate event
root causes
contributing factors
```

---

# 27. Timing Analysis

Every meaningful Previous Attempt should ask:

```text
What was true then?
What is true now?
What changed?
```

Possible changes:

```text
technology cost
infrastructure
regulation
consumer behavior
distribution channels
market size
hardware availability
developer tooling
payment rails
social norms
AI capability
blockchain capability
```

---

# 28. What Changed Since

`what_changed_since` should be evidence-backed where possible.

Bad:

> AI is better now.

Better:

> Inference cost for comparable models has fallen materially while API/tool availability expanded.

and attach evidence.

---

# 29. AI Must Not Force Previous Attempts

If no credible Previous Attempt exists:

```text
previous_attempts = []
```

and:

```text
No sufficiently similar previous attempt found.
```

Do not fill with unrelated companies.

---

# 30. Competitor Research

Separate:

```text
direct competitors
indirect competitors
current workaround
substitutes
```

Example:

Problem:

> Small business needs international payment.

Direct competitor:

> cross-border payment fintech.

Indirect:

> bank transfer.

Current workaround:

> PayPal + manual invoices.

Do not collapse these into one competitor list.

---

# 31. Market Research

Avoid fake TAM.

Researcher should prefer:

```text
documented user count
transaction volume
industry size
growth rate
reported spending
number of organizations affected
usage/adoption signal
```

If TAM/SAM/SOM cannot be responsibly established:

do not invent them.

---

# 32. Regulation Research

Regulation is high-risk information.

Requirements:

- prioritize official legal/regulator source;
- store jurisdiction;
- store effective date;
- distinguish enacted vs proposed;
- distinguish law vs guidance;
- show uncertainty;
- avoid presenting legal research as legal advice.

Example:

```text
Jurisdiction: Vietnam
Status: Effective
Source: Official legal text
Checked: 2026-08-31
```

---

# 33. Technical Feasibility Research

Researcher may identify:

```text
required infrastructure
APIs
blockchain dependency
AI capability
hardware requirement
scaling constraint
security requirement
known technical blocker
```

But it should not create full implementation plan unless product explicitly asks.

Purpose:

> Can this reasonably be built?

not:

> Here are 87 engineering tickets.

---

# 34. Risk Research

Separate risk types:

```text
market
distribution
technical
regulatory
business_model
dependency
security
operational
behavioral
timing
```

Risk must be phrased as:

```text
risk / condition / evidence
```

not dramatic generic text.

Bad:

> Competition is fierce.

Better:

> Three incumbent platforms already bundle this feature with existing distribution.

---

# 35. Research Confidence

Confidence should depend on evidence.

Suggested internal mapping:

```text
High
Medium
Low
Unknown
```

Avoid showing users:

```text
87.42% confidence
```

unless model is actually calibrated.

---

# 36. Verification Pipeline

Verifier receives:

```text
Original User Thesis
Research Output
Claims
Sources
Researcher reasoning metadata if allowed
Current date
Verification rules
```

Verifier does not rely only on Researcher summaries.

It should inspect source evidence.

---

# 37. Verification Checklist

For each claim:

```text
Does source exist?
Is source accessible?
Does source actually support claim?
Is the claim more specific than evidence?
Is evidence fresh enough?
Is source authoritative enough for claim type?
Are there contradictions?
Is inference labeled as inference?
Is legal claim sourced to correct jurisdiction?
Is previous attempt actually similar?
```

---

# 38. Verification Result

Allowed:

```text
supported
partially_supported
unsupported
contradicted
unknown
```

---

# 39. Supported

Evidence directly supports material claim.

---

# 40. Partially Supported

Example:

Claim:

> Company shut down because regulation killed it.

Evidence confirms shutdown and regulatory pressure but not sole causation.

Verifier returns:

```text
partially_supported
```

and rewrites only the AI research claim to something narrower.

It does not edit creator thesis.

---

# 41. Unsupported

No sufficient source.

The claim should not be presented as fact.

Possible action:

```text
remove from published research
or
display as unverified hypothesis
```

---

# 42. Contradicted

Reliable evidence directly conflicts.

Example:

Researcher:

> Project shut down in 2023.

Official project:

> Still active in 2026.

Result:

```text
contradicted
```

Research must be corrected before publish.

---

# 43. Unknown

Evidence insufficient or ambiguous.

Valid result.

Unknown is better than fabricated certainty.

---

# 44. Re-Research Loop

Verifier may return:

```text
RESEARCH_AGAIN
```

with targeted questions.

Example:

```text
The source confirms shutdown but does not support claimed root cause.
Find first-party post-mortem or downgrade the claim.
```

Flow:

```text
Researcher
↓
Verifier
↓
Needs More Evidence
↓
Researcher targeted retry
↓
Verifier
```

Do not allow infinite loops.

---

# 45. Maximum Verification Loops

Recommended:

```text
2 targeted re-research attempts
```

After that:

```text
Unknown
Insufficient evidence
Needs human review
```

depending on importance.

Avoid burning unlimited AI cost.

---

# 46. Quality Gate

After verification, entity gets one of:

```text
READY
READY_WITH_WARNINGS
NEEDS_REVIEW
FAILED_RESEARCH
```

---

# 47. READY

Required research pipeline passed.

Publish.

---

# 48. READY_WITH_WARNINGS

Entity can publish but some optional research remains:

```text
Low confidence
No credible market data
No previous attempt found
```

This is acceptable.

---

# 49. NEEDS_REVIEW

Triggered by material issue such as:

```text
major contradiction
high-risk legal claim
unclear ownership
possible plagiarism
sensitive internal data
AI cannot determine duplicate
suspicious source
```

Human/admin review required.

---

# 50. FAILED_RESEARCH

AI infrastructure failed or no useful research could complete.

Important:

This does NOT necessarily mean reject user submission.

Depending on moderation policy:

Problem/Idea may publish with:

```text
Research unavailable
```

if creator-authored content itself is acceptable.

---

# 51. Strict Reviewer Does Not Mean Creative Reviewer

The “strict AI” should be strict about:

```text
evidence
logic
source quality
provenance
contradiction
```

not strict about:

```text
idea originality
business taste
founder prestige
market hype
technology preference
```

---

# 52. Publication Must Preserve Uncertainty

Allowed UI:

```text
Evidence: Strong

Evidence: Limited

Needs verification

No reliable data found
```

Do not hide uncertainty because it looks less polished.

Trust > completeness.

---

# 53. Research Versioning

Research becomes stale.

Never overwrite historical run.

Use:

```text
Research Run v1
Research Run v2
Research Run v3
```

Each run stores:

```text
model
provider
prompt_version
pipeline_version
started_at
completed_at
```

---

# 54. Research Refresh

Potential triggers:

```text
manual refresh by owner
scheduled refresh
major discussion signal
new competitor detected
company shutdown
regulatory change
project launch
import update
```

V1 does not need automatic refresh for every entity.

Manual + selective refresh is enough initially.

---

# 55. Research Freshness UI

Possible:

```text
Last researched:
Aug 31, 2026

6 sources

2 claims may be outdated
```

Useful especially for:

- regulation;
- competitors;
- market state;
- pricing;
- company status.

---

# 56. User Corrections

User/community should be able to flag research.

Action:

```text
Report Research
```

Reasons:

```text
incorrect
outdated
bad source
missing context
wrong company
wrong regulation
duplicate
other
```

Report creates review/research refresh task.

---

# 57. Creator Disagreement

Creator may disagree with AI research.

Creator must NOT be able to simply delete verified negative research about their Idea if it is factual.

They may:

```text
respond
provide counter-evidence
request review
```

This maintains credibility.

---

# 58. Provenance UI

Details mode should distinguish clearly:

```text
Creator provided
AI researched
Verified by Gimme AI
Imported source
Community correction
```

Do not present all content as if creator wrote it.

---

# 59. Research Cost Control

AI research can be expensive.

Do not trigger full research on:

```text
every page view
every like
every edit
```

Research starts on explicit events.

Example:

```text
new publish candidate
manual refresh
scheduled high-value refresh
admin/import request
```

---

# 60. Research Depth

V1 may define:

```text
STANDARD
DEEP
```

but normal user submissions should default to controlled Standard Research.

Deep Research may later be:

- premium;
- admin;
- company;
- high-value bounty;
- high-engagement Problem.

Do not run maximum-cost research on every low-quality submission.

---

# 61. Priority Queue

AI jobs may have priority:

```text
P0 Funded Bounty Problem
P1 Organization Problem
P2 Published User Idea
P3 Imported Seed Content
P4 Refresh / maintenance
```

Economic/high-value objects can receive faster research.

---

# 62. Duplicate Detection During Research

Research pipeline may search existing Gimme Idea entities.

Before publish:

```text
similar Problems
similar Ideas
similar Projects
```

AI produces:

```text
duplicate candidates
```

not automatic merge.

---

# 63. Duplicate Scoring Inputs

For Problem:

```text
affected user
pain
context
industry
geography
desired outcome
```

For Idea:

```text
primary Problem
target user
mechanism
value proposition
technical approach
```

Title similarity alone is insufficient.

---

# 64. AI Output Must Be Structured

All AI worker outputs must use validated structured schemas.

Never parse arbitrary prose with regex if avoidable.

Example conceptual:

```text
ResearchResult {
    claims[]
    previous_attempts[]
    competitors[]
    risks[]
    timing_signals[]
    sources[]
}
```

Validate before DB write.

---

# 65. AI Output Is Untrusted Input

Even structured output may be wrong.

Pipeline:

```text
Model Output
↓
Schema Validation
↓
Business Validation
↓
Source Validation
↓
Verifier
↓
DB
```

AI never directly writes arbitrary database records.

---

# 66. Prompt Versioning

Prompts live in code/versioned configuration.

Every research run stores:

```text
research_prompt_version
verifier_prompt_version
```

This allows:

- debugging;
- A/B testing;
- rollback;
- understanding why old research differs.

---

# 67. Provider Abstraction

Do not hard-wire domain layer to one AI provider.

Use interface conceptually:

```text
ResearchProvider
VerifierProvider
```

Possible future:

```text
OpenAI
Anthropic
Gemini
specialized search provider
```

Provider switching must not change canonical DB schema.

---

# 68. Research Job Idempotency

Stable job identity:

```text
entity_type
entity_id
requested_version
```

Retry must not create duplicate active research.

---

# 69. Failure Recovery

If provider timeout:

```text
retry with backoff
```

If persistent failure:

```text
failed_research
```

User thesis remains saved.

Website remains functional.

---

# 70. Research Queue Separation

Recommended queues:

```text
ai-research-problem
ai-research-idea
ai-verification
ai-refresh
```

If unnecessary operationally, queues may be combined but job type must remain explicit.

---

# 71. Rate Limits

User cannot spam:

```text
Research Again
Research Again
Research Again
```

Implement:

- cooldown;
- quota;
- owner/admin rules;
- optional future paid refresh.

---

# 72. Imported Data Research

Imported entities require extra caution.

Pipeline:

```text
Import Raw Data
↓
Preserve Raw Payload
↓
Normalize
↓
Research
↓
Verify
↓
Duplicate Detection
↓
Platform Review if needed
↓
Publish
```

Internal datasets must never automatically become public.

---

# 73. STVN Internal Dataset Rule

If an imported source is marked INTERNAL:

```text
is_internal = true
```

AI may use it for internal analysis only according to permissions.

It must not:

- copy competitive intelligence verbatim;
- expose internal legal notes;
- publish private contacts;
- expose confidential source annotations;
- publish unsupported claims as public facts.

Public conversion requires explicit curation.

---

# 74. Colosseum / Hackathon Data

Imported hackathon project data may help populate:

```text
Project
External Submission
Previous Attempt
Idea research
```

But a hackathon project should not automatically be treated as:

```text
successful company
validated market
failed idea
```

Hackathon result only means:

```text
Submission Result
```

not Project Outcome.

---

# 75. Previous Attempt from Hackathons

A hackathon submission may count as Previous Attempt only if:

```text
solution similarity is meaningful
```

and research can establish enough information.

Do not flood Previous Attempts with thousands of weakly related hackathon projects.

---

# 76. AI Safety Around Contacts

AI must not scrape or expose private personal contact data.

Allowed:

```text
public project contact
public company contact
public GitHub
public founder profile
official website
```

Do not infer or expose:

```text
private phone
private email
personal address
```

---

# 77. Sensitive Business Information

Research may encounter:

- leaked decks;
- private documents;
- exposed credentials;
- confidential spreadsheets.

Do not ingest or publish improperly obtained confidential material.

Use legitimate public sources.

---

# 78. Research Presentation

AI research should be concise enough to scan.

Do not generate massive essay by default.

Structured sections are preferred:

```text
Evidence
Competitors
Previous Attempts
Risks
Timing
Regulation
Technical Notes
Sources
```

User can expand details.

---

# 79. Overview Is Not AI Rewrite

Critical:

`Overview`

must not be generated as a simplified reinterpretation of creator thesis by default.

Overview uses:

```text
creator-authored content
+
selected verified metadata
```

Details/Research exposes deeper AI research.

This ensures low-tech readers still read what creator actually meant.

---

# 80. No Hidden AI Enhancement

Do not silently turn:

> tool for students to find teammates

into:

> AI-powered decentralized reputation-based talent liquidity protocol.

AI enhancement should never alter product thesis without user approval.

---

# 81. Research Status

Entity may expose:

```text
Not Researched
Researching
Verifying
Verified
Partially Verified
Needs Review
Outdated
```

Do not use:

```text
AI Approved Idea
```

because AI is not approving business quality.

---

# 82. Research Trust Score

V1 should avoid one giant:

```text
Trust Score = 83/100
```

because it can falsely imply scientific precision.

Prefer explainable dimensions:

```text
Source Quality: High
Evidence Coverage: Medium
Freshness: High
Contradictions: None
```

Ranking system may use numeric scores internally.

---

# 83. Ranking Input from Research

Research quality can influence ranking modestly.

Example signals:

```text
verified evidence count
source quality
freshness
research completeness
```

But ranking must not mean:

> more research = better Idea.

Research quality and idea quality are separate.

---

# 84. Required Audit Trail

For each AI-derived field/claim, system should be able to answer:

```text
Who/what created it?
Which model?
Which prompt version?
When?
From which source?
Was it verified?
Was it modified?
```

This is essential for debugging trust.

---

# 85. AI Pipeline Metrics

Track:

```text
research jobs
verification jobs
average duration
average cost
failure rate
re-research rate
claims generated
claims rejected
claims contradicted
source count
human review rate
```

Important product metric:

```text
% of AI claims rejected by verifier
```

If high:

Researcher prompt/provider needs improvement.

---

# 86. Quality Monitoring

Sample verified research periodically for human review.

Purpose:

- detect systematic hallucination;
- detect source bias;
- check legal research quality;
- identify overly aggressive inference;
- improve prompts.

Even if system is mostly automated, human QA is required during V1.

---

# 87. V1 Human Review Triggers

Recommended mandatory/manual review for:

```text
internal imported datasets
material legal contradiction
high-value bounty problem
suspected plagiarism
sensitive company claim
duplicate merge
research dispute involving payout
```

Not every normal Idea needs human approval.

---

# 88. Research Does Not Block Product Forever

If AI cannot confidently research a niche Problem:

Do not keep it stuck for days.

Possible:

```text
Publish creator thesis
Research Status: Limited Evidence
```

The platform should not punish novel ideas simply because internet data is scarce.

---

# 89. Novelty Paradox

A truly new Idea may naturally have:

```text
few competitors
few previous attempts
little market data
```

AI must not interpret absence of evidence as:

```text
bad idea
```

It should state:

```text
Limited comparable evidence found.
```

---

# 90. AI Research Invariants

### Invariant 1

Creator thesis is preserved.

### Invariant 2

AI cannot silently change Primary Problem.

### Invariant 3

Important factual claims require evidence.

### Invariant 4

Unsupported claim is not published as fact.

### Invariant 5

Unknown is a valid answer.

### Invariant 6

Previous failure does not imply current Idea failure.

### Invariant 7

Failure is analyzed as multi-factor.

### Invariant 8

Timing changes must be considered where relevant.

### Invariant 9

Legal/regulatory claims require high-quality jurisdiction-specific sources.

### Invariant 10

Research and verification are separate responsibilities.

### Invariant 11

Verifier evaluates evidence quality, not business taste.

### Invariant 12

AI cannot automatically merge duplicates.

### Invariant 13

AI output is validated before DB write.

### Invariant 14

Research remains versioned and auditable.

### Invariant 15

Imported/internal data cannot automatically become public research.

---

# 91. Implementation Instructions for AI Agents

Before implementing AI pipeline, read:

```text
00-product-overview.md
01-domain-model.md
02-prd-core-flows.md
03-system-architecture.md
04-database-schema-draft.md
06-ai-research-pipeline.md
```

Then produce:

1. Structured schemas for:
   - ProblemResearchResult
   - IdeaResearchResult
   - PreviousAttemptResult
   - VerificationResult

2. Research state machine.

3. Queue/job definitions.

4. Provider abstraction.

5. Source evaluation rules.

6. Prompt version strategy.

7. Error/retry strategy.

8. Cost limits.

9. Test fixtures.

10. Human-review triggers.

Only after these are reviewed should production prompts be written.

---

# 92. Required Test Cases

AI pipeline tests should include:

### Sparse Idea

User gives only required fields.

AI must enrich without changing thesis.

### Detailed Idea

User already filled most fields.

AI must not overwrite them.

### No Competitor

AI must return none rather than invent competitor.

### Failed Similar Startup

AI distinguishes company failure from idea invalidity.

### Timing Change

Previous attempt failed because infrastructure was immature.

AI captures what changed.

### Contradictory Sources

Verifier flags contradiction.

### Fake Source

Verifier rejects.

### Old Regulation

Verifier identifies outdated legal source.

### Novel Idea

Limited evidence does not block publishing.

### Duplicate Idea

AI suggests duplicate candidate but does not merge.

### Internal Dataset

Private notes do not leak into public research.

### AI Research Failure

User submission remains safe and recoverable.

---

# 93. Product Mental Model

The correct user experience is:

```text
"I know the Problem and the Idea.

I tell Gimme Idea what I know.

Gimme Idea researches what I don't know.

Then another AI checks whether that research is actually defensible.

The platform clearly shows me what came from me,
what came from AI,
and what has evidence."
```

Not:

```text
"I give AI five words and it invents a startup for me."
```

Gimme Idea uses AI to increase the **information quality surrounding human ideas**, not to replace the humans who create them.
