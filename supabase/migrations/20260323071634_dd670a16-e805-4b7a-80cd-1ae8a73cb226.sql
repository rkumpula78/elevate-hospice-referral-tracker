
CREATE TABLE public.referral_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  activity_type text NOT NULL DEFAULT 'other',
  note_text text NOT NULL DEFAULT '',
  next_action text,
  next_action_date date,
  created_by text NOT NULL DEFAULT 'Unknown',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view referral activities"
  ON public.referral_activity_log FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert referral activities"
  ON public.referral_activity_log FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete referral activities"
  ON public.referral_activity_log FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_referral_activity_log_referral_id ON public.referral_activity_log(referral_id);
CREATE INDEX idx_referral_activity_log_created_at ON public.referral_activity_log(created_at DESC);
