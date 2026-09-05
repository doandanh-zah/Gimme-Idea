# Gimme Idea — Frontend V1 Convergence Report

Audit/implementation date: 2026-09-04 (Asia/Ho_Chi_Minh)  
Scope: frontend only (`apps/web`, frontend E2E, visual evidence). No API, worker, database, Supabase, Anchor program, PDA, or escrow state was changed.

## 1. Zahlook usage summary

The convergence follows Zahlook's editorial-builder language: sharp geometry, strong information hierarchy, near-black surfaces, restrained yellow/purple semantics, visible provenance, compact metadata, and purposeful motion. The final visual set was inspected at desktop and mobile widths. Cards, gates, forms, competition states, and dashboards avoid generic gradients, oversized rounded containers, and decorative motion.

## 2. Routes added/removed/demoted

Added first-class routes for Projects, Project detail/modes, private Project snapshot submission, Bounty discovery/detail/private Idea submission, public Search, Organization profile, Company Dashboard/problem/bounty/submission review, create intents, minimal admin review, and separate `/devnet-bounty` diagnostics. `/talent`, `/community`, and `/following` remain as compatibility redirects but are removed from primary navigation. No destructive route deletion was required.

## 3. Navigation changes

Primary navigation is now Home, Problems, Ideas, Projects, Bounties, then Saved, Notifications, and Profile. Desktop uses the existing 20/55/25 shell; compact tablet moves Projects/Bounties/Saved into More; mobile uses Home, Problems, Create, Bounties, Profile with the remaining destinations in Menu. Create only offers Problem and public Idea.

## 4. Home changes

Home is now an opportunity-first mixed feed. It ranks Idea Bounties, Build Bounties, Problems, historical/public Projects, Project updates, and local contextual quote activity. An intent strip lets users choose “Earn with an Idea”, “Build for a Bounty”, “Explore Problems”, or “See What Was Tried”.

## 5. Problem UX

Problem remains the public root object. Detail pages now expose public actions, evidence/provenance, related public Ideas, historical attempts, and an honest Bounty state. A Problem can exist without a Bounty; local bounty amounts are displayed only as draft intent and never as funded money.

## 6. Historical Project UX

Imported historical builds are first-class Projects with explicit source, year, result, original description, team/source facts, and a separately labeled Gimme Idea research interpretation. AI/research confidence and human-review state are visible; inferred outcome is not presented as source fact.

## 7. Idea visibility/privacy

The frontend domain boundary implements `public`, `restricted_summary`, `restricted_full`, `private_owner`, and `private_judge`. Public Ideas can be saved, followed, discussed, and shared. Selected/restricted Ideas use noindex metadata and a restricted gate. Private submissions never enter Home, Search, quote targets, or public preview UI.

## 8. Idea Bounty flow

The public flow is Problem → Idea Bounty → private Idea submission. Detail pages show organization, prize intent, deadline, private entry count, requirements, constraints, criteria, IP/privacy terms, and explicit funding verification state. Submission is auth-gated, locally persisted for development, labeled private/not server-synced, and does not create a public Idea.

## 9. Build Bounty flow

Build Bounty pages expose the public Problem and competition terms while withholding the selected Idea and implementation brief. A signed-in builder must accept confidentiality terms before the restricted selected direction, deliverables, and constraints render. The builder can then create/open a private Project workspace.

## 10. Project UX

Project is now first-class with four modes: imported historical, public community build, private builder workspace, and restricted winner. Private Project and Bounty Submission are separate objects: the working Project can continue changing while the submitted snapshot is labeled and locked locally for review.

## 11. Quote/Home discussion behavior

Quote remains a discussion mechanism, not a domain object replacement. Public Problems, Ideas, Projects, and Bounties can open contextual discussion. Restricted/private objects never expose Discuss/Quote actions. Existing nested discussion behavior and device-local persistence remain intact.

## 12. Organization/company UX

Public Organization profile is separate from the private Company Dashboard. The dashboard shows the lifecycle from Problem through Idea Bounty, Build Bounty, and Outcome. Management views include overview, terms, funding, private submissions, judging, result preview, clarification, shortlist, winner preview, and disabled interview/contract Phase 3 actions. Company routes use a development reviewer gate so confidential rows do not render for public viewers.

## 13. Reward wallet UX

The personal wallet is reframed as Rewards / Gimme Wallet. It explains automatic provisioning, Devnet balance provenance, assets, activity, and a withdrawal review flow. Withdrawal confirmation remains disabled and clearly states that no transaction can be signed or submitted in this frontend phase.

## 14. Funding-wallet UX

Organization Funding Wallet is a separate company surface. It shows prize, fee availability, total funding requirement, disconnected/development status, and a disabled funding path. It never implies that prize money is secured when an escrow verification is unavailable.

## 15. Design token changes

V1 builds on the central tokens: `#09090b` background, layered near-black panels, warm near-white text, restrained lines, `#FFD700` action/Idea semantics, `#9945FF` Problem/restricted semantics, and `#14F195` verified-success only. `v1.css` centralizes record, gate, dashboard, form, wallet, and responsive rules.

