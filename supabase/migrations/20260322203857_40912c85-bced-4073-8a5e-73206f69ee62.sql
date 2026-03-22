ALTER TABLE public.whatsapp_conversation_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access" ON public.whatsapp_conversation_state
  FOR ALL TO authenticated
  USING (false) WITH CHECK (false);