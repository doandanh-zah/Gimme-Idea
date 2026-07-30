# Gimme Idea

Solana-native idea and builder collaboration platform.

Publish ideas, get AI + community feedback, discover high-signal opportunities, and run creator workflows with wallet, Google, or agent automation.

## Product

- **Ideas + Projects** — create, discover, vote, discuss
- **AI (Gimme Sensei)** — feedback, market assessment, assisted replies
- **Social** — comments, follows, feeds, notifications
- **Payments** — Solana support/tipping and related flows
- **Hackathons** — teams, submissions, scoring
- **Automation** — PAT, agent secret-key auth, MCP notes under `mcp/gimme-idea/`

## Monorepo layout

```text
frontend/     Next.js (App Router)
backend/      NestJS API + Supabase client
supabase/     Greenfield SQL migrations (schema SSOT)
programs/     Solana / Anchor workspace
mobile-apk/   Optional Capacitor shell
docs/         Shareable documentation
mcp/          Agent skill notes
scripts/      Repo hygiene checks
```

## Quick start

**Prerequisites:** Node.js 20+, npm, Supabase project, OpenAI key (AI routes).

```bash
# Backend
cd backend && npm install && npm run start:dev
# → http://localhost:3001

# Frontend
cd frontend && npm install && npm run dev
# → http://localhost:3000
```

Copy [`.env.example`](.env.example) into `backend/.env` and `frontend/.env.local`.

### Database (greenfield)

Schema source of truth:

```bash
psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql
```

See [`supabase/README.md`](supabase/README.md). Legacy unordered SQL under `backend/database/` is historical only.

## Egress defaults

Realtime is **off** unless you set `NEXT_PUBLIC_ENABLE_REALTIME=true` and the per-channel flags. See `docs/adr/0002-realtime-channel-matrix.md`.

## Docs

| Doc | Purpose |
|-----|---------|
| [`docs/README.md`](docs/README.md) | Architecture overview |
| [`docs/FEATURE_STATUS.md`](docs/FEATURE_STATUS.md) | What is verified vs needs proof |
| [`docs/schema/inventory-pre-greenfield.md`](docs/schema/inventory-pre-greenfield.md) | Schema inventory |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Hygiene and PR rules |

## License

Internal project repository. Add license terms when publishing publicly.
