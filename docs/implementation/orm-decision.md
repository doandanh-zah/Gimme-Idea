# ADR: Drizzle ORM with Supabase SQL migrations

## Decision

Use Drizzle ORM with `node-postgres` for typed PostgreSQL access. Drizzle schema definitions are the typed schema source. Drizzle Kit generates reviewed, timestamp-prefixed SQL migrations; Supabase CLI is the only migration runner.

## Why

- PostgreSQL-first schema primitives, including partial indexes and checks.
- Low runtime abstraction and typed queries for Fastify.
- SQL remains reviewable and reproducible through `supabase db reset`.
- Domain constraints remain explicit rather than being weakened for ORM convenience.

## Guardrails

- Never use `drizzle-kit push` on shared environments.
- Never apply migrations from application startup.
- Review generated SQL before commit.
- Migration tests must rebuild an empty local Supabase database and load seed data.
