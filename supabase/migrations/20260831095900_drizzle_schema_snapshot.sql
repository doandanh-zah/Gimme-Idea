-- Drizzle adoption baseline.
-- The typed schema snapshot in migrations/meta mirrors the tables created by the six
-- reviewed domain migrations above. This migration is intentionally a no-op so future
-- `drizzle-kit generate` calls diff from V1 without recreating existing tables.
select 1;
