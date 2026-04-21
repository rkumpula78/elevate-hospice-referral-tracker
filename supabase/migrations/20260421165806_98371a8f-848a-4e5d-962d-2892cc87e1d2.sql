-- Add assigned_marketer to patients and backfill from referrals
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS assigned_marketer text;

UPDATE public.patients p
SET assigned_marketer = r.assigned_marketer
FROM public.referrals r
WHERE p.referral_id = r.id
  AND p.assigned_marketer IS NULL
  AND r.assigned_marketer IS NOT NULL;

-- Update admission trigger function to also copy assigned_marketer onto the patient record
CREATE OR REPLACE FUNCTION public.handle_referral_admission()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only fire when status changes TO 'admitted'
  IF NEW.status = 'admitted' AND (OLD.status IS NULL OR OLD.status != 'admitted') THEN
    -- Check if patient already exists for this referral
    IF NOT EXISTS (SELECT 1 FROM patients WHERE referral_id = NEW.id) THEN
      INSERT INTO patients (
        referral_id, first_name, last_name, address, phone,
        diagnosis, insurance, status, admission_date,
        emergency_contact, emergency_phone, physician,
        primary_insurance, secondary_insurance,
        medicare_number, medicaid_number,
        advanced_directive, dnr_status,
        responsible_party_name, responsible_party_contact,
        responsible_party_relationship,
        caregiver_name, caregiver_contact,
        spiritual_preferences, dme_needs,
        transport_needs, special_medical_needs,
        notes, ssn, height, weight,
        attending_physician, msw_notes,
        upcoming_appointments, funeral_arrangements,
        prior_hospice_info, assigned_marketer
      ) VALUES (
        NEW.id,
        COALESCE(NEW.first_name, split_part(NEW.patient_name, ' ', 1)),
        COALESCE(NEW.last_name, CASE WHEN position(' ' in COALESCE(NEW.patient_name,'')) > 0 THEN substring(NEW.patient_name from position(' ' in NEW.patient_name) + 1) ELSE '' END),
        NEW.address, COALESCE(NEW.phone, NEW.patient_phone),
        NEW.diagnosis, NEW.insurance, 'active', NOW(),
        NEW.emergency_contact, NEW.emergency_phone, NEW.physician,
        NEW.primary_insurance, NEW.secondary_insurance,
        NEW.medicare_number, NEW.medicaid_number,
        NEW.advanced_directive, NEW.dnr_status,
        NEW.responsible_party_name, NEW.responsible_party_contact,
        NEW.responsible_party_relationship,
        NEW.caregiver_name, NEW.caregiver_contact,
        NEW.spiritual_preferences, NEW.dme_needs,
        NEW.transport_needs, NEW.special_medical_needs,
        NEW.notes, NEW.ssn, NEW.height, NEW.weight,
        NEW.attending_physician, NEW.msw_notes,
        NEW.upcoming_appointments, NEW.funeral_arrangements,
        NEW.prior_hospice_info, NEW.assigned_marketer
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Keep patient.assigned_marketer in sync when the referral's marketer changes
CREATE OR REPLACE FUNCTION public.sync_patient_marketer_from_referral()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.assigned_marketer IS DISTINCT FROM OLD.assigned_marketer THEN
    UPDATE public.patients
       SET assigned_marketer = NEW.assigned_marketer
     WHERE referral_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_patient_marketer_from_referral_trg ON public.referrals;
CREATE TRIGGER sync_patient_marketer_from_referral_trg
AFTER UPDATE OF assigned_marketer ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.sync_patient_marketer_from_referral();