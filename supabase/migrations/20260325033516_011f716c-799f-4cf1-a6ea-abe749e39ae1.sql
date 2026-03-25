
-- Add office_manager to the role check constraint
ALTER TABLE public.staff DROP CONSTRAINT IF EXISTS staff_role_check;
ALTER TABLE public.staff ADD CONSTRAINT staff_role_check CHECK (role IN ('rn','lpn','cna','sw','chaplain','marketing','admin','np','intake_coordinator','office_manager'));

-- Remove Kathleen Coughlin (no longer on team)
DELETE FROM public.staff WHERE name = 'Kathleen Coughlin';

-- Update Bethany Odenbrett: was admin, now rn
UPDATE public.staff SET role = 'rn', email = 'bodenbrett@elevatehospiceaz.com' WHERE name = 'Bethany Odenbrett';

-- Update Anneli Kumpula: was admin, now np
UPDATE public.staff SET role = 'np' WHERE name = 'Anneli Kumpula';

-- Update Jodie Ramsey: was intake_coordinator, now admin
UPDATE public.staff SET role = 'admin' WHERE name = 'Jodie Ramsey';

-- Update Michelle Swaim: was cna, now office_manager
UPDATE public.staff SET role = 'office_manager' WHERE name = 'Michelle Swaim';

-- Update Brandon Smith: add phone and email
UPDATE public.staff SET phone = '602-309-6923', email = 'bsmith@elevatehospiceaz.com' WHERE name = 'Brandon Smith';

-- Update Maritza Castro: add phone and email
UPDATE public.staff SET phone = '480-569-9944', email = 'mcastro@elevatehospiceaz.com' WHERE name = 'Maritza Castro';

-- Add new staff members
INSERT INTO public.staff (name, role) VALUES
  ('Jennifer Tilford', 'lpn'),
  ('Melissa McBride', 'lpn');
