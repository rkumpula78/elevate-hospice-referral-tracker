-- Fix visits table to reference referrals instead of patients
-- This allows scheduling visits for referrals that haven't been admitted yet

-- First drop the existing foreign key constraint
ALTER TABLE public.visits 
DROP CONSTRAINT IF EXISTS visits_patient_id_fkey;

-- Add new column for referral_id
ALTER TABLE public.visits 
ADD COLUMN IF NOT EXISTS referral_id UUID REFERENCES public.referrals(id);

-- Copy any existing patient_id references to referral_id by looking up the referral
-- (This assumes patients were created from referrals)
UPDATE public.visits v
SET referral_id = p.referral_id
FROM public.patients p
WHERE v.patient_id = p.id
AND v.referral_id IS NULL;

-- Now we can drop the patient_id column since we're using referral_id
ALTER TABLE public.visits 
DROP COLUMN IF EXISTS patient_id;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_visits_referral ON public.visits(referral_id);

-- Update the RLS policy name to reflect the change
DROP POLICY IF EXISTS "Authenticated users can manage visits" ON public.visits;
CREATE POLICY "Authenticated users can manage visits" ON public.visits 
FOR ALL TO authenticated USING (true) WITH CHECK (true);
