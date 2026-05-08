
-- 1) webhook_config: restrict SELECT to admins
DROP POLICY IF EXISTS "Authenticated users can read webhook config" ON public.webhook_config;
CREATE POLICY "Admins can read webhook config" ON public.webhook_config
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- 2) teams_notifications: drop legacy dreamlit policy and restrict ALL policy to admins
DROP POLICY IF EXISTS "dreamlit_dreamlit_app_select_policy" ON public.teams_notifications;
DROP POLICY IF EXISTS "Authenticated users can manage teams notifications" ON public.teams_notifications;
CREATE POLICY "Admins can manage teams notifications" ON public.teams_notifications
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 3) staff: hide email column from non-admin authenticated users via column-level grants
REVOKE SELECT ON public.staff FROM authenticated;
GRANT SELECT (id, name, role, phone, is_active, created_at, updated_at) ON public.staff TO authenticated;
-- Admins still get full access via the existing "Admins can manage staff" ALL policy.

-- 4) story_submissions: scope SELECT to submitter or admin
DROP POLICY IF EXISTS "Users can view own submissions" ON public.story_submissions;
CREATE POLICY "Users can view own submissions" ON public.story_submissions
  FOR SELECT TO authenticated
  USING (
    submitted_by = (auth.jwt() ->> 'email')
    OR public.is_admin(auth.uid())
  );

-- 5) patient-attachments storage: require healthcare access, add UPDATE policy
DROP POLICY IF EXISTS "Authenticated users can view patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete patient attachments" ON storage.objects;

CREATE POLICY "Healthcare staff can view patient attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'patient-attachments' AND public.has_healthcare_access());

CREATE POLICY "Healthcare staff can upload patient attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'patient-attachments' AND public.has_healthcare_access());

CREATE POLICY "Healthcare staff can update patient attachments" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'patient-attachments' AND public.has_healthcare_access())
  WITH CHECK (bucket_id = 'patient-attachments' AND public.has_healthcare_access());

CREATE POLICY "Healthcare staff can delete patient attachments" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'patient-attachments' AND public.has_healthcare_access());

-- 6) Convert v_bd_weekly_dashboard view to SECURITY INVOKER
ALTER VIEW public.v_bd_weekly_dashboard SET (security_invoker = true);

-- 7) Set search_path on remaining SECURITY DEFINER functions
ALTER FUNCTION public.get_dashboard_stats() SET search_path = public;
ALTER FUNCTION public.get_kpi_metrics() SET search_path = public;
ALTER FUNCTION public.notify_status_change() SET search_path = public;
ALTER FUNCTION public.notify_new_referral() SET search_path = public;
ALTER FUNCTION public.handle_referral_admission() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_activity_communications_updated_at() SET search_path = public;
ALTER FUNCTION public.update_organization_last_contact() SET search_path = public;
ALTER FUNCTION public.update_account_last_visit() SET search_path = public;
ALTER FUNCTION public.update_org_last_contact() SET search_path = public;
ALTER FUNCTION public.get_org_name(uuid) SET search_path = public;
ALTER FUNCTION public.dreamlit_auth_users_trigger_fn() SET search_path = public;

-- 8) Revoke EXECUTE on internal trigger / notification / dreamlit functions from public/anon/authenticated
REVOKE EXECUTE ON FUNCTION public.notify_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_referral() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_referral_admission() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_activity_communications_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_organization_last_contact() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_account_last_visit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_org_last_contact() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.dreamlit_auth_users_trigger_fn() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.dreamlit_auth_admin_executor(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_patient_marketer_from_referral() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.track_referral_status_change() FROM PUBLIC, anon, authenticated;

-- Restrict get_org_name and dashboard RPCs to authenticated only
REVOKE EXECUTE ON FUNCTION public.get_org_name(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_kpi_metrics() FROM PUBLIC, anon;

-- 9) realtime.messages: restrict open dreamlit policy and require authenticated context
DROP POLICY IF EXISTS "dreamlit_dreamlit_app_select_policy" ON realtime.messages;
