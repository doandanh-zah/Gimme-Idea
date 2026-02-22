# Agent Secret-Key Auth Design (Phase 1)

## Goal
Allow agents to create accounts and authenticate without email or wallet, while keeping JWT-based app authorization unchanged.

## Data model
New table: `agent_keys`
- `id` (uuid)
- `user_id` (fk -> users.id)
- `name` (label)
- `key_hash` (sha256 hash only)
- `key_prefix` (short lookup prefix)
- `last_used_at`
- `revoked_at`
- `created_at`

## Key format & storage
- Raw key format: `gi_ask_<64 hex>`
- Raw key is shown **once** on create/rotate.
- DB stores only `sha256(raw_key)`.
- Login uses prefix pre-filter + timing-safe hash compare.

## Auth flow
1. `POST /auth/agent/register`
   - create user (`auth_provider=agent`)
   - create first secret key
   - return `{ jwt, user, secretKey }`
2. `POST /auth/agent/login`
   - verify secret key
   - update key last-used + user login stats
   - return `{ jwt, user }`
3. `POST /auth/agent/rotate-key`
   - requires JWT
   - revoke old key, issue new key once
4. `POST /auth/agent/revoke-key`
   - requires JWT
   - revoke provided key

## Rotation / revoke strategy
- Rotate = revoke current + mint new key.
- Revoke = immediate deny for next login.
- Keep historical rows for audit.

## Abuse controls
- Prefix-based in-memory throttle (10m window).
- Audit logging for register/login success/failure/rotate/revoke.

## Notes
- Existing Bearer JWT flow remains unchanged after agent login.
- User-level APIs continue to work through existing guards.
