# BUILZER.md

## Owner
- Planner: **Lizen**
- Implementer: **Roki**
- Repository: `doandanh-zah/Gimme-Idea`

## Mission
Build an **Agent Mode** for Gimme Idea so an agent can:
1. Create account automatically
2. Login using a **secret key** (no email, no wallet)
3. Use a dedicated **MCP/Skill guide + heartbeat guide** to perform full user-level actions on Gimme Idea
4. Reach parity with the current Superteam Earn agent workflow style (clear automation path, stable auth, toolable actions)

## Requested constraints from Zah
- Start execution at **14:45 (Asia/Ho_Chi_Minh)**
- Roki must push to GitHub every **30 minutes**
- Roki must update progress in `REPORT_BUILZER.md` every **30 minutes**
- Lizen checks `REPORT_BUILZER.md` every **30 minutes** until complete

---

## Quick repo findings (initial check)
- Frontend exists (`frontend/`), backend exists (`backend/`)
- Current docs indicate wallet/email auth focus (`devdocs/06-authentication-profiles.md`)
- No documented agent-only auth flow yet
- No dedicated `skills/gimme-idea/SKILL.md` + heartbeat automation docs found in repo root

---

## Execution Plan for Roki

### Phase 1 — Discovery & design (T+0 to T+30)
1. Map current auth stack in backend:
   - auth module, JWT issuance, guards, user model
2. Confirm user schema supports API key / secret key auth
3. Produce minimal architecture note in `docs/agent-auth-design.md`:
   - Secret key format and storage (hashed at rest)
   - Agent identity to user mapping
   - Rotation and revoke strategy
   - Rate-limit + abuse controls

**Output:** approved design + affected file list

---

### Phase 2 — Backend implementation (T+30 to T+120)
1. Add data model for agent credentials (either in `users` extension or dedicated table):
   - `agent_keys(id, user_id, key_hash, key_prefix, name, last_used_at, revoked_at, created_at)`
2. Add endpoints:
   - `POST /auth/agent/register` (create account + issue secret key once)
   - `POST /auth/agent/login` (secret key -> JWT)
   - `POST /auth/agent/rotate-key`
   - `POST /auth/agent/revoke-key`
3. Add auth guard support:
   - `Authorization: Bearer <jwt>` standard flow after agent login
4. Add audit logging:
   - login attempts, key creation, revoke, rotate

**Security requirements (must-have):**
- Never store raw secret keys
- Show raw key only once at creation/rotation
- Constant-time comparison
- Brute-force protection + throttle

---

### Phase 3 — Frontend / UX for Agent Mode (T+120 to T+180)
1. Add Agent Mode in auth UI:
   - “Create Agent Account”
   - “Login with Secret Key”
2. Add key management panel (user settings):
   - Create/Rotate/Revoke key
   - Last used indicator
3. Add clear warning banners:
   - Copy key and store safely
   - Lost key cannot be recovered, only rotated

---

### Phase 4 — MCP / Skill + Heartbeat docs (T+180 to T+240)
1. Add `mcp/gimme-idea/skill.md`:
   - How agent authenticates with secret key
   - Full supported actions (create idea, edit, comment, vote, profile updates, etc.)
   - Example tool-call payloads
   - Error handling / retries
2. Add `mcp/gimme-idea/heartbeat.md`:
   - Scheduled behavior for posting/commenting tasks
   - Quiet-hour and anti-spam rules
   - Duplicate-comment avoidance
   - Reporting format

---

### Phase 5 — Testing & hardening (T+240 to T+300)
1. Backend tests:
   - register/login/rotate/revoke
   - invalid key / revoked key / expired token
2. Integration tests:
   - agent can perform all user-level actions
3. Basic threat checks:
   - replay resistance
   - leaked key handling flow

---

### Phase 6 — Delivery (T+300 to done)
1. Final docs update in `docs/FEATURE_STATUS.md`
2. Open PR summary (or direct push summary if working on main)
3. Ensure `REPORT_BUILZER.md` final block includes:
   - completed checklist
   - known limitations
   - next-step recommendations

---

## 30-minute reporting protocol (mandatory for Roki)
Update `REPORT_BUILZER.md` every 30 minutes with:
- Timestamp (Asia/Ho_Chi_Minh)
- Current phase
- What was finished
- Blockers
- Next 30-min target
- Commit hash pushed

Template:
```md
## Update HH:MM ICT
- Phase:
- Done:
- Blockers:
- Next (30m):
- Commit:
```

---

## Definition of Done
- Agent can register and login without email/wallet
- Secret-key auth is secure (hashed, rotatable, revocable, audited)
- Agent can execute full user-level features (same capability scope as normal user APIs)
- `mcp/gimme-idea/skill.md` and `mcp/gimme-idea/heartbeat.md` exist and are actionable
- `REPORT_BUILZER.md` contains continuous progress logs
- All changes pushed to GitHub
