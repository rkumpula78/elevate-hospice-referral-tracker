
-- Update all existing profiles with role 'user' to 'healthcare_staff'
-- so they pass has_healthcare_access() checks
UPDATE public.profiles SET role = 'healthcare_staff' WHERE role = 'user';

-- Update the default role for new profiles to 'healthcare_staff'
-- since all users are @elevatehospiceaz.com company staff
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'healthcare_staff';
