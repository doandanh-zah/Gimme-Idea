-- Admin Seeding Script (Template)
-- Date: 2025-12-10
-- Purpose: Grant 'admin' role to specific users.
-- INSTRUCTIONS: Replace the placeholders (like 'REPLACE_WITH_WALLET_ADDRESS') with actual values before running.

-- =========================================================
-- CASE 1: Account with Gmail + Wallet linked
-- =========================================================
-- Strategy: Identify this user by Wallet.

UPDATE users
SET role = 'admin'
WHERE wallet = 'REPLACE_WITH_WALLET_ADDRESS_1';


-- =========================================================
-- CASE 2: Account NOT registered yet (Pre-provisioning)
-- =========================================================
-- Strategy: Insert a placeholder record with the reserved wallet address.
-- The username will be temporary.

INSERT INTO users (wallet, username, role, needs_wallet_connect)
VALUES (
    'REPLACE_WITH_WALLET_ADDRESS_2',       -- The specific wallet address
    'admin_reserved_' || substr(md5(random()::text), 1, 6), -- Temporary username
    'admin',                               -- Grant Admin role immediately
    false                                  -- Assume wallet is connected
)
ON CONFLICT (wallet)
DO UPDATE SET role = 'admin',
              needs_wallet_connect = EXCLUDED.needs_wallet_connect;


-- =========================================================
-- CASE 3: Account with Gmail only
-- =========================================================
-- Strategy: Identify strictly by email address.
-- If user does not exist, a placeholder will be created.

INSERT INTO users (email, username, wallet, role, auth_provider, needs_wallet_connect)
VALUES (
    'REPLACE_WITH_GMAIL_ADDRESS_3@gmail.com',
    'admin_email_' || substr(md5(random()::text), 1, 6), -- Placeholder username
    '',                                                  -- Empty wallet
    'admin',
    'google',
    true                                                 -- User needs to connect a wallet
)
ON CONFLICT (email)
DO UPDATE SET role = 'admin',
              auth_provider = 'google',
              needs_wallet_connect = EXCLUDED.needs_wallet_connect;

-- =========================================================
-- VERIFICATION
-- =========================================================
-- Run this after execution to confirm admins:
-- SELECT id, username, wallet, email, role FROM users WHERE role = 'admin';