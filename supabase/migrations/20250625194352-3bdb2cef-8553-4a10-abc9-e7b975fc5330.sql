
-- Create enhanced activity logging table
CREATE TABLE public.activity_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  referral_id UUID REFERENCES public.referrals(id),
  contact_id UUID REFERENCES public.organization_contacts(id),
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_by TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  purpose TEXT[] DEFAULT ARRAY[]::TEXT[],
  outcome_sentiment TEXT DEFAULT 'neutral',
  discussion_points TEXT,
  materials_provided TEXT[] DEFAULT ARRAY[]::TEXT[],
  next_step TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_completed BOOLEAN DEFAULT false,
  cost_amount NUMERIC(10,2),
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT activity_communications_target_check CHECK (
    (organization_id IS NOT NULL AND referral_id IS NULL) OR
    (organization_id IS NULL AND referral_id IS NOT NULL) OR
    (organization_id IS NOT NULL AND referral_id IS NOT NULL)
  )
);

-- Create liaison goals tracking table
CREATE TABLE public.liaison_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  liaison_name TEXT NOT NULL,
  goal_period_start DATE NOT NULL,
  goal_period_end DATE NOT NULL,
  in_person_visits_goal INTEGER DEFAULT 0,
  lunch_learns_goal INTEGER DEFAULT 0,
  new_referrals_goal INTEGER DEFAULT 0,
  phone_calls_goal INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create referral family contacts table
CREATE TABLE public.referral_family_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID REFERENCES public.referrals(id) NOT NULL,
  contact_name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT,
  email TEXT,
  is_poa BOOLEAN DEFAULT false,
  is_primary_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create referral assessments table
CREATE TABLE public.referral_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID REFERENCES public.referrals(id) NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  assigned_clinician TEXT,
  assessment_outcome TEXT,
  outcome_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bereavement tracking table
CREATE TABLE public.bereavement_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID REFERENCES public.referrals(id) NOT NULL,
  family_contact_id UUID REFERENCES public.referral_family_contacts(id),
  bereavement_status TEXT DEFAULT 'not_enrolled',
  enrollment_date TIMESTAMP WITH TIME ZONE,
  support_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add new columns to existing organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS relationship_status TEXT DEFAULT 'prospect',
ADD COLUMN IF NOT EXISTS referral_potential_level TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_followup_date DATE,
ADD COLUMN IF NOT EXISTS contract_on_file BOOLEAN DEFAULT false;

-- Add new columns to existing organization_contacts table
ALTER TABLE public.organization_contacts 
ADD COLUMN IF NOT EXISTS role_in_referral_process TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS relationship_strength TEXT DEFAULT 'neutral',
ADD COLUMN IF NOT EXISTS personal_notes TEXT;

-- Add new columns to existing referrals table
ALTER TABLE public.referrals 
ADD COLUMN IF NOT EXISTS patient_location TEXT,
ADD COLUMN IF NOT EXISTS referral_intake_coordinator TEXT,
ADD COLUMN IF NOT EXISTS reason_for_non_admittance TEXT,
ADD COLUMN IF NOT EXISTS assessment_scheduled_date TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_communications_org_date ON public.activity_communications(organization_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_communications_referral_date ON public.activity_communications(referral_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_communications_followup ON public.activity_communications(follow_up_date) WHERE follow_up_required = true AND follow_up_completed = false;

-- Create trigger for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_activity_communications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activity_communications_updated_at
    BEFORE UPDATE ON public.activity_communications
    FOR EACH ROW
    EXECUTE FUNCTION update_activity_communications_updated_at();

-- Create trigger to update last_contact_date on organizations
CREATE OR REPLACE FUNCTION update_organization_last_contact()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.organization_id IS NOT NULL THEN
        UPDATE public.organizations 
        SET last_contact_date = NEW.activity_date,
            next_followup_date = NEW.follow_up_date
        WHERE id = NEW.organization_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_org_last_contact
    AFTER INSERT OR UPDATE ON public.activity_communications
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_last_contact();
