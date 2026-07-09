ALTER TABLE public.patient_documents
  ADD COLUMN IF NOT EXISTS referral_id uuid REFERENCES public.referrals(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS patient_documents_referral_id_idx
  ON public.patient_documents(referral_id);

ALTER TABLE public.patient_documents
  DROP CONSTRAINT IF EXISTS patient_documents_patient_or_referral_chk;
ALTER TABLE public.patient_documents
  ADD CONSTRAINT patient_documents_patient_or_referral_chk
  CHECK (patient_id IS NOT NULL OR referral_id IS NOT NULL);