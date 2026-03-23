
-- Fix referrals table: drop permissive policies, add healthcare-restricted ones
DROP POLICY IF EXISTS "Authenticated users can view referrals" ON public.referrals;
DROP POLICY IF EXISTS "Authenticated users can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "Authenticated users can update referrals" ON public.referrals;
DROP POLICY IF EXISTS "Authenticated users can delete referrals" ON public.referrals;

CREATE POLICY "Healthcare staff can view referrals"
  ON public.referrals FOR SELECT TO authenticated
  USING (public.has_healthcare_access());
CREATE POLICY "Healthcare staff can insert referrals"
  ON public.referrals FOR INSERT TO authenticated
  WITH CHECK (public.has_healthcare_access());
CREATE POLICY "Healthcare staff can update referrals"
  ON public.referrals FOR UPDATE TO authenticated
  USING (public.has_healthcare_access()) WITH CHECK (public.has_healthcare_access());
CREATE POLICY "Healthcare staff can delete referrals"
  ON public.referrals FOR DELETE TO authenticated
  USING (public.has_healthcare_access());

-- Fix referral_eligibility table: drop permissive policies, add healthcare-restricted ones
DROP POLICY IF EXISTS "Authenticated users can view eligibility" ON public.referral_eligibility;
DROP POLICY IF EXISTS "Authenticated users can insert eligibility" ON public.referral_eligibility;
DROP POLICY IF EXISTS "Authenticated users can update eligibility" ON public.referral_eligibility;
DROP POLICY IF EXISTS "Authenticated users can delete eligibility" ON public.referral_eligibility;

CREATE POLICY "Healthcare staff can view eligibility"
  ON public.referral_eligibility FOR SELECT TO authenticated
  USING (public.has_healthcare_access());
CREATE POLICY "Healthcare staff can insert eligibility"
  ON public.referral_eligibility FOR INSERT TO authenticated
  WITH CHECK (public.has_healthcare_access());
CREATE POLICY "Healthcare staff can update eligibility"
  ON public.referral_eligibility FOR UPDATE TO authenticated
  USING (public.has_healthcare_access()) WITH CHECK (public.has_healthcare_access());
CREATE POLICY "Healthcare staff can delete eligibility"
  ON public.referral_eligibility FOR DELETE TO authenticated
  USING (public.has_healthcare_access());
