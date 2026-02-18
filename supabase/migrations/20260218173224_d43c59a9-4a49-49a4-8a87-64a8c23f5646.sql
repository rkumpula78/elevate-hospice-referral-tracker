
-- Fix: Allow all authenticated users to read profiles (needed for marketer dropdowns)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Allow all authenticated users to SELECT profiles (names, emails for marketer assignment)
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create referral_eligibility table for Medicare eligibility data from NGS
CREATE TABLE public.referral_eligibility (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  
  -- Beneficiary info
  medicare_number text,
  mbi_term_date date,
  date_of_birth date,
  date_of_death date,
  sex text,
  beneficiary_address text,
  beneficiary_city text,
  beneficiary_state text,
  beneficiary_zip text,
  
  -- Part A entitlement
  part_a_entitlement_reason text,
  part_a_entitlement_date date,
  part_a_termination_date date,
  
  -- Part B entitlement
  part_b_entitlement_reason text,
  part_b_entitlement_date date,
  part_b_termination_date date,
  
  -- Benefit days remaining
  full_inpatient_days integer,
  copay_inpatient_days integer,
  inpatient_ded_amt_remaining numeric DEFAULT 0,
  full_snf_days integer,
  copay_snf_days integer,
  lifetime_psychiatric_days_remain integer,
  lifetime_reserve_days_remain integer,
  inpatient_blood_ded_units_remain numeric,
  
  -- Hospice info
  hospice_election_exists boolean DEFAULT false,
  hospice_election_notes text,
  
  -- Medicare Advantage
  medicare_advantage_active boolean DEFAULT false,
  medicare_advantage_notes text,
  
  -- MSP (Medicare Secondary Payer)
  msp_active boolean DEFAULT false,
  msp_notes text,
  
  -- Verification metadata
  eligibility_verified_date timestamptz,
  eligibility_verified_by text,
  verification_source text DEFAULT 'NGS',
  eligibility_span_start date,
  eligibility_span_end date,
  notes text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_eligibility ENABLE ROW LEVEL SECURITY;

-- Policies for referral_eligibility
CREATE POLICY "Authenticated users can view eligibility"
ON public.referral_eligibility FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert eligibility"
ON public.referral_eligibility FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update eligibility"
ON public.referral_eligibility FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete eligibility"
ON public.referral_eligibility FOR DELETE
USING (auth.role() = 'authenticated');
