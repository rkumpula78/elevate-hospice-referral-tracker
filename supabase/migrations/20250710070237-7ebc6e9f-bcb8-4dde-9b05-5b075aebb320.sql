-- Insert or update Elevate Hospice information for the current authenticated user
-- This will create a hospice profile with Elevate's information
INSERT INTO public.hospice_profiles (
  user_id,
  provider_name,
  provider_number,
  phone,
  fax,
  email,
  is_default
)
SELECT 
  auth.uid(),
  'Elevate Hospice & Palliative Care',
  'ELEVATE001',
  '480-800-4816',
  '480-800-4817',
  'info@elevatehospiceaz.com',
  true
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, provider_number) 
DO UPDATE SET
  provider_name = EXCLUDED.provider_name,
  phone = EXCLUDED.phone,
  fax = EXCLUDED.fax,
  email = EXCLUDED.email,
  is_default = EXCLUDED.is_default,
  updated_at = now();

-- Also update any existing Elevate Hospice profiles to use the correct contact information
UPDATE public.hospice_profiles 
SET 
  phone = '480-800-4816',
  fax = '480-800-4817',
  email = 'info@elevatehospiceaz.com',
  updated_at = now()
WHERE provider_name ILIKE '%elevate%hospice%';