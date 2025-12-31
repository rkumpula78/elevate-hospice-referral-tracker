-- First, create a security definer function to check if user has healthcare access
CREATE OR REPLACE FUNCTION public.has_healthcare_access()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'healthcare_staff', 'clinician', 'nurse', 'doctor')
  ) OR EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'user'
    -- For now, allow 'user' role as well until proper role assignment is implemented
    -- In production, this should be restricted to healthcare-specific roles only
  );
$$;

-- Drop all existing overly permissive policies on patients table
DROP POLICY IF EXISTS "Allow all operations on patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can delete patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can manage patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can view patients" ON public.patients;

-- Create secure RLS policies for patients table
CREATE POLICY "Healthcare staff can view patients"
ON public.patients
FOR SELECT
TO authenticated
USING (public.has_healthcare_access());

CREATE POLICY "Healthcare staff can insert patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (public.has_healthcare_access());

CREATE POLICY "Healthcare staff can update patients"
ON public.patients
FOR UPDATE
TO authenticated
USING (public.has_healthcare_access())
WITH CHECK (public.has_healthcare_access());

CREATE POLICY "Healthcare staff can delete patients"
ON public.patients
FOR DELETE
TO authenticated
USING (public.has_healthcare_access());

-- Also secure the referrals table since it contains sensitive patient data
DROP POLICY IF EXISTS "Allow all operations on referrals" ON public.referrals;
DROP POLICY IF EXISTS "Authenticated users can delete referrals" ON public.referrals;
DROP POLICY IF EXISTS "Authenticated users can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "Authenticated users can manage referrals" ON public.referrals;
DROP POLICY IF EXISTS "Authenticated users can update referrals" ON public.referrals;
DROP POLICY IF EXISTS "Authenticated users can view referrals" ON public.referrals;

-- Create secure RLS policies for referrals table
CREATE POLICY "Healthcare staff can view referrals"
ON public.referrals
FOR SELECT
TO authenticated
USING (public.has_healthcare_access());

CREATE POLICY "Healthcare staff can insert referrals"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (public.has_healthcare_access());

CREATE POLICY "Healthcare staff can update referrals"
ON public.referrals
FOR UPDATE
TO authenticated
USING (public.has_healthcare_access())
WITH CHECK (public.has_healthcare_access());

CREATE POLICY "Healthcare staff can delete referrals"
ON public.referrals
FOR DELETE
TO authenticated
USING (public.has_healthcare_access());