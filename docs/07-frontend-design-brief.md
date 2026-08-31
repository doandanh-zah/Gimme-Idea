# Gimme Idea — Frontend Design Brief

## 1. Purpose

Tài liệu này định nghĩa frontend direction cho Gimme Idea V1.

Mục tiêu:

- tránh generic SaaS UI;
- phản ánh đúng product model `Problem → Idea → Build`;
- phục vụ đồng thời low-tech users và technical builders;
- giữ canonical knowledge pages sạch và dễ research;
- social conversation có identity riêng;
- bounty/economic layer phải minh bạch;
- landing page tạo strong product identity bằng Three.js;
- UX vẫn nhanh và usable trên mobile/low-end devices.

---

# 2. Mandatory Zahlook Requirement

Bất kỳ AI agent nào thiết kế hoặc implement frontend phải:

**USE THE ZAHLOOK SKILL BEFORE WRITING FRONTEND CODE.**

Không được bỏ qua Zahlook rồi tự tạo một generic component library hoặc SaaS dashboard.

Zahlook phải được dùng để xác định:

- visual direction;
- design system;
- interaction states;
- animation;
- responsive behavior;
- mobile navigation;
- loading states;
- empty states;
- error states;
- success states;
- disabled states;
- wallet states;
- accessibility;
- localization readiness;
- Three.js integration;
- frontend performance.

Nếu Zahlook recommendation xung đột với product/domain docs:

**Product/domain docs giữ quyền ưu tiên về behavior.**

Zahlook quyết định cách thể hiện behavior đó tốt nhất trên frontend.

---

# 3. Product Experience

Gimme Idea không nên có cảm giác như:

```text
Notion database
Reddit clone
Upwork clone
Product Hunt clone
generic Web3 dashboard
generic AI startup generator
```

Product nên cảm giác như:

> một living network của Problems, Ideas, Discussions và Builds.

Người dùng phải cảm nhận được:

```text
Discover
↓
Understand
↓
Think
↓
Discuss
↓
Build
↓
Earn
```

---

# 4. Design Personality

Core visual personality:

```text
Intelligent
Experimental
Technical
Curious
Builder-oriented
Research-oriented
Premium
Playful
Energetic
Trustworthy
```

Không nên:

```text
corporate banking
overly crypto
neon cyberpunk everywhere
cute startup SaaS
template dashboard
sterile enterprise software
```

---

# 5. Visual Philosophy

Gimme Idea nên thể hiện metaphor:

> Problems là các tín hiệu chưa được giải quyết.

> Ideas là các connection/pattern xuất hiện từ những tín hiệu đó.

> Builders biến các connection thành Projects.

Visual system có thể sử dụng:

- nodes;
- lines;
- fragments;
- cards;
- modular blocks;
- connected objects;
- subtle grid;
- spatial depth;
- layered information.

Không dùng blockchain visuals cliché kiểu:

- coins bay;
- chain links;
- Bitcoin symbols;
- neon wallet icons;

trừ khi context thực sự cần.

---

# 6. Information Density

Gimme Idea có nhiều research data.

UI không được cố nhét mọi data vào một screen.

Dùng:

**progressive disclosure**

Thông tin quan trọng nhất luôn visible.

Research sâu có thể:

- expand;
- collapse;
- tab;
- drill down;
- open side panel.

Low-tech user phải hiểu Idea mà không đọc tất cả research.

Technical user phải có thể đi sâu mà không thấy product quá shallow.

---

# 7. Core Navigation

Recommended desktop navigation:

```text
Logo

Problems
Ideas
Discuss
Builds
Bounties

Search

Create
Notifications
Profile
```

Không cần expose mọi entity như một top-level nav item.

---

# 8. Global Create

Primary creation action:

```text
+ Create
```

Opens options:

```text
Problem
Idea
Project
Discussion
```

Bounty creation có thể nằm trong:

```text
Problem
→ Add Bounty
```

hoặc Organization dashboard.

Không cần đưa:

```text
Create Bounty
```

thành action primary cho mọi user.

---

# 9. Home / Discovery Feed

Logged-in home không nên chỉ là social timeline.

Nó nên mix:

```text
Problems worth exploring
New Ideas
Active Discussions
Projects being built
Funded Problems
Updates from followed objects
```

