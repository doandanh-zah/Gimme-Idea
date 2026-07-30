# Supabase / Postgres

**Source of truth for schema:** `migrations/`

## Apply greenfield (empty project)

1. Create a new Supabase project (or reset a staging database).
2. In SQL Editor (or `supabase db push` if CLI is configured), run migrations in order:

```bash
# Manual
psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql
```

3. Point backend env:

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
DATABASE_URL=   # optional, for direct SQL tools
```

4. Point frontend:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ENABLE_REALTIME=false
```

## Legacy SQL

`backend/database/*.sql` is **historical only**. Do not apply those files on a greenfield DB — they are unordered, duplicated, and superseded by `0001_init.sql`.

## Explicitly not recreated

| Dropped twin / dead model | Reason |
|---------------------------|--------|
| `hackathon_ideas` | Use `hackathon_submissions` + `projects` |
| `hackathon_feedback` | Use comments / engagement on teams |
| `hackathon_round_results` | Scores live on submissions/teams |
| `hackathon_participants` | Use `hackathon_registrations` |
| `feed_members` | Feeds v2: followers only |

## Existing production

Apply **safe** align (no data wipe):

```bash
psql "$DATABASE_URL" -f supabase/migrations/0002_prod_align_safe.sql
```

See `docs/schema/MAPPING_AUDIT.md` for code ↔ prod ↔ greenfield matrix.

## Data migration

Export the old project, then ETL domain-by-domain (users → projects → comments → …). Keep the old project read-only during cutover.
