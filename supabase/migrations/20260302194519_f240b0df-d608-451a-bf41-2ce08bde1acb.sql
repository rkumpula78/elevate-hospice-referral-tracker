
-- Step 1: Add new simplified status values to the referral_status enum and add closed_reason column
ALTER TYPE public.referral_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE public.referral_status ADD VALUE IF NOT EXISTS 'assessment';
ALTER TYPE public.referral_status ADD VALUE IF NOT EXISTS 'closed';

-- Add closed_reason column to referrals table
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS closed_reason text;
