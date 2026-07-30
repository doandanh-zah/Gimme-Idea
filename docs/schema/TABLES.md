# Greenfield table catalog

Source: `supabase/migrations/0001_init.sql`  
Updated: 2026-07-29

## Domains

| Domain | Tables |
|--------|--------|
| Core | `users`, `projects`, `comments`, `project_votes`, `comment_likes`, `transactions` |
| Social | `follows`, `notifications`, `user_announcements`, `feeds`, `feed_items`, `feed_followers` |
| Auth / automation | `agent_keys`, `api_tokens`, `audit_logs` |
| AI / usage | `user_ai_credits`, `ai_market_assessments`, `ai_interactions`, `ai_question_pack_purchases`, `user_daily_usage`, `idea_search_quota`, `related_projects`, `user_pinned_projects` |
| Payments / gov | `pool_supports`, `billing_payments`, `proposals`, `dao_requests` |
| Admin | `system_settings`, `admin_activity_log` |
| Hackathons | `hackathons`, `hackathon_rounds`, `hackathon_prizes`, `hackathon_schedule`, `hackathon_partners`, `hackathon_teams`, `hackathon_team_members`, `hackathon_team_invites`, `hackathon_registrations`, `hackathon_submissions`, `hackathon_submission_votes` |

**Not in greenfield:** `hackathon_ideas`, `hackathon_feedback`, `hackathon_round_results`, `hackathon_participants`, `feed_members`.

## Egress notes

- Public list endpoints must project columns (see projects list + hackathons list).
- Realtime defaults off; see ADR 0002.
- Prefer `select('id', { count, head })` for counts — never `select('*')` with `head: true` only as habit.
