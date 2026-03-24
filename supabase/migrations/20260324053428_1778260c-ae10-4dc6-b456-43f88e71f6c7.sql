
-- Webhook configuration table
CREATE TABLE public.webhook_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL UNIQUE,
  webhook_url text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  last_triggered_at timestamptz,
  last_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage webhook config"
  ON public.webhook_config FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can read webhook config"
  ON public.webhook_config FOR SELECT TO authenticated
  USING (true);

-- Webhook logs table
CREATE TABLE public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL,
  http_status integer,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view webhook logs"
  ON public.webhook_logs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can insert webhook logs"
  ON public.webhook_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Seed initial config
INSERT INTO public.webhook_config (event_type, webhook_url, enabled)
VALUES
  ('new_referral', 'http://100.88.149.73:5678/webhook/new-referral', true),
  ('status_change', 'http://100.88.149.73:5678/webhook/status-change', true);

-- Trigger to update updated_at
CREATE TRIGGER update_webhook_config_updated_at
  BEFORE UPDATE ON public.webhook_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