Feed phải luôn có relationship tới product domain.

Avoid generic:

> “What's on your mind?”

---

# 10. Landing Page Goal

Landing page phải giải thích product bằng trải nghiệm visual trước khi user đọc một wall of text.

Primary narrative:

```text
Problems exist everywhere
↓
Ideas emerge
↓
People discuss them
↓
Builders connect pieces
↓
Solutions become real
```

---

# 11. Three.js Hero — Mandatory

Landing page MUST contain an interactive Three.js hero.

Core object:

**3D Brain / Idea Brain**

Brain không cần realistic medical brain.

Nên abstract/stylized hơn:

- neural;
- modular;
- fragmented;
- technological;
- artistic.

Có thể cấu thành từ:

- nodes;
- meshes;
- translucent surfaces;
- particles;
- wires;
- fragments.

---

# 12. Brain Initial State

First viewport:

Brain nằm gần center hoặc slightly offset.

Behavior:

- slow idle rotation;
- subtle breathing/pulsing;
- tiny particles;
- restrained camera movement.

Headline đi cùng:

```text
Problems are everywhere.
Ideas shouldn't disappear.
```

Copy cuối cùng có thể được refine sau.

Không để 3D object làm text khó đọc.

---

# 13. Scroll Storytelling

Scroll phải điều khiển narrative.

Không chỉ:

```text
scroll
→ brain rotates forever
```

Mà phải có sequence.

---

# 14. Scene 1 — Problem

Brain tương đối intact.

Quanh nó xuất hiện các signal fragments:

```text
pain points
questions
broken systems
market gaps
unfinished thoughts
```

Visual abstraction có thể là:

- redacted cards;
- short problem labels;
- floating blocks;
- nodes.

Message:

> Problems begin as disconnected signals.

---

# 15. Scene 2 — Idea Emergence

Khi scroll:

Brain rotate rõ hơn.

Một số phần brain bắt đầu:

```text
separate
expand
open
```

Từ đó bung ra các idea fragments.

Visual objects:

- puzzle piece;
- light bulb;
- node cluster;
- code brackets;
- sketch;
- gear;
- sticky note;
- small cube;
- spark;
- graph fragment.

Không nên dùng icon pack 2D đơn giản đặt vào 3D scene.

Các object nên có cùng art direction.

---

# 16. Scene 3 — Connection

Các fragments bắt đầu liên kết.

Lines/nodes connect:

```text
Problem
→ Idea
→ Discussion
→ Builder
```

Camera có thể move nhẹ xuyên qua network.

Một số card UI thật có thể overlay vào scene.

Ví dụ:

```text
Problem
Food waste in small restaurants

12 Ideas
31 Discussions
3 Builders interested
```

---

# 17. Scene 4 — Build

Các fragment hội tụ thành object mới.

Metaphor:

```text
idea fragments
↓
assemble
↓
working structure
```

Có thể biến thành:

- prototype;
- geometric object;
- product cube;
- connected system.

Message:

> Ideas matter when someone builds them.

---

# 18. Scene 5 — Economic Layer

Một funded problem xuất hiện.

Không cần crypto spectacle.

Có thể chỉ dùng UI element:

```text
$10,000 Bounty
Funded ✓
```

và một subtle flow từ Problem → Builder → Project.

Message:

> Some problems are worth paying to solve.

---

# 19. Landing CTA

Landing không nên chỉ có:

```text
Get Started
```

Recommended dual CTA:

```text
Explore Problems
Post a Problem
```

Secondary possibility:

```text
Find Something to Build
```

---

# 20. Landing Page Sections

After cinematic hero:

Recommended structure:

### Problem Network

Giải thích Problem Bank.

### From Problem to Idea

Visual lifecycle.

### Research Before You Build

AI research + previous attempts.

### Discuss Without Polluting the Source

Explain canonical page + discussion model.

### Build It

Show Project layer.

### Funded Problems

Explain bounty.

### For Builders / Creators / Companies

Different value propositions.

### Current Problems / Ideas

Real content cards.

### Final CTA

Join / Explore.

---

# 21. 3D Performance

Three.js hero là differentiator nhưng không được làm website lag.

Mandatory:

