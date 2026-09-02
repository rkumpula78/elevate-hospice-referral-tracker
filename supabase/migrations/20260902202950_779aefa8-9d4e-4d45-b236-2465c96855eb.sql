
-- 1) Reusable matcher: find an existing, non-deleted patient that looks like this person
CREATE OR REPLACE FUNCTION public.find_matching_patient(
  _first_name text,
  _last_name text,
  _dob date DEFAULT NULL,
  _phone text DEFAULT NULL,
  _exclude_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM public.patients p
  WHERE p.deleted_at IS NULL
    AND (_exclude_id IS NULL OR p.id <> _exclude_id)
    AND lower(btrim(coalesce(p.last_name,''))) = lower(btrim(coalesce(_last_name,'')))
    AND lower(btrim(coalesce(p.last_name,''))) <> ''
    AND (
      lower(btrim(coalesce(p.first_name,''))) = lower(btrim(coalesce(_first_name,'')))
      OR left(lower(btrim(coalesce(p.first_name,''))),1) = left(lower(btrim(coalesce(_first_name,''))),1)
    )
    AND (
      _dob IS NULL OR p.date_of_birth IS NULL OR p.date_of_birth = _dob
    )
  ORDER BY
    (p.date_of_birth IS NOT NULL AND _dob IS NOT NULL AND p.date_of_birth = _dob) DESC,
    (regexp_replace(coalesce(p.phone,''),'\D','','g') <> ''
      AND regexp_replace(coalesce(p.phone,''),'\D','','g') = regexp_replace(coalesce(_phone,''),'\D','','g')) DESC,
    (lower(btrim(coalesce(p.first_name,''))) = lower(btrim(coalesce(_first_name,'')))) DESC,
    p.created_at ASC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_matching_patient(text, text, date, text, uuid) TO authenticated, service_role;

-- 2) One patient per referral
CREATE UNIQUE INDEX IF NOT EXISTS patients_referral_id_unique
  ON public.patients (referral_id) WHERE referral_id IS NOT NULL;

-- 3) Admission trigger: link-or-insert, and cover all admitted_* statuses
CREATE OR REPLACE FUNCTION public.handle_referral_admission()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_first text;
  v_last text;
  v_match uuid;
BEGIN
  IF NEW.status::text LIKE 'admitted%'
     AND (OLD.status IS NULL OR OLD.status::text NOT LIKE 'admitted%') THEN

    IF EXISTS (SELECT 1 FROM patients WHERE referral_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    v_first := COALESCE(NEW.first_name, split_part(NEW.patient_name, ' ', 1));
    v_last := COALESCE(
      NEW.last_name,
      CASE WHEN position(' ' in COALESCE(NEW.patient_name,'')) > 0
           THEN substring(NEW.patient_name from position(' ' in NEW.patient_name) + 1)
           ELSE '' END
    );

    v_match := public.find_matching_patient(
      v_first, v_last, NEW.date_of_birth, COALESCE(NEW.phone, NEW.patient_phone)
    );

    IF v_match IS NOT NULL THEN
      -- Adopt the existing record instead of creating a duplicate
      UPDATE patients p SET
        referral_id = NEW.id,
        first_name = COALESCE(NULLIF(btrim(p.first_name),''), v_first),
        last_name = COALESCE(NULLIF(btrim(p.last_name),''), v_last),
        date_of_birth = COALESCE(p.date_of_birth, NEW.date_of_birth),
        address = COALESCE(NULLIF(btrim(p.address),''), NEW.address),
        phone = COALESCE(NULLIF(btrim(p.phone),''), NEW.phone, NEW.patient_phone),
        diagnosis = COALESCE(NULLIF(btrim(p.diagnosis),''), NEW.diagnosis),
        insurance = COALESCE(NULLIF(btrim(p.insurance),''), NEW.insurance),
        primary_insurance = COALESCE(NULLIF(btrim(p.primary_insurance),''), NEW.primary_insurance),
        secondary_insurance = COALESCE(NULLIF(btrim(p.secondary_insurance),''), NEW.secondary_insurance),
        medicare_number = COALESCE(NULLIF(btrim(p.medicare_number),''), NEW.medicare_number),
        medicaid_number = COALESCE(NULLIF(btrim(p.medicaid_number),''), NEW.medicaid_number),
        physician = COALESCE(NULLIF(btrim(p.physician),''), NEW.physician),
        attending_physician = COALESCE(NULLIF(btrim(p.attending_physician),''), NEW.attending_physician),
        emergency_contact = COALESCE(NULLIF(btrim(p.emergency_contact),''), NEW.emergency_contact),
        emergency_phone = COALESCE(NULLIF(btrim(p.emergency_phone),''), NEW.emergency_phone),
        responsible_party_name = COALESCE(NULLIF(btrim(p.responsible_party_name),''), NEW.responsible_party_name),
        responsible_party_contact = COALESCE(NULLIF(btrim(p.responsible_party_contact),''), NEW.responsible_party_contact),
        responsible_party_relationship = COALESCE(NULLIF(btrim(p.responsible_party_relationship),''), NEW.responsible_party_relationship),
        assigned_marketer = COALESCE(NULLIF(btrim(p.assigned_marketer),''), NEW.assigned_marketer),
        admission_date = COALESCE(p.admission_date, NOW()),
        status = CASE WHEN p.status::text IN ('discharged','deceased','transferred') THEN p.status ELSE 'active'::patient_status END
      WHERE p.id = v_match;

      RETURN NEW;
    END IF;

    INSERT INTO patients (
      referral_id, first_name, last_name, date_of_birth, address, phone,
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
      NEW.id, v_first, v_last, NEW.date_of_birth,
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
  RETURN NEW;
END;
$function$;
