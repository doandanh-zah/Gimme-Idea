# Contributing

## Repo hygiene

- Do not commit Finder duplicates (`* 2*`), `*.bak`, `dist/`, `target/`, or runtime logs.
- Run `bash scripts/check-no-junk.sh` before opening a PR.
- Schema changes go in `supabase/migrations/` (ordered). Do not add new files under `backend/database/`.
- Private notes and agent ops live under `dev-docs/` (gitignored). Do not put heartbeat spam at repo root.

## Local development

See root `README.md` and `docs/README.md`.

## Frontend guards

```bash
cd frontend
npm run guard:imports
npm run guard:bundle
npm run security:markdown
```

## Pull requests

- Prefer stacked PRs: hygiene → schema → mapping → egress.
- No secrets in commits. Use `.env.example` placeholders only.
