# Feature Status

This file is a lightweight status snapshot. It is not a release promise. Before publishing external claims, verify against the current code and deployed environment.

## Recently Verified

- Frontend production build passed after the latest egress optimization pass.
- Public project list endpoints have server-side payload controls and edge cache headers.
- Supabase realtime is disabled by default unless `NEXT_PUBLIC_ENABLE_REALTIME=true`.
- Profile idea lists request a smaller, paginated API shape.
- Dashboard velocity stats use a compact aggregate endpoint instead of loading a large project list.

## Implemented In Code

- Project and idea listing/detail endpoints.
- Project and idea create/update/delete/vote flows guarded by account or PAT auth where applicable.
- Comment create/update/delete/like flows.
- User profile lookup, profile update, profile stats, and user project listing.
- Follow, notification, feed, and announcement modules.
- AI feedback, reply, auto-reply, market assessment, related-project search, and quota endpoints.
- Agent secret-key authentication.
- Personal Access Token lifecycle and scoped automation guards.
- Hackathon, team, invite, registration, submission, scoring, and admin modules.
- Payment verification and pool support modules.
- Admin moderation and review modules.

## Needs Verification Before External Claims

- Exact production readiness of each hackathon UI workflow.
- Current status of USDC/SPL payment UX across wallet types.
- Whether every admin flow is reachable from the UI, not only through API endpoints.
- Whether notification preferences, email digest, or push notifications are live in production.
- Current Solana program deployment target and audit status.
- Current Supabase realtime publication settings in the production project.
- Current search behavior and whether it should be called "advanced search."

## Known Egress-Sensitive Areas

- Project and idea list pages.
- Profile pages that load stats, ideas, follows, and feeds.
- Idea detail pages that load comments, related projects, proposals, and market stats.
- Realtime subscriptions for comments, projects, notifications, announcements, and team invites.
- Admin pages that request large project or submission lists.

## Documentation Rules

- Do not mark a feature "100% complete" unless the deployed UI, API, database, and permission model were verified together.
- Do not keep dated status claims without a concrete review date and reviewer.
- Keep private troubleshooting notes in `dev-docs/`, not this file.
