-- Add partnership development fields to organizations table
ALTER TABLE public.organizations 
ADD COLUMN partnership_score numeric,
ADD COLUMN roi_calculation jsonb,
ADD COLUMN revenue_ytd numeric DEFAULT 0,
ADD COLUMN estimated_monthly_referrals integer,
ADD COLUMN geographic_alignment_score integer,
ADD COLUMN relationship_accessibility_score integer,
ADD COLUMN current_provider_satisfaction_score integer,
ADD COLUMN financial_stability_score integer,
ADD COLUMN cultural_alignment_score integer,
ADD COLUMN partnership_priority_level text DEFAULT 'medium',
ADD COLUMN research_completed boolean DEFAULT false,
ADD COLUMN decision_maker_name text,
ADD COLUMN decision_maker_title text,
ADD COLUMN decision_maker_phone text,
ADD COLUMN decision_maker_email text,
ADD COLUMN estimated_annual_revenue numeric,
ADD COLUMN competition_level text,
ADD COLUMN relationship_temperature text DEFAULT 'cold';

-- Create partnership agreements table
CREATE TABLE public.partnership_agreements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agreement_type text NOT NULL DEFAULT 'standard',
  status text NOT NULL DEFAULT 'draft',
  initial_term_months integer DEFAULT 12,
  auto_renewal boolean DEFAULT true,
  termination_notice_days integer DEFAULT 90,
  service_level_agreements jsonb,
  performance_metrics jsonb,
  volume_targets jsonb,
  financial_terms jsonb,
  communication_protocols jsonb,
  quality_standards jsonb,
  signed_date date,
  effective_date date,
  expiration_date date,
  created_by text,
  approved_by text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on partnership agreements
ALTER TABLE public.partnership_agreements ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for partnership agreements
CREATE POLICY "Authenticated users can manage partnership agreements" 
ON public.partnership_agreements 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create communication templates table
CREATE TABLE public.communication_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name text NOT NULL,
  template_type text NOT NULL, -- 'email', 'phone_script', 'follow_up'
  template_category text NOT NULL, -- 'cold_outreach', 'warm_introduction', 'follow_up', 'objection_handling'
  organization_type text, -- for targeting specific org types
  subject_line text,
  template_content text NOT NULL,
  variables jsonb, -- for dynamic content replacement
  usage_count integer DEFAULT 0,
  success_rate numeric,
  is_active boolean DEFAULT true,
  created_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on communication templates
ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for communication templates
CREATE POLICY "Authenticated users can manage communication templates" 
ON public.communication_templates 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create partnership performance metrics table
CREATE TABLE public.partnership_performance_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric_period_start date NOT NULL,
  metric_period_end date NOT NULL,
  total_referrals integer DEFAULT 0,
  accepted_referrals integer DEFAULT 0,
  average_admission_time_hours numeric,
  revenue_generated numeric DEFAULT 0,
  patient_satisfaction_score numeric,
  family_satisfaction_score numeric,
  partner_satisfaction_score numeric,
  communication_timeliness_score numeric,
  roi_ratio numeric,
  investment_costs numeric DEFAULT 0,
  performance_alerts jsonb,
  goals_met jsonb,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on partnership performance metrics
ALTER TABLE public.partnership_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for partnership performance metrics
CREATE POLICY "Authenticated users can manage partnership performance metrics" 
ON public.partnership_performance_metrics 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_partnership_agreements_updated_at
    BEFORE UPDATE ON public.partnership_agreements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_communication_templates_updated_at
    BEFORE UPDATE ON public.communication_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partnership_performance_metrics_updated_at
    BEFORE UPDATE ON public.partnership_performance_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample communication templates
INSERT INTO public.communication_templates (template_name, template_type, template_category, organization_type, subject_line, template_content, variables) VALUES
('Cold Email - Medical Groups', 'email', 'cold_outreach', 'medical_group', 'Partnership Opportunity - Elevate Hospice & Palliative Care', 
'Dear Dr. {{decision_maker_name}},

I hope this message finds you well. My name is {{sender_name}}, and I''m the {{sender_title}} at Elevate Hospice & Palliative Care, an ACHC-accredited hospice serving the Greater Phoenix area.

I''m reaching out because I understand {{organization_name}} provides exceptional care to {{patient_count}} patients across {{location_count}} locations, and I believe there may be valuable partnership opportunities between our organizations.

Why Elevate Hospice?
• ACHC accreditation with exceptional quality scores
• 24/7 on-call physician coverage with Dr. Joel Cohen, MD
• Same-day admission capability when clinically appropriate
• Comprehensive palliative care services
• Seamless referral process and regular communication

I would appreciate the opportunity to meet with you for 20 minutes to discuss how we can support your patients and your practice.

Would next Tuesday or Wednesday work for a brief conversation?

Best regards,
{{sender_name}}', 
'{"decision_maker_name": "", "sender_name": "", "sender_title": "", "organization_name": "", "patient_count": "", "location_count": ""}'),

('Follow-up Email #1', 'email', 'follow_up', null, 'Following up on Partnership Discussion - Elevate Hospice', 
'Dear Dr. {{decision_maker_name}},

I wanted to follow up on my previous message regarding partnership opportunities between {{organization_name}} and Elevate Hospice.

I''ve attached a brief overview of our services and quality outcomes. I think you''ll find our patient satisfaction scores and clinical outcomes particularly relevant.

I remain available for a brief conversation at your convenience.

Best regards,
{{sender_name}}', 
'{"decision_maker_name": "", "sender_name": "", "organization_name": ""}'),

('Phone Script - Initial Cold Call', 'phone_script', 'cold_outreach', null, null,
'Opening (First 30 seconds):
"Hello, this is {{sender_name}} from Elevate Hospice & Palliative Care. I''m calling to speak with Dr. {{decision_maker_name}} about a potential partnership opportunity. Is he/she available for a brief conversation?"

If Decision Maker is Available:
"Dr. {{decision_maker_name}}, thank you for taking my call. I''ll be very brief. We''re an ACHC-accredited hospice serving Greater Phoenix, and I''ve been researching medical groups that might benefit from a responsive, physician-focused hospice partner.

I understand your practice serves {{patient_count}} patients, and you likely encounter situations where hospice care could benefit your patients and families. Our unique value is our rapid response time and physician-to-physician communication model.

Would you be interested in a 20-minute meeting where I can share how we''ve helped similar practices improve patient care while reducing administrative burden?"',
'{"sender_name": "", "decision_maker_name": "", "patient_count": ""}');

-- Add indexes for better performance
CREATE INDEX idx_partnership_agreements_org_id ON public.partnership_agreements(organization_id);
CREATE INDEX idx_partnership_agreements_status ON public.partnership_agreements(status);
CREATE INDEX idx_communication_templates_type ON public.communication_templates(template_type);
CREATE INDEX idx_communication_templates_category ON public.communication_templates(template_category);
CREATE INDEX idx_partnership_performance_org_id ON public.partnership_performance_metrics(organization_id);
CREATE INDEX idx_partnership_performance_period ON public.partnership_performance_metrics(metric_period_start, metric_period_end);