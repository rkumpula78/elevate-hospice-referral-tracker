
-- Migrate existing records to new simplified statuses
UPDATE public.referrals SET status = 'in_progress' WHERE status IN ('contact_attempted', 'information_gathering');
UPDATE public.referrals SET status = 'assessment' WHERE status = 'assessment_scheduled';
UPDATE public.referrals SET status = 'pending' WHERE status = 'pending_admission';
UPDATE public.referrals SET status = 'closed', closed_reason = 'patient_choice' WHERE status = 'not_admitted_patient_choice';
UPDATE public.referrals SET status = 'closed', closed_reason = 'not_appropriate' WHERE status = 'not_admitted_not_appropriate';
UPDATE public.referrals SET status = 'closed', closed_reason = 'lost_contact' WHERE status = 'not_admitted_lost_contact';
UPDATE public.referrals SET status = 'closed', closed_reason = 'deceased' WHERE status = 'deceased_prior_admission';
