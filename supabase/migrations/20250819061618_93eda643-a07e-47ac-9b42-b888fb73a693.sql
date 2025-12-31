-- Fix critical security vulnerability: Remove 'user' role access to healthcare data
-- This function should only allow proper healthcare roles to access patient information

CREATE OR REPLACE FUNCTION public.has_healthcare_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'healthcare_staff', 'clinician', 'nurse', 'doctor')
  );
$$;