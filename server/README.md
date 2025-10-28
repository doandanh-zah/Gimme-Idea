# Gimme Idea Backend

Production-ready Next.js 14 API backend powering **gimmeidea.com**. Implements mandatory email authentication, optional Solana wallet connection, AI tooling, tipping, and project collaboration workflows.

## Stack

- Next.js 14 App Router (API routes only)
- TypeScript (strict mode)
- Prisma ORM targeting PostgreSQL (Supabase)
- Supabase Functions for transactional email + realtime broadcasting
- JWT session tokens signed with `JWT_SECRET`
- bcryptjs password hashing
- OpenAI GPT-3.5 for AI chat/reviews
- Upstash Redis rate limiting
- Solana Web3.js for on-chain verification
- Zod validation across all payloads

## Getting Started

1. Duplicate `.env.example` to `.env.local` and fill in the required secrets.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Prepare the database:
   ```bash
   npx prisma migrate dev
   ```
4. Generate the Prisma client:
   ```bash
   npm run prisma:generate
   ```
5. Start the API locally:
   ```bash
   npm run dev
   ```

## Supabase Setup

- **Database**: Point `DATABASE_URL`/`DIRECT_URL` to your Supabase Postgres project.
- **Functions**: Provide two edge functions:
  - `send-email` – responsible for delivering transactional emails. The register endpoint calls this with the rendered verification email payload.
  - `broadcast` – pushes realtime updates (`feedback:new`, `tip:received`, `project:view`) to connected clients.
- **Auth**: Ensure SMTP is configured so verification emails are delivered from `EMAIL_FROM`.

## Business Rules Enforced

- Email/password registration is required; login blocked until email verified.
- JWT is returned on successful registration/login; `/api/auth/me` introspects it.
- Wallet endpoints require verified email and ensure only one wallet per user.
- AI chat limited to **5 messages per project per user** (see `MAX_AI_MESSAGES_PER_PROJECT`).
- AI-powered publishing deducts credits and persists structured review data.
- Tip routes verify Solana transactions before updating user stats.
- Middleware enforces CORS with `gimmeidea.com` and rate limits abusive clients.

## Testing Notes

- Most handlers catch and format errors through `lib/errors.ts`.
- Rate limiting requires `UPSTASH_REDIS_REST_URL/TOKEN`.
- Wallet signature and Solana verification assume mainnet RPC (customize via `SOLANA_RPC_URL`).

## Deployment

- Build with `npm run build`; deploy to platforms supporting Next.js 14 (Vercel, Render, etc.).
- Ensure environment variables are set and Supabase functions deployed before promoting to production.
