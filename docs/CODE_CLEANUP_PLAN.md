# Code cleanup plan

Active cleanup tracks:

1. **Repo hygiene** — no junk files, hardened `.gitignore`, `scripts/check-no-junk.sh`
2. **Schema greenfield** — `supabase/migrations/` SSOT; see `docs/schema/inventory-pre-greenfield.md`
3. **Mapping** — single types path (`frontend/lib/types.ts`), single QueryProvider (`providers/`)
4. **Egress** — realtime opt-in; see `docs/PERF_EGRESS_SECURITY_TODO.md` and ADR 0002

Hackathon page split / mock removal remains follow-up work inside the frontend app, not a separate schema track.
