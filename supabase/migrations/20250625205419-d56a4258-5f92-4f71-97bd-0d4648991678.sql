
-- Update the referral_status enum to include the new detailed status values
ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'new_referral';
ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'contact_attempted';
ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'information_gathering';
ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'assessment_scheduled';
ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'pending_admission';
ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'not_admitted_patient_choice';
ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'not_admitted_not_appropriate';
ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'not_admitted_lost_contact';
ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'deceased_prior_admission';
