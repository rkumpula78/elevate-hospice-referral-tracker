-- Insert or update Elevate Hospice information
-- First, let's create a default hospice profile for the system
INSERT INTO public.hospice_profiles (
  user_id,
  provider_name,
  provider_number,
  phone,
  fax,
  email,
  is_default
)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- System default user ID
  'Elevate Hospice & Palliative Care',
  'ELEVATE001', -- Default provider number, can be updated
  '480-800-4816',
  '480-800-4817',
  'info@elevatehospiceaz.com',
  true
)
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