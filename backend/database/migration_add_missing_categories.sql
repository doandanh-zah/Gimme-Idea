-- Migration: Add missing categories to projects table
-- Problem: categories Payment, Developer Tooling, ReFi, Content, Dapp, Blinks are not in constraint
-- Run this in Supabase SQL Editor

-- Drop the old constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_category_check;

-- Add the new constraint with ALL supported categories
ALTER TABLE projects ADD CONSTRAINT projects_category_check
  CHECK (category IN (
    'DeFi', 
    'NFT', 
    'Gaming', 
    'Infrastructure', 
    'DAO', 
    'DePIN', 
    'Social', 
    'Mobile', 
    'Security',
    'Payment',
    'Developer Tooling',
    'ReFi',
    'Content',
    'Dapp',
    'Blinks'
  ));

-- Verify the constraint was updated
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'projects_category_check';
