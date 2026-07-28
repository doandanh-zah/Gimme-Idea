# OAuth Redirect Allowlist

Date: 2026-07-26
Status: repo-side requirements documented; Supabase dashboard verification requires project owner access.

## Source of Truth

- `frontend/contexts/AuthContext.tsx` sends Google OAuth through Supabase with:
  - web redirect: `${window.location.origin}/auth/callback`
  - native redirect: `com.gimmeidea.app://auth/callback`
- `frontend/app/auth/callback/page.tsx` consumes the returned Supabase session and routes the user to `/idea`.

## Required Redirect URLs

- Local production build used by browser evidence: `http://localhost:3000/auth/callback`
- Production web origin: `<production-frontend-origin>/auth/callback`
- Any staging or preview origin used for Google OAuth: `<staging-or-preview-origin>/auth/callback`
- Native app deep link: `com.gimmeidea.app://auth/callback`

## Verification Status

This repository does not contain Supabase dashboard state or a Supabase management API token. The allowlist must be verified by a project owner in Supabase Auth URL Configuration before Phase 5 can be signed off at the external-production bar.
