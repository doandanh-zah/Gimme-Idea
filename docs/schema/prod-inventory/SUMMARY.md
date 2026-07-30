# Production DB inventory

**Project:** pcipyfyannlmvaribhub (Supabase)  
**Captured:** 2026-07-30 (counts) · **Aligned:** 2026-07-30 via `0002_prod_align_safe.sql`  
**Tables after align:** ~41 (dropped 4 empty twins; added `billing_payments`)

> Data dumps live under `.local/supabase-dump/` (gitignored). Do not commit dumps or passwords.

## Non-zero tables

| Table | Rows |
|-------|------|
| `notifications` | 177 |
| `comments` | 138 |
| `project_votes` | 106 |
| `projects` | 85 |
| `related_projects` | 45 |
| `users` | 33 |
| `user_ai_credits` | 33 |
| `audit_logs` | 24 |
| `api_tokens` | 17 |
| `admin_activity_log` | 14 |
| `comment_likes` | 14 |
| `user_daily_usage` | 13 |
| `hackathon_prizes` | 13 |
| `ai_interactions` | 12 |
| `agent_keys` | 8 |
| `idea_search_quota` | 7 |
| `hackathon_announcements` | 7 |
| `user_announcements` | 5 |
| `feed_items` | 3 |
| `pool_supports` | 3 |
| `proposals` | 2 |
| `follows` | 2 |
| `hackathons` | 1 |
| `system_settings` | 1 |
| `feeds` | 1 |
| `hackathon_registrations` | 1 |
| `feed_followers` | 1 |

## Empty tables (skip ETL / candidates to omit)

- `ai_market_assessments`
- `ai_question_pack_purchases`
- `dao_requests`
- `hackathon_feedback`
- `hackathon_ideas`
- `hackathon_participants`
- `hackathon_partners`
- `hackathon_round_results`
- `hackathon_rounds`
- `hackathon_schedule`
- `hackathon_submission_votes`
- `hackathon_submissions`
- `hackathon_team_invites`
- `hackathon_team_members`
- `hackathon_teams`
- `transactions`
- `user_pinned_projects`

## Core confirmed

- users / projects / comments / votes are populated — ETL required for greenfield cutover.

