# Gimme Idea V1 — ERD and invariant review

```mermaid
erDiagram
  USERS ||--o{ USER_WALLETS : verifies
  USERS ||--o{ ORGANIZATION_MEMBERS : joins
  ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERS : contains
  USERS ||--o{ PROBLEMS : creates
  PROBLEMS ||--o{ IDEA_PROBLEM_LINKS : anchors
  IDEAS ||--|{ IDEA_PROBLEM_LINKS : addresses
  IDEAS ||--o{ PREVIOUS_ATTEMPTS : researches
  IDEAS ||--o{ PROJECTS : becomes
  PROJECTS ||--o{ PROJECT_MEMBERS : has
  PROBLEMS ||--o{ BOUNTIES : activates
  BOUNTIES ||--o{ SUBMISSIONS : receives
  IDEAS ||--o{ SUBMISSIONS : proposes
  PROJECTS ||--o{ SUBMISSIONS : submits
  SUBMISSIONS ||--o| SUBMISSION_RESULTS : receives
  BOUNTIES ||--o| BOUNTY_ESCROWS : mirrors
  BOUNTIES ||--o{ BOUNTY_WINNERS : awards
  BOUNTY_WINNERS ||--o| PAYOUT_INTENTS : pays
  USERS ||--o{ DISCUSSIONS : starts
  DISCUSSIONS ||--o{ DISCUSSION_REPLIES : contains
  RESEARCH_RUNS ||--o{ RESEARCH_CLAIMS : produces
  RESEARCH_CLAIMS ||--o{ RESEARCH_SOURCES : cites
  RESEARCH_CLAIMS ||--o{ VERIFICATION_RESULTS : verifies
```

## Invariant review

- Problem and Idea are separate; `idea_problem_links` enforces at most one primary link and publish logic enforces exactly one.
- Project references one originating Idea in V1.
- Submission and Project remain separate; Submission Result never writes Project Outcome.
- Bounty is optional and always references a Problem.
- Bounty escrow and payout confirmation are separate records; Solana will remain authoritative when enabled.
- Previous Attempt is queryable relational data but remains subordinate to Idea in product semantics.
- Discussion references canonical content without modifying it.
- Research claims, sources, verification and field provenance are versioned separately from creator thesis.
- Imported entities preserve source and duplicate candidates require controlled review.
