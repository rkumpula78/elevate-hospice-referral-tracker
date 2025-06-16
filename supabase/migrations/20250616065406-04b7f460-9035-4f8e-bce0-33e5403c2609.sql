
-- Enable Row Level Security on the existing tables to require authentication
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Create policies for referrals table
CREATE POLICY "Authenticated users can view referrals" ON public.referrals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert referrals" ON public.referrals
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update referrals" ON public.referrals
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete referrals" ON public.referrals
  FOR DELETE TO authenticated USING (true);

-- Create policies for visits table
CREATE POLICY "Authenticated users can view visits" ON public.visits
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert visits" ON public.visits
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update visits" ON public.visits
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete visits" ON public.visits
  FOR DELETE TO authenticated USING (true);

-- Create policies for organizations table
CREATE POLICY "Authenticated users can view organizations" ON public.organizations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert organizations" ON public.organizations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update organizations" ON public.organizations
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete organizations" ON public.organizations
  FOR DELETE TO authenticated USING (true);

-- Create policies for patients table
CREATE POLICY "Authenticated users can view patients" ON public.patients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert patients" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients" ON public.patients
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete patients" ON public.patients
  FOR DELETE TO authenticated USING (true);

-- Create policies for hospice_referrals table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hospice_referrals') THEN
    ALTER TABLE public.hospice_referrals ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Authenticated users can view hospice_referrals" ON public.hospice_referrals
      FOR SELECT TO authenticated USING (true);
    
    CREATE POLICY "Authenticated users can insert hospice_referrals" ON public.hospice_referrals
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END
$$;
