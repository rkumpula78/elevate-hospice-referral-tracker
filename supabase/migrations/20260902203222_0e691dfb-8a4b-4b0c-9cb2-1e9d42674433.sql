
REVOKE ALL ON FUNCTION public.find_matching_patient(text, text, date, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_matching_patient(text, text, date, text, uuid) TO authenticated, service_role;

CREATE OR REPLACE VIEW public.v_patient_duplicate_candidates
WITH (security_invoker = true) AS
SELECT
  a.id AS patient_id_a,
  b.id AS patient_id_b,
  a.first_name AS first_name_a,
  b.first_name AS first_name_b,
  a.last_name,
  a.date_of_birth AS dob_a,
  b.date_of_birth AS dob_b,
  a.referral_id AS referral_id_a,
  b.referral_id AS referral_id_b,
  a.created_at AS created_at_a,
  b.created_at AS created_at_b
FROM public.patients a
JOIN public.patients b
  ON a.id < b.id
 AND lower(btrim(coalesce(a.last_name,''))) = lower(btrim(coalesce(b.last_name,'')))
 AND lower(btrim(coalesce(a.last_name,''))) <> ''
 AND (
   lower(btrim(coalesce(a.first_name,''))) = lower(btrim(coalesce(b.first_name,'')))
   OR left(lower(btrim(coalesce(a.first_name,''))),1) = left(lower(btrim(coalesce(b.first_name,''))),1)
 )
 AND (a.date_of_birth IS NULL OR b.date_of_birth IS NULL OR a.date_of_birth = b.date_of_birth)
WHERE a.deleted_at IS NULL AND b.deleted_at IS NULL;

GRANT SELECT ON public.v_patient_duplicate_candidates TO authenticated;
