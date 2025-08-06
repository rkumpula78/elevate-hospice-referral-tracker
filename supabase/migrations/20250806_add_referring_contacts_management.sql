-- Add comprehensive referring contact management system
-- This migration enhances contact management with specific referrer tracking and relationships

-- Enhance organization_contacts table with referrer-specific fields
ALTER TABLE public.organization_contacts
ADD COLUMN is_referring_contact boolean DEFAULT false,
ADD COLUMN referral_volume_monthly integer DEFAULT 0,
ADD COLUMN referral_volume_ytd integer DEFAULT 0,
ADD COLUMN specialization text,
ADD COLUMN preferred_communication_method text CHECK (preferred_communication_method IN ('phone', 'email', 'text', 'teams', 'in_person')),
ADD COLUMN referral_conversion_rate numeric(5,2) DEFAULT 0.00,
ADD COLUMN last_referral_date date,
ADD COLUMN average_referral_quality_score numeric(3,1) DEFAULT 0.0,
ADD COLUMN preferred_contact_days text[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
ADD COLUMN is_primary_referrer boolean DEFAULT false,
ADD COLUMN referrer_notes text,
ADD COLUMN license_number text,
ADD COLUMN npi_number text;

-- Create referring contact relationships table for complex referrer hierarchies
CREATE TABLE public.referring_contact_relationships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.organization_contacts(id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'primary_referrer' CHECK (
    relationship_type IN ('primary_referrer', 'secondary_referrer', 'backup_referrer', 'department_head', 'liaison')
  ),
  department text,
  authority_level integer DEFAULT 3 CHECK (authority_level BETWEEN 1 AND 5), -- 1=highest authority, 5=lowest
  is_active boolean DEFAULT true,
  effective_from date DEFAULT CURRENT_DATE,
  effective_to date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add referrer tracking to referrals table
ALTER TABLE public.referrals
ADD COLUMN referring_contact_id uuid REFERENCES public.organization_contacts(id),
ADD COLUMN referral_method text DEFAULT 'general' CHECK (
  referral_method IN ('general', 'specific_contact', 'emergency', 'direct_physician', 'family_request')
),
ADD COLUMN referrer_relationship text, -- How the referrer knows about this case
ADD COLUMN referral_urgency_level integer DEFAULT 3 CHECK (referral_urgency_level BETWEEN 1 AND 5),
ADD COLUMN expected_admission_timeline text CHECK (
  expected_admission_timeline IN ('immediate', 'within_24h', 'within_week', 'within_month', 'unknown')
);

-- Create referrer performance tracking table
CREATE TABLE public.referrer_performance_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES public.organization_contacts(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric_period_start date NOT NULL,
  metric_period_end date NOT NULL,
  total_referrals integer DEFAULT 0,
  accepted_referrals integer DEFAULT 0,
  admitted_referrals integer DEFAULT 0,
  average_response_time_hours numeric(8,2) DEFAULT 0.00,
  average_admission_time_hours numeric(8,2) DEFAULT 0.00,
  quality_score numeric(3,1) DEFAULT 0.0, -- 1-10 scale
  communication_responsiveness_score numeric(3,1) DEFAULT 0.0, -- 1-10 scale
  documentation_quality_score numeric(3,1) DEFAULT 0.0, -- 1-10 scale
  revenue_generated numeric(10,2) DEFAULT 0.00,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create referrer communication preferences table
CREATE TABLE public.referrer_communication_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES public.organization_contacts(id) ON DELETE CASCADE,
  communication_type text NOT NULL CHECK (
    communication_type IN ('new_referral', 'status_update', 'admission_confirmation', 'discharge_notification', 'f2f_reminder', 'general_update')
  ),
  preferred_method text NOT NULL CHECK (
    preferred_method IN ('phone', 'email', 'text', 'teams', 'portal', 'fax')
  ),
  timing_preference text CHECK (
    timing_preference IN ('immediate', 'daily_digest', 'weekly_summary', 'as_needed')
  ),
  contact_details jsonb, -- Store method-specific details like phone numbers, email addresses
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_organization_contacts_referring ON public.organization_contacts(is_referring_contact) WHERE is_referring_contact = true;
CREATE INDEX idx_organization_contacts_primary_referrer ON public.organization_contacts(is_primary_referrer) WHERE is_primary_referrer = true;
CREATE INDEX idx_referring_relationships_organization ON public.referring_contact_relationships(organization_id);
CREATE INDEX idx_referring_relationships_contact ON public.referring_contact_relationships(contact_id);
CREATE INDEX idx_referring_relationships_active ON public.referring_contact_relationships(is_active) WHERE is_active = true;
CREATE INDEX idx_referrals_referring_contact ON public.referrals(referring_contact_id);
CREATE INDEX idx_referrer_performance_period ON public.referrer_performance_metrics(metric_period_start, metric_period_end);
CREATE INDEX idx_referrer_communication_type ON public.referrer_communication_preferences(communication_type);

-- Create function to update referrer performance metrics
CREATE OR REPLACE FUNCTION update_referrer_performance_metrics(
  contact_id_param uuid,
  period_start date,
  period_end date
)
RETURNS void AS $$
DECLARE
  total_refs integer := 0;
  accepted_refs integer := 0;
  admitted_refs integer := 0;
  avg_response_time numeric := 0.00;
  avg_admission_time numeric := 0.00;
BEGIN
  -- Calculate referral metrics for the period
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status NOT IN ('declined', 'lost', 'not_admitted_patient_choice', 'not_admitted_not_appropriate')),
    COUNT(*) FILTER (WHERE status IN ('admitted', 'admitted_our_hospice'))
  INTO total_refs, accepted_refs, admitted_refs
  FROM public.referrals
  WHERE referring_contact_id = contact_id_param
    AND referral_date >= period_start
    AND referral_date <= period_end;

  -- Calculate average response time (referral to first contact)
  SELECT AVG(EXTRACT(EPOCH FROM (contact_date - referral_date)) / 3600)
  INTO avg_response_time
  FROM public.referrals
  WHERE referring_contact_id = contact_id_param
    AND referral_date >= period_start
    AND referral_date <= period_end
    AND contact_date IS NOT NULL
    AND referral_date IS NOT NULL;

  -- Calculate average admission time (referral to admission)
  SELECT AVG(EXTRACT(EPOCH FROM (admission_date::timestamp - referral_date::timestamp)) / 3600)
  INTO avg_admission_time
  FROM public.referrals
  WHERE referring_contact_id = contact_id_param
    AND referral_date >= period_start
    AND referral_date <= period_end
    AND admission_date IS NOT NULL
    AND referral_date IS NOT NULL;

  -- Insert or update performance metrics
  INSERT INTO public.referrer_performance_metrics (
    contact_id,
    organization_id,
    metric_period_start,
    metric_period_end,
    total_referrals,
    accepted_referrals,
    admitted_referrals,
    average_response_time_hours,
    average_admission_time_hours
  )
  SELECT 
    contact_id_param,
    oc.organization_id,
    period_start,
    period_end,
    total_refs,
    accepted_refs,
    admitted_refs,
    COALESCE(avg_response_time, 0.00),
    COALESCE(avg_admission_time, 0.00)
  FROM public.organization_contacts oc
  WHERE oc.id = contact_id_param
  ON CONFLICT (contact_id, metric_period_start, metric_period_end) 
  DO UPDATE SET
    total_referrals = EXCLUDED.total_referrals,
    accepted_referrals = EXCLUDED.accepted_referrals,
    admitted_referrals = EXCLUDED.admitted_referrals,
    average_response_time_hours = EXCLUDED.average_response_time_hours,
    average_admission_time_hours = EXCLUDED.average_admission_time_hours,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Create function to get primary referrer for organization
CREATE OR REPLACE FUNCTION get_primary_referrer(org_id uuid)
RETURNS TABLE (
  contact_id uuid,
  contact_name text,
  title text,
  phone text,
  email text,
  specialization text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oc.id,
    oc.first_name || ' ' || oc.last_name,
    oc.title,
    oc.direct_phone,
    oc.email,
    oc.specialization
  FROM public.organization_contacts oc
  WHERE oc.organization_id = org_id
    AND oc.is_primary_referrer = true
    AND oc.is_referring_contact = true
  ORDER BY oc.relationship_strength DESC NULLS LAST
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to track referral attribution
CREATE OR REPLACE FUNCTION track_referral_attribution()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last referral date and volume for referring contact
  IF NEW.referring_contact_id IS NOT NULL THEN
    UPDATE public.organization_contacts
    SET 
      last_referral_date = COALESCE(NEW.referral_date, CURRENT_DATE),
      referral_volume_monthly = referral_volume_monthly + 1,
      referral_volume_ytd = referral_volume_ytd + 1,
      updated_at = now()
    WHERE id = NEW.referring_contact_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for referral attribution tracking
CREATE TRIGGER trigger_track_referral_attribution
  AFTER INSERT ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION track_referral_attribution();

-- Create function to reset monthly volumes (to be called monthly)
CREATE OR REPLACE FUNCTION reset_monthly_referral_volumes()
RETURNS void AS $$
BEGIN
  UPDATE public.organization_contacts
  SET 
    referral_volume_monthly = 0,
    updated_at = now()
  WHERE is_referring_contact = true;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security for new tables
ALTER TABLE public.referring_contact_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrer_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrer_communication_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view referring relationships" ON public.referring_contact_relationships
  FOR SELECT USING (true);
CREATE POLICY "Users can manage referring relationships" ON public.referring_contact_relationships
  FOR ALL USING (true);

CREATE POLICY "Users can view referrer performance" ON public.referrer_performance_metrics
  FOR SELECT USING (true);
CREATE POLICY "Users can manage referrer performance" ON public.referrer_performance_metrics
  FOR ALL USING (true);

CREATE POLICY "Users can view communication preferences" ON public.referrer_communication_preferences
  FOR SELECT USING (true);
CREATE POLICY "Users can manage communication preferences" ON public.referrer_communication_preferences
  FOR ALL USING (true);

-- Add constraints for data integrity
ALTER TABLE public.referring_contact_relationships
ADD CONSTRAINT unique_primary_referrer_per_org 
EXCLUDE (organization_id WITH =) 
WHERE (relationship_type = 'primary_referrer' AND is_active = true);

-- Add helpful comments
COMMENT ON TABLE public.referring_contact_relationships IS 'Manages complex referrer hierarchies and relationships within organizations';
COMMENT ON TABLE public.referrer_performance_metrics IS 'Tracks performance metrics for individual referrers over time';
COMMENT ON TABLE public.referrer_communication_preferences IS 'Stores communication preferences for each referrer by message type';
COMMENT ON COLUMN public.organization_contacts.is_referring_contact IS 'Indicates if this contact actively refers patients';
COMMENT ON COLUMN public.organization_contacts.is_primary_referrer IS 'Indicates if this is the primary referrer for the organization';
COMMENT ON FUNCTION get_primary_referrer IS 'Returns the primary referrer contact for a given organization';
COMMENT ON FUNCTION update_referrer_performance_metrics IS 'Updates performance metrics for a referrer over a specified period';
COMMENT ON FUNCTION reset_monthly_referral_volumes IS 'Resets monthly referral volume counters (run monthly)';