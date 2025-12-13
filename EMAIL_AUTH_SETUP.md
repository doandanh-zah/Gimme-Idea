# Email Authentication Setup Guide

This document explains how to set up Google OAuth authentication for Gimme Idea.

## Prerequisites

1. A Supabase project
2. A Google Cloud Platform account

## Step 1: Configure Google OAuth in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   - `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
   - For local development: `http://localhost:3000/auth/callback`
7. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and click to expand
4. Toggle **Enable Sign in with Google**
5. Paste your **Client ID** and **Client Secret**
6. Save

## Step 3: Run Database Migration

Execute the SQL migration to add email authentication support:

```bash
# Option 1: Run via Supabase SQL Editor
# Copy contents of backend/database/migration_add_email_auth.sql
# Paste into Supabase SQL Editor and run

# Option 2: Using Supabase CLI
supabase db push
```

## Step 4: Update Environment Variables

Add to your `.env.local`:

```env
# Supabase (should already exist)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Authentication Flow

### New User Flow:
1. User clicks "Sign in with Google"
2. Google OAuth popup appears
3. After successful auth, user is redirected to app
4. Backend creates new user account
5. Popup appears asking "Do you want to connect wallet?"
   - **Okay**: Shows wallet selection → User connects wallet → Data linked
   - **Skip for now**: Shows warning about tips → User can skip or connect
6. User can connect wallet later from Profile page

### Existing Wallet User Migration:
1. User signs in with Google (new email)
2. When user connects their existing wallet
3. System detects wallet already has data
4. All data (projects, comments, tips, reputation) is merged to new email account
5. Old wallet-only account is deleted

### Data Model:

```
users table:
  - id (UUID)
  - wallet (TEXT) - Solana wallet address for receiving tips
  - username (TEXT)
  - email (TEXT) - Google email
  - auth_id (TEXT) - Supabase Auth user ID
  - auth_provider (TEXT) - 'wallet' or 'google'
  - needs_wallet_connect (BOOLEAN) - True if user hasn't connected wallet yet
```

## Testing Checklist

- [ ] New user can sign in with Google
- [ ] Connect wallet popup appears for new users
- [ ] User can skip wallet connection
- [ ] Reminder badge appears in Profile for users without wallet
- [ ] User can connect wallet from Profile
- [ ] Existing wallet data is merged when connecting
- [ ] User can change wallet in Profile
- [ ] Tips are sent to the current wallet address
- [ ] Logout works correctly
- [ ] Session persists after page refresh
