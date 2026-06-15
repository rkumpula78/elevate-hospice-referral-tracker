
CREATE TABLE public.marketer_day_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_date date NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketer_day_notes_user_date ON public.marketer_day_notes(user_id, note_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketer_day_notes TO authenticated;
GRANT ALL ON public.marketer_day_notes TO service_role;

ALTER TABLE public.marketer_day_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own day notes"
ON public.marketer_day_notes FOR ALL
TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE TRIGGER update_marketer_day_notes_updated_at
BEFORE UPDATE ON public.marketer_day_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
