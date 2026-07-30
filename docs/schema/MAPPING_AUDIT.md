# Schema ↔ code ↔ prod mapping audit

**Date:** 2026-07-30  
**Sources:** prod dump, `backend/src`, `supabase/migrations/0001_init.sql`

## Summary

| Layer | Status |
|-------|--------|
| Core `users` / `projects` / `comments` | Aligned; prod has real data (33 / 85 / 138) |
| Greenfield `0001` | Updated to match prod columns code actually uses |
| In-place prod | `0002_prod_align_safe.sql` (agent auth, billing_payments, drop empty twins) |
| Prod data quality | Many empty tables; sparse social; almost all ideas |

## Tables

### Code needs, prod had missing
| Table | Action |
|-------|--------|
| `billing_payments` | Added in `0001` + `0002` CREATE IF NOT EXISTS |

### Prod only, code unused (or RPC-only)
| Table | Rows | Decision |
|-------|------|----------|
| `hackathon_ideas` | 0 | Omit greenfield; drop if empty (`0002`) |
| `hackathon_feedback` | 0 | same |
| `hackathon_round_results` | 0 | same |
| `hackathon_participants` | 0 | Code uses `hackathon_registrations` |
| `hackathon_announcements` | 7 | Keep in `0001` for ETL fidelity |
| `ai_interactions` | 12 | Keep (history / possible RPC) |
| `ai_market_assessments` | 0 | Keep for AI features |
| `idea_search_quota` | 7 | Keep (RPC); dual with `user_daily_usage` until consolidated |

### Column mismatches fixed in `0001`
| Area | Was (wrong greenfield) | Now (prod + code) |
|------|------------------------|-------------------|
| `admin_activity_log` | `metadata` | `details` |
| `hackathon_schedule` | starts_at/ends_at | `event_date`, `event_type`, `link` |
| `hackathon_partners` | name/website | `partner_name`, `partner_link` |
| `projects` | missing verify fields | `is_verified`, `verified_*`, `hackathon_*` |
| `users.auth_provider` | unconstrained / no agent | CHECK wallet\|google\|**agent** |
| `feeds.slug` | nullable | NOT NULL (prod) |

## Frontend mapping gaps (known)

| Field | Backend / DB | Frontend types |
|-------|--------------|----------------|
| `image_url` | snake | `normalizeProject` → `image` / `imageUrl` |
| `feedback_count` | snake | `feedbackCount` via API map or normalize |
| `is_verified` | admin sets | **not** on `Project` type yet (optional follow-up) |
| categories | 15 values in DB check | types list fewer (UI may still send wider) |
| dual auth | AuthContext + store mirror | documented; Auth is SSOT |

## Prod data quality (not schema bugs)

- **84 ideas / 1 project** — product is idea-heavy; not a schema error  
- **0 projects verified**, **0 linked to hackathon** — columns unused in data  
- **auth_provider** only google|wallet in data; agent constraint blocked agent until `0002`  
- **Empty hackathon graph** except 1 hackathon, 13 prizes, 1 registration, 7 announcements  
- **notifications 177** vs **follows 2** — possible historical spam / import noise  
- Orphan risk low for comments/votes (FK enforced)

## ETL priority (if greenfield cutover)

**Must:** users → projects → comments → project_votes → comment_likes  

**Should:** user_ai_credits, notifications, related_projects, api_tokens, agent_keys, audit_logs, pool_supports, proposals, feeds*  

**Optional / skip if empty:** dead twin tables, zero-row tables  

## Commands

```bash
# New empty DB
psql "$NEW_URL" -f supabase/migrations/0001_init.sql

# Existing prod (backup first!)
psql "$DATABASE_URL" -f supabase/migrations/0002_prod_align_safe.sql
```