```text
lazy loading
route-level isolation
mobile fallback
reduced-motion support
low-power fallback
asset compression
reasonable polygon count
adaptive DPR
```

---

# 22. Mobile 3D Experience

Không cố reproduce desktop cinematic scene 1:1.

Mobile có thể:

- simplify brain;
- reduce object count;
- remove expensive particles;
- shorten scroll sequence;
- reduce camera movement;
- use baked/static lighting;
- use pre-rendered fallback on weak devices.

Product usability > 3D fidelity.

---

# 23. Reduced Motion

Respect:

```text
prefers-reduced-motion
```

User vẫn phải hiểu story.

Fallback có thể là:

```text
static brain
+
crossfade between states
```

Không ép parallax/rotation.

---

# 24. Public Problem Page

Problem page là canonical research page.

Không được trông như social post.

Recommended hierarchy:

```text
Problem Title
One-line Description

Creator / Organization
Category
Region
Source / Provenance

Actions:
Like
Save
Follow
Discuss
Share

Primary Content:
Problem
Who experiences it
Why it matters
Desired outcome

Research
Current workaround
Existing solutions
Evidence
Constraints
Timing

Ideas
Projects
Discussions

Bounty if attached
```

---

# 25. Problem Page — Overview Mode

Overview phải giúp low-tech user hiểu nhanh.

Focus:

```text
What is the problem?
Who has it?
Why does it matter?
What would better look like?
```

Không dump:

- long source tables;
- technical constraints;
- legal citations;

immediately.

---

# 26. Problem Page — Research Mode

Research/Details mode có thể show:

```text
Evidence
Current Workarounds
Existing Solutions
Market Context
Constraints
Timing
Sources
Research freshness
AI provenance
```

Use collapsible subsections.

---

# 27. Problem Actions

Primary actions should not all have equal visual weight.

Recommended hierarchy:

Primary:

```text
Propose Idea
```

If funded:

```text
Submit Solution
```

Secondary:

```text
Discuss
Save
Follow
Share
```

Like can remain lightweight.

---

# 28. Funded Problem Card

A funded Problem must communicate trust immediately.

Example:

```text
$10,000 Bounty

FUNDED ✓

Deadline
Sep 20

18 submissions
```

Potential advanced info:

```text
Funds locked on Solana
View escrow
```

Do not show confusing wallet/address information by default.

---

# 29. Idea Page

Idea page is also canonical.

Not a social thread.

Top structure:

```text
Idea Title
One-line Description

Creator
Primary Problem

Like
Save
Follow
Discuss
Build This Idea
Share
```

---

# 30. Idea Core Content

Creator-authored core must be visually distinguishable:

```text
Problem
Opportunity
Solution
```

Although Problem references canonical Problem object, UI can show concise embedded Problem context.

Do not duplicate the full Problem page.

---

# 31. Idea Research Sections

Possible:

```text
How it Works
Target Users
Why Now
Competitors
Alternatives
Market Evidence
Technical Feasibility
Risks
Regulatory Constraints
Previous Attempts
Sources
```

Not every Idea will have all sections.

Do not render empty cards everywhere.

---

# 32. Previous Attempts UI

This section should be a strong differentiator.

Recommended card:

```text
Project X
2019–2022

Outcome:
Shutdown

Similar to this Idea:
High

What happened:
...

Factors:
Timing
Distribution
Capital

What changed since:
...

Sources
```

Important:

Do not show:

```text
FAILED IDEA
```

in giant red text.

Outcome belongs to previous attempt, not current Idea.

---

# 33. Failure Visual Language

Avoid binary:

```text
SUCCESS
FAIL
```

as the only outcome language.

Use nuanced chips:

```text
Shutdown
Pivoted
Partial Success
Acquired
Paused
Still Active
```

Failure factors can use tags.

Timing should be visible where important.

---

# 34. Research Provenance UI

Research detail should expose:

```text
Creator provided
AI researched
Verified
Imported
```

Possible subtle indicator:

```text
AI researched · 7 sources · checked Aug 31, 2026
```

Click/expand for source details.

Do not put giant “AI GENERATED” labels over everything.

---

# 35. Confidence UI

Prefer human-readable:

```text
Strong evidence
Moderate evidence
Limited evidence
Unverified
```

