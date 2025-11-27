
-- First, let's add document storage tables
CREATE TABLE public.patient_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  document_type TEXT, -- e.g., 'insurance_card', 'id', 'advanced_directive', 'dnr', 'medical_records'
  uploaded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.organization_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  document_type TEXT, -- e.g., 'contract', 'certification', 'contact_info'
  uploaded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add enhanced patient fields to existing patients table
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS ssn TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS weight INTEGER;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS attending_physician TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS responsible_party_name TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS responsible_party_contact TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS responsible_party_relationship TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS primary_insurance TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS secondary_insurance TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medicare_number TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medicaid_number TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS advanced_directive BOOLEAN DEFAULT false;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS dnr_status BOOLEAN DEFAULT false;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS funeral_arrangements TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS prior_hospice_info TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS caregiver_name TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS caregiver_contact TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS spiritual_preferences TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS dme_needs TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS transport_needs TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS special_medical_needs TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS msw_notes TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS upcoming_appointments TEXT;

-- Add enhanced referral fields
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referral_contact_person TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referral_contact_phone TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referral_contact_email TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS insurance_verification BOOLEAN DEFAULT false;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS medical_records_received BOOLEAN DEFAULT false;

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-documents', 'patient-documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('organization-documents', 'organization-documents', false) ON CONFLICT DO NOTHING;

-- Create storage policies for patient documents
CREATE POLICY "Authenticated users can upload patient documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'patient-documents');

CREATE POLICY "Authenticated users can view patient documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'patient-documents');

CREATE POLICY "Authenticated users can delete patient documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'patient-documents');

-- Create storage policies for organization documents
CREATE POLICY "Authenticated users can upload organization documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'organization-documents');

CREATE POLICY "Authenticated users can view organization documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'organization-documents');

CREATE POLICY "Authenticated users can delete organization documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'organization-documents');

-- Enable RLS on document tables
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for document tables (allowing all authenticated users for now)
CREATE POLICY "Authenticated users can manage patient documents" ON public.patient_documents
  FOR ALL USING (true);

CREATE POLICY "Authenticated users can manage organization documents" ON public.organization_documents
  FOR ALL USING (true);
