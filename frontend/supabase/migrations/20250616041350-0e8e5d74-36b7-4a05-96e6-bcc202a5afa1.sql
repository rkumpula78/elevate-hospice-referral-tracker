
-- Create enums for status fields (if they don't exist)
DO $$ BEGIN
    CREATE TYPE referral_status AS ENUM ('pending', 'contacted', 'scheduled', 'admitted', 'declined', 'lost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE patient_status AS ENUM ('active', 'discharged', 'deceased', 'transferred');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE visit_type AS ENUM ('admission', 'routine', 'urgent', 'discharge');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE care_team_role AS ENUM ('nurse', 'physician', 'social_worker', 'chaplain', 'aide');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create referrals table (for CRM tracking)
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  referring_physician TEXT,
  diagnosis TEXT,
  insurance TEXT,
  priority TEXT DEFAULT 'routine', -- 'urgent', 'routine', 'low'
  status referral_status DEFAULT 'pending',
  referral_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  contact_date TIMESTAMP WITH TIME ZONE,
  admission_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patients table (for admitted patients)
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID REFERENCES public.referrals(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  address TEXT,
  phone TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  diagnosis TEXT,
  insurance TEXT,
  physician TEXT,
  status patient_status DEFAULT 'active',
  admission_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  discharge_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create visits table for scheduling and tracking
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id),
  staff_name TEXT NOT NULL,
  visit_type visit_type NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_date TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  notes TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create care team assignments table
CREATE TABLE IF NOT EXISTS public.care_team_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id),
  staff_name TEXT NOT NULL,
  role care_team_role NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance (only if tables were created)
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_organization ON public.referrals(organization_id);
CREATE INDEX IF NOT EXISTS idx_patients_status ON public.patients(status);
CREATE INDEX IF NOT EXISTS idx_visits_patient ON public.visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_scheduled_date ON public.visits(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_care_team_patient ON public.care_team_assignments(patient_id);

-- Enable RLS on new tables
DO $$ BEGIN
    ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.care_team_assignments ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

-- Create policies for authenticated users
DO $$ BEGIN
    CREATE POLICY "Authenticated users can manage referrals" ON public.referrals FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated users can manage patients" ON public.patients FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated users can manage visits" ON public.visits FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated users can manage care teams" ON public.care_team_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
