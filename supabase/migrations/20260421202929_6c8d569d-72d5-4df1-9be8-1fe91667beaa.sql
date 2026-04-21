ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS teams_message_id text;
COMMENT ON COLUMN public.referrals.teams_message_id IS 'Microsoft Teams message ID returned when the referral notification was first posted, used for threading replies/updates.';
NOTIFY pgrst, 'reload schema';