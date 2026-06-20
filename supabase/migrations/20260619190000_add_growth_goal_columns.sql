-- Growth goal columns for the Organization "Growth Targets" card (AccountGrowthCard).
-- These were defined in 20250815_marketing_growth_management.sql but that hand-named
-- migration never ran against the live DB, so updating goals errored out
-- ("Could not find the 'monthly_referral_goal' column"). This re-adds just the
-- columns the card reads/writes. Idempotent via IF NOT EXISTS.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS monthly_referral_goal INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quarterly_referral_goal INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_month_referrals INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_quarter_referrals INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ytd_referrals INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS growth_status TEXT CHECK (growth_status IN ('on_track', 'at_risk', 'behind', 'exceeding')),
  ADD COLUMN IF NOT EXISTS growth_notes TEXT;
