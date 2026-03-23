-- Add new columns for palliative outreach tracking
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS pcp_provider text;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS next_followup_date date;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS followup_frequency text DEFAULT 'monthly';
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS location_type text;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS location_city text;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS md_notified boolean DEFAULT false;

COMMENT ON COLUMN referrals.pcp_provider IS 'PCP provider following the patient (e.g., DoctorCare physician name)';
COMMENT ON COLUMN referrals.next_followup_date IS 'Next scheduled follow-up/outreach date';
COMMENT ON COLUMN referrals.followup_frequency IS 'Follow-up frequency: weekly, biweekly, monthly, as_needed';
COMMENT ON COLUMN referrals.location_type IS 'Patient location type: PH, GH, ALF, IL, SNF, MC, Other';
COMMENT ON COLUMN referrals.location_city IS 'City/area where patient is located';
COMMENT ON COLUMN referrals.md_notified IS 'Whether the attending MD has been notified of admission';