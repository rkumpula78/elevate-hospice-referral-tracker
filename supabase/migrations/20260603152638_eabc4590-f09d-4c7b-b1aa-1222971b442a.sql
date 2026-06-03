INSERT INTO public.activity_templates (name, interaction_type, default_notes, default_duration_minutes, is_global)
VALUES
  ('Email Outreach', 'Email', 'Sent email follow-up', 5, true),
  ('Email Introduction', 'Email', 'Introductory email sent', 10, true)
ON CONFLICT DO NOTHING;