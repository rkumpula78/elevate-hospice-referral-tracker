ALTER TABLE public.whatsapp_notification_queue ENABLE ROW LEVEL SECURITY;

-- Block all client access; this table is managed by edge functions using the service role
CREATE POLICY "No public access" ON public.whatsapp_notification_queue
  FOR ALL TO authenticated
  USING (false) WITH CHECK (false);