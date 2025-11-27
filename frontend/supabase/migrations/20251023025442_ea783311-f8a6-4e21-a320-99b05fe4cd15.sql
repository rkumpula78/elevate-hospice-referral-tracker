
-- Insert missing profile for Ryan Kumpula
INSERT INTO public.profiles (id, first_name, last_name, email)
VALUES ('17b2398d-9299-48b8-ad87-c8cdc66c0142', 'Ryan', 'Kumpula', 'rkumpula@elevatehospiceaz.com')
ON CONFLICT (id) DO UPDATE 
SET first_name = 'Ryan', last_name = 'Kumpula', email = 'rkumpula@elevatehospiceaz.com';

-- Update incomplete profiles with names
UPDATE public.profiles 
SET first_name = 'Sheri', last_name = 'Harken'
WHERE email = 'sharken@elevatehospiceaz.com' AND (first_name IS NULL OR last_name IS NULL);

UPDATE public.profiles 
SET first_name = 'Andrea', last_name = 'Kumpula'
WHERE email = 'akumpula@elevatehospiceaz.com' AND (first_name IS NULL OR last_name IS NULL);
