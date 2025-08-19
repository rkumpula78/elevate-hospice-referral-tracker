-- Fix security vulnerability: Restrict hospice_referrals access to healthcare staff only
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert hospice_referrals" ON public.hospice_referrals;
DROP POLICY IF EXISTS "Authenticated users can update hospice referrals" ON public.hospice_referrals;
DROP POLICY IF EXISTS "Authenticated users can view hospice referrals" ON public.hospice_referrals;
DROP POLICY IF EXISTS "Authenticated users can view hospice_referrals" ON public.hospice_referrals;

-- Keep the public submission policy for external referrals (common in healthcare)
-- But restrict all other operations to healthcare staff only

-- Healthcare staff can view hospice referrals
CREATE POLICY "Healthcare staff can view hospice referrals" 
ON public.hospice_referrals 
FOR SELECT 
USING (has_healthcare_access());

-- Healthcare staff can update hospice referrals
CREATE POLICY "Healthcare staff can update hospice referrals" 
ON public.hospice_referrals 
FOR UPDATE 
USING (has_healthcare_access())
WITH CHECK (has_healthcare_access());

-- Healthcare staff can delete hospice referrals
CREATE POLICY "Healthcare staff can delete hospice referrals" 
ON public.hospice_referrals 
FOR DELETE 
USING (has_healthcare_access());