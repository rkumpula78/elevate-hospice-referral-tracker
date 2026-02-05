-- Allow deleting users without breaking audit history by nulling references

ALTER TABLE public.admin_audit_log
  ALTER COLUMN admin_user_id DROP NOT NULL;

-- Drop existing restrictive FKs
ALTER TABLE public.admin_audit_log
  DROP CONSTRAINT IF EXISTS admin_audit_log_admin_user_id_fkey;

ALTER TABLE public.admin_audit_log
  DROP CONSTRAINT IF EXISTS admin_audit_log_target_user_id_fkey;

-- Recreate FKs with ON DELETE SET NULL
ALTER TABLE public.admin_audit_log
  ADD CONSTRAINT admin_audit_log_admin_user_id_fkey
  FOREIGN KEY (admin_user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

ALTER TABLE public.admin_audit_log
  ADD CONSTRAINT admin_audit_log_target_user_id_fkey
  FOREIGN KEY (target_user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;
