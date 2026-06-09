
-- Bidirectional sync of shared fields between referrals and patients
-- Ensures information entered or updated in one place propagates to the other.
-- Uses pg_trigger_depth() to prevent infinite recursion between the two triggers.

CREATE OR REPLACE FUNCTION public.sync_referral_to_patient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  UPDATE public.patients SET
    first_name = COALESCE(NEW.first_name, first_name),
    middle_name = COALESCE(NEW.middle_name, middle_name),
    last_name = COALESCE(NEW.last_name, last_name),
    date_of_birth = COALESCE(NEW.date_of_birth, date_of_birth),
    address = COALESCE(NEW.address, address),
    phone = COALESCE(NEW.phone, NEW.patient_phone, phone),
    ssn = COALESCE(NEW.ssn, ssn),
    height = COALESCE(NEW.height, height),
    weight = COALESCE(NEW.weight, weight),
    diagnosis = COALESCE(NEW.diagnosis, diagnosis),
    insurance = COALESCE(NEW.insurance, insurance),
    primary_insurance = COALESCE(NEW.primary_insurance, primary_insurance),
    secondary_insurance = COALESCE(NEW.secondary_insurance, secondary_insurance),
    medicare_number = COALESCE(NEW.medicare_number, medicare_number),
    medicaid_number = COALESCE(NEW.medicaid_number, medicaid_number),
    physician = COALESCE(NEW.physician, physician),
    attending_physician = COALESCE(NEW.attending_physician, attending_physician),
    advanced_directive = COALESCE(NEW.advanced_directive, advanced_directive),
    dnr_status = COALESCE(NEW.dnr_status, dnr_status),
    emergency_contact = COALESCE(NEW.emergency_contact, emergency_contact),
    emergency_phone = COALESCE(NEW.emergency_phone, emergency_phone),
    responsible_party_name = COALESCE(NEW.responsible_party_name, responsible_party_name),
    responsible_party_contact = COALESCE(NEW.responsible_party_contact, responsible_party_contact),
    responsible_party_relationship = COALESCE(NEW.responsible_party_relationship, responsible_party_relationship),
    caregiver_name = COALESCE(NEW.caregiver_name, caregiver_name),
    caregiver_contact = COALESCE(NEW.caregiver_contact, caregiver_contact),
    spiritual_preferences = COALESCE(NEW.spiritual_preferences, spiritual_preferences),
    dme_needs = COALESCE(NEW.dme_needs, dme_needs),
    transport_needs = COALESCE(NEW.transport_needs, transport_needs),
    special_medical_needs = COALESCE(NEW.special_medical_needs, special_medical_needs),
    msw_notes = COALESCE(NEW.msw_notes, msw_notes),
    upcoming_appointments = COALESCE(NEW.upcoming_appointments, upcoming_appointments),
    funeral_arrangements = COALESCE(NEW.funeral_arrangements, funeral_arrangements),
    prior_hospice_info = COALESCE(NEW.prior_hospice_info, prior_hospice_info),
    assigned_marketer = COALESCE(NEW.assigned_marketer, assigned_marketer),
    admission_date = COALESCE(NEW.admission_date, admission_date),
    updated_at = NOW()
  WHERE referral_id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_patient_to_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.referral_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.referrals SET
    first_name = COALESCE(NEW.first_name, first_name),
    middle_name = COALESCE(NEW.middle_name, middle_name),
    last_name = COALESCE(NEW.last_name, last_name),
    date_of_birth = COALESCE(NEW.date_of_birth, date_of_birth),
    address = COALESCE(NEW.address, address),
    phone = COALESCE(NEW.phone, phone),
    patient_phone = COALESCE(NEW.phone, patient_phone),
    ssn = COALESCE(NEW.ssn, ssn),
    height = COALESCE(NEW.height, height),
    weight = COALESCE(NEW.weight, weight),
    diagnosis = COALESCE(NEW.diagnosis, diagnosis),
    insurance = COALESCE(NEW.insurance, insurance),
    primary_insurance = COALESCE(NEW.primary_insurance, primary_insurance),
    secondary_insurance = COALESCE(NEW.secondary_insurance, secondary_insurance),
    medicare_number = COALESCE(NEW.medicare_number, medicare_number),
    medicaid_number = COALESCE(NEW.medicaid_number, medicaid_number),
    physician = COALESCE(NEW.physician, physician),
    attending_physician = COALESCE(NEW.attending_physician, attending_physician),
    advanced_directive = COALESCE(NEW.advanced_directive, advanced_directive),
    dnr_status = COALESCE(NEW.dnr_status, dnr_status),
    emergency_contact = COALESCE(NEW.emergency_contact, emergency_contact),
    emergency_phone = COALESCE(NEW.emergency_phone, emergency_phone),
    responsible_party_name = COALESCE(NEW.responsible_party_name, responsible_party_name),
    responsible_party_contact = COALESCE(NEW.responsible_party_contact, responsible_party_contact),
    responsible_party_relationship = COALESCE(NEW.responsible_party_relationship, responsible_party_relationship),
    caregiver_name = COALESCE(NEW.caregiver_name, caregiver_name),
    caregiver_contact = COALESCE(NEW.caregiver_contact, caregiver_contact),
    spiritual_preferences = COALESCE(NEW.spiritual_preferences, spiritual_preferences),
    dme_needs = COALESCE(NEW.dme_needs, dme_needs),
    transport_needs = COALESCE(NEW.transport_needs, transport_needs),
    special_medical_needs = COALESCE(NEW.special_medical_needs, special_medical_needs),
    msw_notes = COALESCE(NEW.msw_notes, msw_notes),
    upcoming_appointments = COALESCE(NEW.upcoming_appointments, upcoming_appointments),
    funeral_arrangements = COALESCE(NEW.funeral_arrangements, funeral_arrangements),
    prior_hospice_info = COALESCE(NEW.prior_hospice_info, prior_hospice_info),
    assigned_marketer = COALESCE(NEW.assigned_marketer, assigned_marketer),
    admission_date = COALESCE(NEW.admission_date, admission_date),
    updated_at = NOW()
  WHERE id = NEW.referral_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_referral_to_patient_trg ON public.referrals;
CREATE TRIGGER sync_referral_to_patient_trg
AFTER UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.sync_referral_to_patient();

DROP TRIGGER IF EXISTS sync_patient_to_referral_trg ON public.patients;
CREATE TRIGGER sync_patient_to_referral_trg
AFTER UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.sync_patient_to_referral();
