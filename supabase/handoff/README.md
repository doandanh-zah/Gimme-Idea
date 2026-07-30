# Handoff: clean reset (2 files)

## Order

```bash
# 1) Wipe + create empty clean schema
psql "$DATABASE_URL" -f supabase/handoff/01_wipe_and_schema.sql

# 2) Load cleaned data (same UUIDs as before cleanup)
psql "$DATABASE_URL" -f supabase/handoff/02_data_clean.sql
```

## What you get

| File | Role |
|------|------|
| `01_wipe_and_schema.sql` | `DROP SCHEMA public` + greenfield tables (`0001_init`) |
| `02_data_clean.sql` | Data-only: ideas/comments/users… **without** notification spam |

## After import

1. Point backend/frontend env at this DB (if new project).
2. Keep realtime/notifications flags **off**.
3. Login once, then promote admin if needed:

```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';
```

4. Smoke: list ideas, open detail, comment.

## Do not

- Run old `backend/database/migration_*.sql` after this.
- Commit `02_data_clean.sql` to a **public** repo if it has PII (emails, wallets). Prefer private storage.
