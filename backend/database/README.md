# Legacy SQL (do not use for new environments)

These files are an unordered historical trail of Supabase editor migrations.

**Greenfield SSOT:** [`../../supabase/migrations/0001_init.sql`](../../supabase/migrations/0001_init.sql)

| Do | Don't |
|----|--------|
| Read for column archaeology during ETL | Apply in arbitrary order on a new project |
| Keep until production cutover is complete | Add new `migration_*.sql` here |

New schema changes: add numbered files under `supabase/migrations/`.
