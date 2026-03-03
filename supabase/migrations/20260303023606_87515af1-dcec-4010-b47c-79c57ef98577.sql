
-- Create activity_templates table
CREATE TABLE public.activity_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  default_notes TEXT,
  default_duration_minutes INTEGER DEFAULT 15,
  is_global BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_templates ENABLE ROW LEVEL SECURITY;

-- Users can view global templates + their own
CREATE POLICY "Users can view global and own templates"
ON public.activity_templates
FOR SELECT
TO authenticated
USING (is_global = true OR user_id = auth.uid());

-- Users can create their own templates
CREATE POLICY "Users can create own templates"
ON public.activity_templates
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND is_global = false);

-- Users can update their own templates
CREATE POLICY "Users can update own templates"
ON public.activity_templates
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND is_global = false);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates"
ON public.activity_templates
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND is_global = false);

-- Pre-populate global templates (user_id is null for global)
INSERT INTO public.activity_templates (name, interaction_type, default_notes, default_duration_minutes, is_global)
VALUES
  ('Quick Drop-In Visit', 'Visit', 'Brief check-in with staff', 15, true),
  ('Lunch & Learn', 'Presentation', 'Educational presentation', 45, true),
  ('Phone Check-In', 'Call', 'Phone follow-up', 10, true),
  ('Care Conference', 'Meeting', 'Attended care conference', 30, true),
  ('Marketing Drop-Off', 'Visit', 'Delivered marketing materials', 10, true);
