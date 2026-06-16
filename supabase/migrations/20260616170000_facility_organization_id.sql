
-- Track where a patient physically lives (group home, SNF, etc.)
-- separate from the organization that referred them.
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS facility_organization_id uuid
  REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_referrals_facility_org
  ON public.referrals(facility_organization_id);
