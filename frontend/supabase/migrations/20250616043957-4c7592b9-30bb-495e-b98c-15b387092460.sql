
-- Update the referral_status enum to include the new status options
ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'admitted_our_hospice';
ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'admitted_other_hospice';
ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'lost_death';
ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'lost_move';
ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'lost_other_hospice';

-- Update organization types to include marketer and referral_source
-- First, let's see what organization types we currently have and add new ones
-- We'll update the type field to allow these new values
UPDATE organizations SET type = 'referral_source' WHERE type = 'hospital' OR type = 'clinic';

-- Add new organization records or update existing ones to support marketer type
-- This will allow adding marketers and referral sources through the organization management