Avoid fake:

```text
AI Confidence 87.32%
```

unless actually calibrated.

---

# 36. Research Source UI

Sources should be:

- clickable;
- grouped logically;
- show publisher;
- show date;
- show what claim they support where practical.

Avoid giant bibliography walls.

---

# 37. Discuss Action

`Discuss` is a core interaction.

Clicking it should open:

```text
composer
```

with referenced object already attached.

Example:

```text
What's your take?

[ user writes viewpoint ]

Referenced Idea:
Stablecoin Payroll
```

---

# 38. Discussion Feed

Discussion is where social behavior lives.

A Discussion Post can contain:

```text
Author
Text
Referenced Problem/Idea/Project card
Like
Reply
Quote/Share
Save optional
```

It should feel more social than canonical pages.

---

# 39. Discussion Reference Card

Reference card must remain compact.

Do not embed entire Idea.

Show:

```text
type
title
one-line description
creator
small metadata
```

Click → canonical object.

---

# 40. Replies

Replies live under Discussion.

Allow threads, but UI should avoid extreme visual nesting.

Recommended:

```text
maximum visual nesting: 2–3 levels
```

Further replies can flatten with context.

---

# 41. Canonical Page Discussion Section

Problem/Idea page can show:

```text
Discussions about this
```

Example tabs:

```text
Top
Recent
```

Display preview:

```text
@user
"I think the regulation assumption is wrong..."

37 replies
84 likes
```

Click opens Discussion.

---

# 42. Idea Discovery

Idea feed/card should expose:

```text
Title
One-line
Primary Problem
Creator
category
signals
```

Possible signals:

```text
12 saves
5 discussions
2 builds
```

Do not overuse vanity metrics.

---

# 43. Problem Discovery

Problem cards should emphasize pain, not solution.

Card example:

```text
Problem

Small restaurants waste unsold inventory every day.

Food & Hospitality
Vietnam

14 Ideas
8 Discussions

$5,000 Bounty
```

if funded.

---

# 44. Bounty Page

Bounty is attached to Problem but can have dedicated page.

Structure:

```text
Bounty Title
Problem Reference

FUNDED
Prize
Deadline

Sponsor

What we're looking for
Submission Type
Requirements
Judging Criteria
Prize Distribution
Eligibility
IP Terms

Submissions
FAQ / Clarifications

Submit
```

---

# 45. Bounty Type UX

Clearly show:

```text
IDEA
PROTOTYPE
BUILD
```

with explanation.

Example:

**Idea Bounty**

> Submit a well-researched solution proposal. No working product required.

Avoid forcing builder to discover requirements inside long text.

---

# 46. Bounty Funding UX

Before funding:

```text
Draft
Awaiting funding
```

Company gets step-by-step:

```text
1. Review terms
2. Connect wallet
3. Deposit funds
4. Wait for confirmation
5. Activate bounty
```

---

# 47. Wallet States

Frontend must cover:

```text
Not connected
Connecting
Wrong network/environment
Signing
Transaction submitted
Confirmation pending
Confirmed
Rejected by user
Insufficient balance
RPC error
Transaction failed
```

No generic:

```text
Something went wrong
```

for every wallet error.

Zahlook must specifically validate these states.

---

# 48. Funded Trust Indicator

Once confirmed:

```text
FUNDED ✓
$10,000 locked
```

Advanced action:

```text
View on Solana
```

User should not need blockchain knowledge to trust basic state.

---

# 49. Submission Flow

Submission UX depends on Bounty type.

Use wizard only if necessary.

Example:

```text
1. Choose Idea/Project
2. Submission Details
3. Links / Demo / Repo
4. Review
5. Submit
```

Do not create five steps for an Idea Bounty that needs only text.

---

# 50. Deadline UX

Make deadlines explicit.

Show:

```text
12 days left
Sep 20, 2026 · 23:59
```

Near deadline:

```text
Closing soon
```

After deadline:

disable submission cleanly.

Avoid ambiguous timezone behavior.

---

# 51. Submission Locked State

After final submission/deadline:

```text
Submitted ✓
```

Show timestamp.

If editing no longer allowed, explain why.

---

# 52. Judge Dashboard

Organization judges need functional dashboard, not fancy animations.

