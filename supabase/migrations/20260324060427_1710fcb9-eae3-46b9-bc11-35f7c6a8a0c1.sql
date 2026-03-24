
-- Fix 1: Add RLS policies for PHI tables missing authenticated user policies
-- referral_family_contacts - PHI table
CREATE POLICY "Healthcare staff can manage referral family contacts"
  ON public.referral_family_contacts FOR ALL TO authenticated
  USING (public.has_healthcare_access()) WITH CHECK (public.has_healthcare_access());

-- referral_assessments - PHI table
CREATE POLICY "Healthcare staff can manage referral assessments"
  ON public.referral_assessments FOR ALL TO authenticated
  USING (public.has_healthcare_access()) WITH CHECK (public.has_healthcare_access());

-- bereavement_tracking - PHI table
CREATE POLICY "Healthcare staff can manage bereavement tracking"
  ON public.bereavement_tracking FOR ALL TO authenticated
  USING (public.has_healthcare_access()) WITH CHECK (public.has_healthcare_access());

-- liaison_goals - business metrics, any authenticated user
CREATE POLICY "Authenticated users can manage liaison goals"
  ON public.liaison_goals FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Fix 2: Remove overlapping USING(true) policies on referrals table
DROP POLICY IF EXISTS "Authenticated users can view all referrals" ON public.referrals;
DROP POLICY IF EXISTS "Authenticated users can create referrals" ON public.referrals;
DROP POLICY IF EXISTS "Authenticated users can update referrals" ON public.referrals;
DROP POLICY IF EXISTS "Authenticated users can delete referrals" ON public.referrals;
