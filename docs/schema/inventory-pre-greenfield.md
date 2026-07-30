# Pre-greenfield inventory

Date: 2026-07-29  
Scope: cleanup Phase 0 snapshot before greenfield cutover.

## Tables referenced by backend code

| Table | Notes |
|-------|--------|
| users | identity, plan, stats counters |
| projects | ideas + projects |
| comments | + AI flags |
| project_votes | |
| comment_likes | |
| transactions | on-chain ledger |
| follows | |
| notifications | |
| user_announcements | |
| feeds / feed_items / feed_followers | no feed_members in code |
| agent_keys / api_tokens / audit_logs | |
| user_ai_credits | |
| ai_market_assessments | |
| ai_question_pack_purchases | |
| user_daily_usage | |
| idea_search_quota | RPC/SQL; keep for compat |
| related_projects / user_pinned_projects | |
| pool_supports / billing_payments | |
| proposals / dao_requests | |
| system_settings / admin_activity_log | |
| hackathons, rounds, prizes, schedule, partners | |
| hackathon_teams / members / invites | |
| hackathon_registrations | **canonical participants** |
| hackathon_submissions / submission_votes | |

## Code drift fixed

- `hackathon_participants` → `hackathon_registrations` in `hackathons.service.ts`

## Not recreated in greenfield

- `hackathon_ideas`, `hackathon_feedback`, `hackathon_round_results`
- Finder duplicates / unordered `backend/database/migration_*.sql` as runtime SSOT

## Workspace junk removed (Phase 1)

- `* 2*` Finder copies, `globals.css.bak`, `startup.err/out`, `backend/dist`
- Legacy SPA: `frontend/App.tsx`, `index.tsx`, `index.html`, dual `types.ts`
- Dual `components/QueryProvider.tsx` (kept `providers/QueryProvider.tsx`)
- Broken Windows symlink `dev-docs` → real `dev-docs/archive/` for agent docs

## SSOT going forward

`supabase/migrations/0001_init.sql`
