
-- Add deleted_at to patients if not exists (for soft-delete)
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_patients_deleted_at ON public.patients(deleted_at);

-- Promote Bethany Odenbrett & Jodie Ramsey to admin
INSERT INTO public.user_roles (user_id, role)
VALUES
  ('b1057a58-9e99-4d06-9276-0435d603dffd', 'admin'),
  ('3da8b92a-8b9e-4972-9b41-605db069c231', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Audit log entries
INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, details)
VALUES
  (NULL, 'assign_admin_role', 'b1057a58-9e99-4d06-9276-0435d603dffd', '{"name":"Bethany Odenbrett","granted_via":"system_migration"}'::jsonb),
  (NULL, 'assign_admin_role', '3da8b92a-8b9e-4972-9b41-605db069c231', '{"name":"Jodie Ramsey","granted_via":"system_migration"}'::jsonb);
