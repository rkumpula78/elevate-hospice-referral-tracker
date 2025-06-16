
-- Add marketer columns to track Elevate staff responsible for referrals
ALTER TABLE organizations ADD COLUMN assigned_marketer TEXT;
ALTER TABLE referrals ADD COLUMN assigned_marketer TEXT;
