# Greenfield ETL playbook

Manual data move from the **old** Supabase project into a DB that has applied `supabase/migrations/0001_init.sql`.

## Order (respect FKs)

1. `users`
2. `projects`
3. `comments`, `project_votes`, `comment_likes`
4. `follows`, `notifications`, `user_announcements`
5. `feeds`, `feed_items`, `feed_followers`
6. `agent_keys`, `api_tokens`, `audit_logs`
7. AI / billing tables
8. `pool_supports`, `transactions`, `proposals`, `dao_requests`
9. Hackathon tables (`hackathons` → teams → registrations → submissions)

## Mapping notes

| Old | New |
|-----|-----|
| `hackathon_participants` (if existed) | `hackathon_registrations` |
| `hackathon_ideas` | drop or map into `hackathon_submissions` + `projects` |
| `feed_members` | drop (followers-only model) |
| empty `wallet` `''` | `NULL` |

## Steps

```bash
# 1) Dump old (private; do not commit)
pg_dump "$OLD_DATABASE_URL" --data-only --no-owner -f /tmp/gimme-old-data.sql

# 2) Apply greenfield
psql "$NEW_DATABASE_URL" -f supabase/migrations/0001_init.sql

# 3) Load domain CSVs or use Supabase Table Editor import
# Prefer per-table CSV export from old dashboard for controlled columns.

# 4) Smoke
# - auth login, list ideas, open detail, vote, comment
# - hackathon list + register
# - admin status
```

Keep the old project **read-only** for 7–14 days after cutover.