Prioritize:

```text
Submission list
Filters
Shortlist
Criteria scores
Internal notes
Demo/GitHub links
Compare
Winner selection
```

This area should be dense and efficient.

---

# 53. Winner Experience

After results:

Bounty page clearly shows:

```text
1st
Project A

2nd
Project B

3rd
Project C
```

If payout confirmed:

```text
Paid ✓
```

Do not conflate:

```text
Winner
```

with:

```text
Successful Project
```

---

# 54. Project Page

Project page answers:

> What is actually being built?

Structure:

```text
Project Name
One-line
Status

Built from Idea
Primary Problem

Team

GitHub
Demo
Website

Progress
Milestones
Updates

External Submissions
Bounty Results

Outcome
Discussions
```

---

# 55. Project Status Visual

Use:

```text
Planning
Building
Testing
Live
Paused
Archived
Shutdown
```

Avoid excessive traffic-light semantics.

`Paused` is not necessarily failure.

---

# 56. Project Timeline

Project page may benefit from chronological timeline:

```text
Idea created
↓
Project started
↓
Prototype
↓
Submitted to Hackathon
↓
Won Grant
↓
Launch
↓
100 users
↓
Paused
```

This becomes valuable historical data.

---

# 57. External Submission UI

Example:

```text
Colosseum Eternal
Submission

Result:
Finalist

Prize:
$5,000
```

Clearly mark external source.

Do not imply Gimme Idea judged it.

---

# 58. Create Problem Flow

Should feel lightweight first.

Step 1:

```text
Title
One-line description
Problem
Who has this problem?
Why does it matter?
```

Then optional:

```text
Add details
```

Don't immediately show 20 research fields.

---

# 59. Create Idea Flow

User starts with:

```text
Choose Problem
```

then:

```text
Title
One-line
Opportunity
Solution
```

Then:

```text
Add what you already know
```

Optional sections:

- market;
- technical;
- competitors;
- business;
- previous attempts.

Explain:

> Gimme AI can research the parts you leave blank.

---

# 60. AI Research UX

After submit:

Do not show fake typing animation for 40 seconds.

Use meaningful state:

```text
Saved ✓

Research queued
↓
Researching
↓
Checking sources
↓
Verifying
```

User can leave page.

---

# 61. AI Research Completion

When ready:

Notification:

```text
Research for your Idea is ready.
```

Page may show:

```text
8 fields researched
14 claims verified
6 sources
2 areas need more evidence
```

---

# 62. Research Failure UX

Do not imply Idea failed.

Show:

```text
We couldn't complete the research right now.

Your Idea is safe.
You can retry later.
```

If publish allowed:

```text
Published with limited research
```

---

# 63. Search

Search should be central.

Global search:

```text
Problems
Ideas
Projects
People
Organizations
```

Search placeholder might be:

> Search problems, ideas, builders...

Search result type must be visually obvious.

---

# 64. Similar Entity Suggestion

During create:

```text
We found similar Problems
```

Show suggestions.

Actions:

```text
Use this Problem
View
Create anyway
```

Never:

```text
Duplicate detected. Creation blocked.
```

based only on AI similarity.

---

# 65. Collections

Saving opens simple collection picker.

Example:

```text
Saved
Build Later
AI Problems
Vietnam
```

Allow:

```text
+ New Collection
```

Should feel lightweight.

---

# 66. User Profile

Profile should represent contributions.

Possible sections:

```text
Problems
Ideas
Projects
Discussions
Bounty Results
Saved public collections
```

Future reputation can build here.

Do not create fake numerical reputation score V1.

---

# 67. Builder Proof of Skill

If user wins/completes bounty:

Profile may show:

```text
Bounty Winner
Prototype Shipped
Project Live
```

This is stronger than generic badges.

---

# 68. Organization Profile

Organization profile:

```text
About

Problems
Funded Problems
Bounties
Projects
Open opportunities
```

Potential hiring CTA later.

---

# 69. Company Dashboard

Separate from public Organization profile.

Private dashboard:

```text
My Problems
Bounties
Funding
Submissions
Judging
Payouts
Team Permissions
```

No social-style layout needed.

---

# 70. Notifications

Notification center should prioritize meaningful domain events:

