
-- Create referral_status_history table
CREATE TABLE public.referral_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by text,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text
);

-- Enable RLS
ALTER TABLE public.referral_status_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view status history"
ON public.referral_status_history
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert status history"
ON public.referral_status_history
FOR INSERT
WITH CHECK (true);

-- Index for fast lookups by referral
CREATE INDEX idx_referral_status_history_referral_id ON public.referral_status_history(referral_id);
CREATE INDEX idx_referral_status_history_changed_at ON public.referral_status_history(changed_at);

-- Trigger function to auto-insert history on status change
CREATE OR REPLACE FUNCTION public.track_referral_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.referral_status_history (referral_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.assigned_marketer);
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to referrals table
CREATE TRIGGER on_referral_status_change
AFTER UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.track_referral_status_change();
