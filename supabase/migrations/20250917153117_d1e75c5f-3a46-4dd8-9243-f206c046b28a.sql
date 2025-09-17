-- Add comprehensive contact fields to organization_contacts table
ALTER TABLE public.organization_contacts 
ADD COLUMN IF NOT EXISTS middle_name text,
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS professional_license text,
ADD COLUMN IF NOT EXISTS npi_number text,
ADD COLUMN IF NOT EXISTS fax_number text,
ADD COLUMN IF NOT EXISTS mailing_address text,
ADD COLUMN IF NOT EXISTS preferred_contact_method text DEFAULT 'email',
ADD COLUMN IF NOT EXISTS contact_type text,
ADD COLUMN IF NOT EXISTS relationship_to_patient text,
ADD COLUMN IF NOT EXISTS linked_organizations text[],
ADD COLUMN IF NOT EXISTS referral_history jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS referral_source_category text,
ADD COLUMN IF NOT EXISTS lead_source text,
ADD COLUMN IF NOT EXISTS assigned_owner text,
ADD COLUMN IF NOT EXISTS communication_log jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_contact_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS next_followup_date date,
ADD COLUMN IF NOT EXISTS consent_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS hipaa_compliance boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS credential_verification_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS affiliation_agreements boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS contact_stage text DEFAULT 'lead',
ADD COLUMN IF NOT EXISTS referral_conversion_rate numeric,
ADD COLUMN IF NOT EXISTS activity_log jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS marketing_preferences text[],
ADD COLUMN IF NOT EXISTS tags_categories text[],
ADD COLUMN IF NOT EXISTS specialty text,
ADD COLUMN IF NOT EXISTS areas_of_service text,
ADD COLUMN IF NOT EXISTS patient_population_served text,
ADD COLUMN IF NOT EXISTS preferred_hospital text,
ADD COLUMN IF NOT EXISTS relationship_notes text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_contacts_contact_type ON public.organization_contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_organization_contacts_contact_stage ON public.organization_contacts(contact_stage);
CREATE INDEX IF NOT EXISTS idx_organization_contacts_npi_number ON public.organization_contacts(npi_number);
CREATE INDEX IF NOT EXISTS idx_organization_contacts_last_contact_date ON public.organization_contacts(last_contact_date);
CREATE INDEX IF NOT EXISTS idx_organization_contacts_next_followup_date ON public.organization_contacts(next_followup_date);