```text
New Idea on followed Problem
New Discussion
Bounty added
Bounty funded
Submission shortlisted
Winner announced
Payout confirmed
Project update
```

Avoid noisy notification spam from every Like by default.

---

# 71. Empty States

Every empty state must suggest next action.

Examples:

Problem has no Ideas:

```text
No one has proposed a solution yet.

[Propose the first Idea]
```

Idea has no Project:

```text
Nobody is building this yet.

[Build this Idea]
```

Problem has no bounty:

Do NOT say:

```text
No bounty :(
```

It is normal.

Could say:

```text
No funded bounty attached.
```

only where relevant.

---

# 72. Loading States

Use skeletons for:

```text
feeds
cards
canonical pages
profiles
```

Do not use full-page spinner unless necessary.

---

# 73. Error States

Errors must preserve user work.

Create form API failure:

```text
Your draft has been kept.
Retry
```

Wallet failure:

specific error.

AI failure:

creator thesis preserved.

---

# 74. Optimistic UI

Suitable:

```text
Like
Save
Follow
```

with rollback on error.

Avoid optimistic confirmation for:

```text
Bounty funded
Payout completed
Winner settlement
```

Money states require confirmed backend/on-chain result.

---

# 75. Color and Status Semantics

Do not make entire product dependent on red/green.

Reserve strong semantic colors for:

```text
errors
warnings
funded verification
critical status
```

Research uncertainty should be nuanced.

---

# 76. Typography

Typography should support:

- strong editorial headings;
- readable research paragraphs;
- compact metadata;
- code/technical data.

Avoid futuristic display font for body text.

One expressive display style + highly readable body font is preferred.

---

# 77. Card Design

Cards should feel like structured information, not generic rounded rectangles everywhere.

Use variation:

- borders;
- dividers;
- spatial layering;
- typography hierarchy;
- subtle surface differences.

Avoid:

```text
every section = white card with 16px radius + shadow
```

---

# 78. Motion System

Motion should communicate:

- relationship;
- transition;
- discovery;
- expansion;
- connection.

Not just decoration.

Examples:

Problem → Idea relation:

small connecting motion.

Expand research:

progressive reveal.

Discuss:

reference card moves into composer.

Three.js landing:

cinematic.

---

# 79. Motion Restraint in App

Core application pages should not use constant 3D/parallax effects.

Researching and judging require focus.

Use cinematic effects heavily on:

```text
Landing
Onboarding
Key discovery moments
```

Use restrained micro-interaction on:

```text
Problem
Idea
Dashboard
Submission review
```

---

# 80. Responsive Strategy

Design mobile intentionally.

Do not:

```text
desktop layout
↓
shrink everything
```

Mobile should prioritize:

```text
content
primary action
navigation
research readability
discussion
```

Sidebar research navigation may become sticky dropdown/section selector.

---

# 81. Mobile Navigation

Potential:

```text
Home
Explore
Discuss
Saved
Profile
```

Create can be floating/central action depending Zahlook recommendation.

Bounties accessible through Explore.

---

# 82. Desktop Canonical Page Layout

Possible architecture:

```text
┌──────────────────────────────────┐
│ Header                           │
├──────────────────────┬───────────┤
│ Main Content         │ Context   │
│                      │ Actions   │
│ Overview             │ Metadata  │
│ Research             │ Bounty    │
│ Previous Attempts    │ Creator   │
│ Discussions          │           │
└──────────────────────┴───────────┘
```

Not mandatory.

Zahlook should determine best implementation.

---

# 83. Sticky Context

Long Idea/Problem pages may use sticky context:

```text
Save
Discuss
Build
Source
Research status
```

Do not make sticky panel huge.

---

# 84. Accessibility

Minimum:

```text
semantic HTML
keyboard navigation
visible focus
contrast
ARIA where required
accessible dialogs
reduced motion
screen-reader labels
```

3D content must not contain critical information inaccessible outside WebGL.

All core meaning must exist in DOM/text.

---

# 85. Localization

Architecture should be localization-ready.

Initial product may support:

```text
English
Vietnamese
```

Do not hardcode UI strings throughout components.

Three.js text should ideally remain DOM overlays rather than baked into 3D textures.

---

# 86. Wallet UX for Low-Tech Users

