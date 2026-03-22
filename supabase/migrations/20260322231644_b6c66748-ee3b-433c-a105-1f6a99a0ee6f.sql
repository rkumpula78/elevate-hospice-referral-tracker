-- 1. care_team_assignments: Drop public policies
DROP POLICY IF EXISTS "Allow all operations on care_team_assignments" ON care_team_assignments;
DROP POLICY IF EXISTS "Service role full access on care_team_assignments" ON care_team_assignments;

-- 2. compliance_metrics: Replace public with authenticated
DROP POLICY IF EXISTS "Allow all operations on compliance_metrics" ON compliance_metrics;
CREATE POLICY "Authenticated users can manage compliance metrics"
  ON compliance_metrics FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 3. organization_contacts: Replace public with authenticated
DROP POLICY IF EXISTS "Users can view organization contacts" ON organization_contacts;
DROP POLICY IF EXISTS "Users can create organization contacts" ON organization_contacts;
DROP POLICY IF EXISTS "Users can update organization contacts" ON organization_contacts;
DROP POLICY IF EXISTS "Users can delete organization contacts" ON organization_contacts;
CREATE POLICY "Authenticated users can view organization contacts"
  ON organization_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create organization contacts"
  ON organization_contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update organization contacts"
  ON organization_contacts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete organization contacts"
  ON organization_contacts FOR DELETE TO authenticated USING (true);

-- 4. organization_documents: Replace public with authenticated
DROP POLICY IF EXISTS "Authenticated users can manage organization documents" ON organization_documents;
CREATE POLICY "Authenticated users can manage organization documents"
  ON organization_documents FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 5. patient_documents: Replace public with authenticated
DROP POLICY IF EXISTS "Authenticated users can manage patient documents" ON patient_documents;
CREATE POLICY "Authenticated users can manage patient documents"
  ON patient_documents FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 6. organizations: Drop public ALL policy (authenticated policies exist)
DROP POLICY IF EXISTS "Allow all operations on organizations" ON organizations;

-- 7. referral_status_history: Drop public policies (authenticated policies exist)
DROP POLICY IF EXISTS "Authenticated users can insert status history" ON referral_status_history;
DROP POLICY IF EXISTS "Authenticated users can view status history" ON referral_status_history;

-- 8. teams_notifications: Drop public policies (authenticated ALL policy exists)
DROP POLICY IF EXISTS "Authenticated users can create teams notifications" ON teams_notifications;
DROP POLICY IF EXISTS "Authenticated users can update teams notifications" ON teams_notifications;
DROP POLICY IF EXISTS "Authenticated users can view teams notifications" ON teams_notifications;

-- 9. teams_configuration: Drop public SELECT (authenticated ALL policy exists)
DROP POLICY IF EXISTS "Authenticated users can view teams configuration" ON teams_configuration;

-- 10. profiles: Prevent role column self-update (privilege escalation fix)
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role IS NOT DISTINCT FROM (SELECT p.role FROM profiles p WHERE p.id = auth.uid()));