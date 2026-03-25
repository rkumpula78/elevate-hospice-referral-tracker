
-- Create staff table for care team assignment dropdowns
CREATE TABLE public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  role text NOT NULL CHECK (role IN ('rn','lpn','cna','sw','chaplain','marketing','admin','np','intake_coordinator')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view staff
CREATE POLICY "Authenticated users can view staff"
  ON public.staff FOR SELECT TO authenticated USING (true);

-- Only admins can manage staff
CREATE POLICY "Admins can manage staff"
  ON public.staff FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Add care team fields to referrals table
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS primary_rn uuid REFERENCES public.staff(id),
  ADD COLUMN IF NOT EXISTS cna uuid REFERENCES public.staff(id),
  ADD COLUMN IF NOT EXISTS social_worker uuid REFERENCES public.staff(id),
  ADD COLUMN IF NOT EXISTS chaplain uuid REFERENCES public.staff(id),
  ADD COLUMN IF NOT EXISTS marketer uuid REFERENCES public.staff(id),
  ADD COLUMN IF NOT EXISTS created_by uuid;