Never require wallet just to:

```text
browse
post Problem
post Idea
discuss
save
build Project
```

Wallet prompt appears when financial action requires it.

Example:

```text
Fund Bounty
Receive Payout
```

Explain wallet action in normal language.

---

# 87. Web3 Terminology

Normal UX:

```text
Funds locked in escrow
View transaction
Connect payout wallet
```

Advanced technical info can expose:

```text
PDA
mint
signature
program
```

under developer details.

---

# 88. Trust UX

Important trust surfaces:

### Creator attribution

Who wrote original thesis?

### AI provenance

Which content was researched?

### Sources

Where did information come from?

### Research freshness

When was it checked?

### Bounty funding

Is money actually locked?

### Submission Result

Who selected winner?

Avoid vague “Verified” badges without explaining what was verified.

---

# 89. Moderation UX

User-generated content must support:

```text
Report
Block user
Hide discussion
```

where appropriate.

Canonical entity moderation should not silently erase references.

If removed:

show appropriate:

```text
Content unavailable
```

state.

---

# 90. Ranking UX

Do not expose one mysterious:

```text
Score 92
```

for Ideas.

Possible filters:

```text
Trending
New
Most Discussed
Most Built
Recently Researched
Funded
```

Ranking algorithm can evolve.

---

# 91. Homepage Cold Start

When personalized data is sparse:

show curated:

```text
Problems worth solving
Ideas gaining discussion
Active builds
Funded opportunities
```

Do not show an empty personalized feed.

---

# 92. Seed Content Treatment

Imported/curated content must display provenance.

Example:

```text
Imported from Colosseum
```

or:

```text
Curated by Gimme Idea
```

Do not impersonate original creators.

---

# 93. Imported Project Claim

Imported project page may show:

```text
Is this your project?
Claim it
```

Owner status visible subtly.

---

# 94. Performance Goals

Frontend should target strong Core Web Vitals.

Particularly:

```text
LCP
INP
CLS
```

Three.js landing must not compromise core app performance.

Route bundles should be analyzed.

---

# 95. Code Splitting

Three.js and landing-specific heavy libraries must be dynamically loaded.

Core domain routes should not import them.

Similarly:

company judging/dashboard libraries should not inflate public Idea page bundle unnecessarily.

---

# 96. Image / Media Loading

Use:

- optimized image pipeline;
- responsive sizes;
- lazy loading below fold;
- placeholders where appropriate.

Avoid autoplay video backgrounds in addition to Three.js.

---

# 97. Analytics Events

Frontend should support meaningful product analytics.

Examples:

```text
problem_viewed
idea_viewed
idea_saved
problem_followed

discuss_clicked
discussion_created

propose_idea_clicked
idea_created

build_clicked
project_created

bounty_viewed
bounty_fund_started
bounty_funded

submission_started
submission_completed
```

Avoid tracking everything without product purpose.

---

# 98. Critical Conversion Funnels

Track:

### Problem → Idea

```text
Problem View
→ Propose Idea
→ Idea Submitted
```

### Idea → Build

```text
Idea View
→ Build This Idea
→ Project Created
```

### Bounty

```text
Bounty View
→ Submission Start
→ Submission Complete
```

### Company

```text
Problem Created
→ Add Bounty
→ Funding Started
→ Funded
```

---

# 99. Initial Route Map

Recommended V1:

```text
/

 /explore
 /problems
 /problems/[slug]

 /ideas
 /ideas/[slug]

 /projects
 /projects/[slug]

 /discuss
 /discuss/[id]

 /bounties
 /bounties/[slug]

 /collections
 /collections/[id]

 /u/[username]
 /org/[slug]

 /create/problem
 /create/idea

 /projects/[slug]/submit/[bounty]

 /dashboard
 /dashboard/organization
 /dashboard/bounties/[id]

 /settings
```

Exact routing can change if architecture requires.

---

# 100. Required Frontend State Matrix

Before implementation, AI must define state matrix for every main page.

Example Idea page:

```text
Loading
Published
Researching
Limited Research
Needs Review
Archived
Deleted
Not Found
Owner View
Viewer View
Logged Out
```

Bounty:

