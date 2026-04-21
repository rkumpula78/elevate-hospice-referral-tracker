-- Force PostgREST schema cache refresh by performing a no-op DDL change on the referrals table.
-- This ensures the API recognizes 'benefit_period_number' and rejects any stale 'benefit_period' references.

-- Touch the column with a comment to trigger a schema event
COMMENT ON COLUMN public.referrals.benefit_period_number IS 'Medicare benefit period number (1-5+). Auto-calculated from admission_date when applicable.';

-- Reload PostgREST schema cache (sends notification to all PostgREST workers)
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';