## 16. Typography

Geist remains the UI/title face and Geist Mono handles numbers, labels, provenance, and state. Editorial scale is used for identity and major decisions, while long operational content stays compact and readable. Amounts use tabular numeric treatment.

## 17. Color semantics

Yellow means primary action, active opportunity, or Idea stage. Purple marks Problem/restricted/devnet context. Green is reserved for verified success and verified funding; all fixture funding is marked development/unverified. Danger colors are not used decoratively.

## 18. Motion/animation changes

Anime.js remains scoped to the landing narrative and dispatches the active loop stage. Product surfaces use small hover/focus transitions only. `prefers-reduced-motion` removes V1 transitions and the existing reduced-motion E2E confirms all narrative steps remain readable.

## 19. Three.js landing changes

The existing React Three Fiber network was retained. It now responds to seven narrative stages, shifting node/path emphasis through problem, direction, build, verified outcome, and return-to-memory states. Three.js remains landing-only; canonical product detail pages do not load it.

## 20. Responsive behavior

Verified at 360, 768, and 1280 widths. Mobile uses a fixed bottom action dock, compact headers, single-column records/forms, and horizontally scrollable stage strips. Tablet uses the compact 88px rail and overflow navigation. Desktop retains the 20/55/25 intelligence shell. E2E asserts no horizontal document overflow across Home, Projects, Bounties, and Build Bounty detail.

## 21. Accessibility results

Existing landing axe checks remain clean. A new axe check covers the Bounties surface; the scrollable two-stage lifecycle is keyboard focusable. Gates use explicit headings and notices, forms have labels/required error states, dialogs retain names and close controls, and reduced-motion behavior is covered. Automated checks reported zero violations in the tested surfaces.

## 22. Privacy test results

Playwright creates a private Idea and verifies it cannot be found on Home or Search. A public viewer cannot render the Company bounty-management rows or direct submission review contents. A development reviewer role can review. Build Bounty tests verify the selected Idea is absent before acceptance and visible only after join; private Project access and snapshot submission are exercised separately.

## 23. Playwright results

Final `pnpm test:e2e`: **88 passed, 2 skipped, 0 failed** across `mobile-360`, `tablet-768`, and `desktop-1280`. The two skips are intentional: the screenshot capture scenario executes only in the desktop project because it creates its own 1280 and 360 browser contexts. Static gates also pass: `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.

## 24. Screenshots

Visual evidence is stored in `docs/frontend-v1-screenshots/`:

1. `01-landing-1280.png`
2. `02-home-mixed-feed-1280.png`
3. `03-problem-without-bounty-1280.png`
4. `04-problem-with-idea-bounty-1280.png`
5. `05-historical-project-1280.png`
6. `06-public-idea-1280.png`
7. `07-idea-bounty-1280.png`
8. `08-private-idea-submission-1280.png`
9. `09-restricted-winning-idea-1280.png`
10. `10-build-bounty-teaser-1280.png`
11. `11-build-bounty-unlocked-1280.png`
12. `12-private-project-workspace-1280.png`
13. `13-company-judging-1280.png`
14. `14-winner-state-1280.png`
15. `15-profile-1280.png`
16. `16-profile-rewards-wallet-1280.png`
17. `17-mobile-home-360.png`
18. `18-mobile-build-bounty-360.png`

## 25. Which features remain dev adapters

Typed domain fixtures currently supply Projects, Organizations, Bounties, private submissions, historical research, and Home ranking. Private entries, join/access state, Project snapshots, reviewer role, follows, saves, quotes, and create publishing remain device-local. Frontend analytics emits typed browser events only. Funding and withdrawal are explicit previews.

## 26. Which features require Smart Contract Phase 2

Separate Idea and Build escrow creation, canonical funding verification, participant/winner resolution, payout/refund/cancel paths, transaction signing, explorer-backed financial state, fee enforcement, and reconciliation of escrow lifecycle require Phase 2. No smart-contract or PDA change was made here.

## 27. Which features require Backend Phase 3

Production authorization/RBAC, server-persisted private submissions and snapshots, organization membership, judge assignment, search indexing with visibility enforcement, notifications, durable Saved/Follow/discussion state, moderation/research queues, AI extraction/review, interview/contract workflow, payout activity indexing, and production analytics require Phase 3.

## 28. Known frontend issues

- Development privacy gates use `localStorage` and are UX contracts, not production security boundaries; server authorization is mandatory before real confidential data is connected.
- Fixture deadlines/counts and imported project records are demonstrative and explicitly provenance-labeled.
- Social/create data still uses device-local storage, so it is not shared across browsers.
- Wallet balance reads depend on Devnet RPC availability; loading/error states are shown without inventing balances.
- Compatibility redirect routes remain in the route manifest until a later deprecation cleanup.
- English/Vietnamese coverage is complete for primary flows, but some operational labels and fixture content intentionally remain English.
