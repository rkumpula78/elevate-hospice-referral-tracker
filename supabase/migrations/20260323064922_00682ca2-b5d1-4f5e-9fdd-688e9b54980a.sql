-- Add referring_contact_name column for internal context only
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referring_contact_name text;

-- Comment for compliance documentation
COMMENT ON COLUMN referrals.referring_contact_name IS 'Internal context only: clinician/contact name at referring org. NOT for reports or dashboards per Anti-Kickback compliance.';

-- Data migration: normalize referral_source free-text to organization links
-- Step 1: Map known referral sources to organizations and extract contact names

-- DoctorCare variations
UPDATE referrals r
SET 
  organization_id = COALESCE(r.organization_id, o.id),
  referring_contact_name = CASE 
    WHEN r.referral_source ~ '\s*[-–—]\s*' THEN trim(split_part(r.referral_source, '-', 2))
    ELSE r.referring_contact_name
  END
FROM organizations o
WHERE o.name ILIKE '%DoctorCare%' OR o.name ILIKE '%Doctor Care%'
  AND r.organization_id IS NULL
  AND (
    r.referral_source ILIKE '%doctor care%' 
    OR r.referral_source ILIKE '%doctorcare%' 
    OR r.referral_source ILIKE '%dr care%'
    OR r.referral_source ILIKE '%dr. care%'
  );

-- Caring for Families
UPDATE referrals r
SET 
  organization_id = COALESCE(r.organization_id, o.id),
  referring_contact_name = CASE 
    WHEN r.referral_source ~ '\s*[-–—]\s*' THEN trim(split_part(r.referral_source, '-', 2))
    ELSE r.referring_contact_name
  END
FROM organizations o
WHERE o.name ILIKE '%Caring for Families%'
  AND r.organization_id IS NULL
  AND r.referral_source ILIKE '%caring for families%';

-- City of Phx / Phoenix
UPDATE referrals r
SET 
  organization_id = COALESCE(r.organization_id, o.id),
  referring_contact_name = CASE 
    WHEN r.referral_source ~ '\s*[-–—]\s*' THEN trim(split_part(r.referral_source, '-', 2))
    ELSE r.referring_contact_name
  END
FROM organizations o
WHERE (o.name ILIKE '%City of Ph%' OR o.name ILIKE '%City of Phoenix%')
  AND r.organization_id IS NULL
  AND (r.referral_source ILIKE '%city of ph%' OR r.referral_source ILIKE '%city of phoenix%');

-- Phx FD / Phoenix Fire Department
UPDATE referrals r
SET 
  organization_id = COALESCE(r.organization_id, o.id),
  referring_contact_name = CASE 
    WHEN r.referral_source ~ '\s*[-–—]\s*' THEN trim(split_part(r.referral_source, '-', 2))
    ELSE r.referring_contact_name
  END
FROM organizations o
WHERE (o.name ILIKE '%Phx FD%' OR o.name ILIKE '%Phoenix Fire%')
  AND r.organization_id IS NULL
  AND (r.referral_source ILIKE '%phx fd%' OR r.referral_source ILIKE '%phoenix fire%');

-- Home Matters
UPDATE referrals r
SET 
  organization_id = COALESCE(r.organization_id, o.id),
  referring_contact_name = CASE 
    WHEN r.referral_source ~ '\s*[-–—]\s*' THEN trim(split_part(r.referral_source, '-', 2))
    ELSE r.referring_contact_name
  END
FROM organizations o
WHERE o.name ILIKE '%Home Matters%'
  AND r.organization_id IS NULL
  AND r.referral_source ILIKE '%home matters%';

-- Generic: for any remaining referral_source with a dash, extract the contact name portion
UPDATE referrals
SET referring_contact_name = trim(split_part(referral_source, '-', 2))
WHERE referral_source ~ '\s*[-–—]\s*'
  AND referring_contact_name IS NULL
  AND length(trim(split_part(referral_source, '-', 2))) > 0;