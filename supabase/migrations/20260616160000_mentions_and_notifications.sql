
-- Mentions + in-app notifications for the unified referral update feed

-- 1. Track which app users were @mentioned in an activity log note
ALTER TABLE public.referral_activity_log
  ADD COLUMN IF NOT EXISTS mentioned_user_ids uuid[] NOT NULL DEFAULT '{}';

-- 2. In-app notifications inbox (one row per recipient)
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'mention',
  referral_id uuid REFERENCES public.referrals(id) ON DELETE CASCADE,
  activity_log_id uuid REFERENCES public.referral_activity_log(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '',
  actor_email text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Recipients can only see and update their own notifications
CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Fan-out trigger: when an activity is logged with mentions, create one
--    notification per mentioned user (skipping the author). SECURITY DEFINER
--    lets it write notification rows that belong to other users.
CREATE OR REPLACE FUNCTION public.fan_out_mention_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentioned_id uuid;
  mentioned_email text;
BEGIN
  IF NEW.mentioned_user_ids IS NULL OR array_length(NEW.mentioned_user_ids, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  FOREACH mentioned_id IN ARRAY NEW.mentioned_user_ids LOOP
    SELECT email INTO mentioned_email FROM public.profiles WHERE id = mentioned_id;

    -- Skip self-mentions (author mentioning themselves)
    IF mentioned_email IS NOT DISTINCT FROM NEW.created_by THEN
      CONTINUE;
    END IF;

    INSERT INTO public.notifications (user_id, type, referral_id, activity_log_id, message, actor_email)
    VALUES (
      mentioned_id,
      'mention',
      NEW.referral_id,
      NEW.id,
      left(NEW.note_text, 200),
      NEW.created_by
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_activity_mention
AFTER INSERT ON public.referral_activity_log
FOR EACH ROW
EXECUTE FUNCTION public.fan_out_mention_notifications();
