-- Add missing rich fields to Hackathons
-- Run this in Supabase SQL Editor

-- 1. Add columns
ALTER TABLE hackathons 
ADD COLUMN IF NOT EXISTS prizes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '[]'::jsonb;

-- 2. Update the sample hackathon with rich data
UPDATE hackathons 
SET 
  prizes = '[
    {"rank": "1st Place", "reward": "10,000,000 VND"},
    {"rank": "2nd Place", "reward": "5,000,000 VND"},
    {"rank": "3rd Place", "reward": "2,000,000 VND"},
    {"rank": "Community Choice", "reward": "Gift Box"}
  ]'::jsonb,
  tasks = '[
    {"id": "1.1", "text": "Register for the Hackathon", "phaseId": "1"},
    {"id": "1.2", "text": "Join DSUC Discord", "phaseId": "1"},
    {"id": "1.3", "text": "Form a Team", "phaseId": "1"},
    {"id": "2.1", "text": "Submit Idea Proposal", "phaseId": "2"},
    {"id": "3.1", "text": "Upload Pitch Deck", "phaseId": "3"}
  ]'::jsonb
WHERE slug = 'solana-edu-2026';
