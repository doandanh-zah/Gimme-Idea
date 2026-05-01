# Gimme Idea Documentation

Gimme Idea is a Solana-focused idea and builder collaboration platform. The app lets people publish ideas, collect feedback, discuss projects, use AI-assisted workflows, curate feeds, and run hackathon or funding-related flows.

This folder is for shareable project documentation. Private notes, investigation logs, and deployment scratch work belong in `dev-docs/`.

## Current Architecture

```text
frontend/   Next.js 14 app, React, Tailwind, Zustand
backend/    NestJS API, Supabase/Postgres integration, JWT/PAT auth
programs/   Solana/Anchor program workspace
mcp/        Agent-facing usage notes
docs/       Public project documentation
dev-docs/   Private developer notes
```

## Core Areas

- Ideas and projects: list/detail views, submission, editing, voting, comments, profile-owned content.
- AI workflows: feedback, replies, market assessment, related-project discovery, usage/quota checks.
- Social features: follows, feeds, comments, notifications, profile pages.
- Auth: wallet login, email login, agent secret-key login, Personal Access Tokens.
- Payments and on-chain flows: transaction verification, support flows, proposals, idea pools.
- Hackathons: hackathon, team, invite, registration, submission, and admin flows.
- Admin: content moderation, review flows, DAO/pool/proposal operations, activity views.

## Local Development

Backend:

```bash
cd backend
npm install
npm run start:dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Default URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001/api`

## Environment Notes

Common frontend variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SOLANA_RPC_URL=
NEXT_PUBLIC_ENABLE_REALTIME=false
```

Common backend variables:

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
JWT_SECRET=
OPENAI_API_KEY=
SOLANA_RPC_URL=
```

Realtime is opt-in from the frontend with `NEXT_PUBLIC_ENABLE_REALTIME=true`. Keep it disabled unless a deployment explicitly needs live subscriptions, because Supabase realtime can contribute noticeable egress.

## API Surface

The backend is organized around these route groups:

- `auth/*`
- `v1/tokens/*`
- `users/*`
- `projects/*`
- `comments/*`
- `feeds/*`
- `notifications/*`
- `ai/*`
- `payments/*`
- `hackathons/*`
- `admin/*`
- `settings/*`

Use controller files in `backend/src/**` as the source of truth for exact request and response shapes.

## Documentation Policy

- Keep user-facing or shareable technical docs here.
- Keep secrets, egress investigations, deployment scratch notes, and private planning in `dev-docs/`.
- Prefer describing current behavior over projected roadmap claims.
- When a feature status is uncertain, mark it as "needs verification" instead of guessing.
