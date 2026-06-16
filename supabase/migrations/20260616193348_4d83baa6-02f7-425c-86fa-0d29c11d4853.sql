
-- Teams configuration: restrict to admins
DROP POLICY IF EXISTS "Authenticated users can manage teams configuration" ON public.teams_configuration;
CREATE POLICY "Admins can manage teams configuration"
  ON public.teams_configuration
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Webhook logs: restrict reads to admins (inserts continue via existing policy / service role)
DROP POLICY IF EXISTS "Authenticated users can view webhook logs" ON public.webhook_logs;
CREATE POLICY "Admins can view webhook logs"
  ON public.webhook_logs
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Patient attachments: require healthcare role
DROP POLICY IF EXISTS "Authenticated users can manage patient attachments" ON public.patient_attachments;
CREATE POLICY "Healthcare staff can manage patient attachments"
  ON public.patient_attachments
  FOR ALL TO authenticated
  USING (public.has_healthcare_access())
  WITH CHECK (public.has_healthcare_access());

-- Patient documents: require healthcare role
DROP POLICY IF EXISTS "Authenticated users can manage patient documents" ON public.patient_documents;
CREATE POLICY "Healthcare staff can manage patient documents"
  ON public.patient_documents
  FOR ALL TO authenticated
  USING (public.has_healthcare_access())
  WITH CHECK (public.has_healthcare_access());

-- Staff: restrict visibility to users with healthcare role (admins still covered by has_healthcare_access)
DROP POLICY IF EXISTS "Authenticated users can view staff" ON public.staff;
CREATE POLICY "Healthcare staff can view staff"
  ON public.staff
  FOR SELECT TO authenticated
  USING (public.has_healthcare_access());
