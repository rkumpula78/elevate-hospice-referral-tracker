
-- Create a table to store hospice referral submissions
CREATE TABLE public.hospice_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Referring Information
  physician_name TEXT NOT NULL,
  referring_facility TEXT NOT NULL,
  
  -- Patient Information
  patient_name TEXT NOT NULL,
  date_of_birth DATE,
  primary_diagnosis TEXT NOT NULL,
  medicare_number TEXT,
  insurance_provider TEXT,
  patient_address TEXT,
  
  -- Medical Information
  advance_directives TEXT,
  primary_care_physician TEXT,
  
  -- Contact Information
  contact_email TEXT,
  contact_phone TEXT,
  primary_caregiver TEXT,
  
  -- Additional Information
  additional_comments TEXT,
  
  -- Metadata
  submission_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create an index on submission_date for faster queries
CREATE INDEX idx_hospice_referrals_submission_date ON public.hospice_referrals(submission_date DESC);

-- Create an index on patient_name for searching
CREATE INDEX idx_hospice_referrals_patient_name ON public.hospice_referrals(patient_name);

-- Add Row Level Security (RLS) - for now, allow all operations since this is a referral form
-- In production, you might want to restrict access based on your needs
ALTER TABLE public.hospice_referrals ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert referrals (public form submission)
CREATE POLICY "Anyone can submit hospice referrals" 
  ON public.hospice_referrals 
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Create policy to allow authenticated users to view referrals
CREATE POLICY "Authenticated users can view hospice referrals" 
  ON public.hospice_referrals 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to update referrals
CREATE POLICY "Authenticated users can update hospice referrals" 
  ON public.hospice_referrals 
  FOR UPDATE 
  TO authenticated
  USING (true);
