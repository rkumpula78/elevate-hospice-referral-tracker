
-- Add missing columns to organization_contacts for referral contact tracking
ALTER TABLE public.organization_contacts 
ADD COLUMN IF NOT EXISTS is_referring_contact boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_primary_referrer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS specialization text,
ADD COLUMN IF NOT EXISTS referral_volume_monthly integer DEFAULT 0;