```text
Draft
Awaiting Funding
Funding Pending
Open
Closed
Judging
Completed
Cancelled
Refunded
```

No page should only have “happy path”.

---

# 101. Frontend Component Families

Likely reusable families:

```text
ProblemCard
IdeaCard
ProjectCard
BountyCard

CanonicalHeader

ProvenanceBadge
ResearchStatus
SourceList
PreviousAttemptCard

DiscussionPost
DiscussionComposer
ReferenceCard

ProfileChip
OrganizationChip

BountyPrizeTable
FundingStatus
SubmissionCard

CollectionPicker
```

Do not build components purely because names exist here.

Use composition and Zahlook guidance.

---

# 102. Design System Tokens

Frontend must centralize:

```text
spacing
radius
typography
surface
border
shadow
motion duration
easing
z-index
breakpoints
```

Do not scatter magic numbers.

Three.js scene may have separate spatial constants but should still follow design direction.

---

# 103. Frontend Anti-Patterns

Do NOT:

```text
create generic SaaS dashboard first

put comments directly under every Idea

make Problem and Idea visually identical

use AI to rewrite Overview automatically

hide AI provenance

make every Problem require a bounty

require wallet at signup

show fake blockchain confirmation

use giant Three.js bundles on all routes

make all content a card grid

use random gradients everywhere

use crypto visual clichés

show every research field even when empty

turn Discuss into generic unrelated posting
```

---

# 104. Required Landing Prototype Before Full Build

Before implementing the entire frontend, AI should create a focused landing prototype for:

```text
3D Brain
scroll behavior
idea fragments
camera behavior
mobile fallback
performance
```

Validate this independently.

Do not build 30 product screens and only later discover Three.js direction doesn't work.

---

# 105. Required Canonical Page Prototype

Before mass-producing pages, prototype:

```text
1 Problem Page
1 Idea Page
1 Discussion Thread
1 Funded Bounty Page
```

using realistic data.

These four pages establish most of the design system.

Only after review should AI expand patterns across remaining routes.

---

# 106. Dummy Content Quality

Mock data must resemble real Gimme Idea content.

Do not use:

```text
Lorem ipsum
Project Alpha
John Doe
```

Use realistic:

```text
Problem:
Independent restaurants struggle to forecast daily food demand.

Idea:
Shared demand forecasting network for local restaurants.

Previous Attempt:
Project X — shutdown after two years due to distribution cost.

Bounty:
$10,000 prototype challenge.
```

This is necessary because content density affects design.

---

# 107. Implementation Sequence

Frontend implementation should follow:

```text
1. Read all product docs
2. Use Zahlook skill
3. Define visual system
4. Prototype landing Three.js scene
5. Prototype Problem page
6. Prototype Idea page
7. Prototype Discussion
8. Prototype Funded Bounty
9. Review design system
10. Build shared components
11. Build remaining routes
12. Connect API
13. Complete responsive states
14. Complete error/loading/empty states
15. Performance audit
```

Do not start from dashboard.

---

# 108. Product UI Invariants

### Invariant 1

Problem is visually treated as a problem, not a proposed solution.

### Invariant 2

Idea visibly references Primary Problem.

### Invariant 3

Discussion is separate from canonical content.

### Invariant 4

Overview preserves creator meaning.

### Invariant 5

AI research provenance remains visible.

### Invariant 6

Previous Attempt failure is contextual, not a verdict on current Idea.

### Invariant 7

Funded bounty requires confirmed escrow.

### Invariant 8

Wallet is optional until financial interaction requires it.

### Invariant 9

Project Outcome is separate from Submission Result.

### Invariant 10

Three.js does not compromise core usability/performance.

### Invariant 11

Frontend implementation must use Zahlook skill.

### Invariant 12

Mobile is a first-class experience, not desktop scaled down.

---

# 109. Core Visual Story

The entire product should reinforce one simple mental model:

```text
A Problem exists.

Someone sees an Opportunity.

Someone proposes an Idea.

People Discuss it.

A Builder turns it into a Project.

A Company may Fund the Problem.

Projects compete, evolve, succeed, fail, pivot,
and their history becomes knowledge for the next builder.
```

Gimme Idea should visually feel like that knowledge and activity is continuously accumulating.

Not a static Idea Bank.

A living Problem Network.