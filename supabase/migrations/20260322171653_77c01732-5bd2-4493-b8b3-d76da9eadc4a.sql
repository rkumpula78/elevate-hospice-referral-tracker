
-- Fix remaining tables that failed due to duplicate policy name

-- teams_configuration: drop existing and recreate
DROP POLICY IF EXISTS "Authenticated users can manage teams configuration" ON teams_configuration;
CREATE POLICY "Authenticated users can manage teams configuration"
ON teams_configuration FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- teams_notifications
DROP POLICY IF EXISTS "Allow all operations on teams_notifications" ON teams_notifications;
DROP POLICY IF EXISTS "Authenticated users can manage teams notifications" ON teams_notifications;
CREATE POLICY "Authenticated users can manage teams notifications"
ON teams_notifications FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- referral_status_history
DROP POLICY IF EXISTS "Allow all operations on referral_status_history" ON referral_status_history;
DROP POLICY IF EXISTS "Allow insert on referral_status_history" ON referral_status_history;
DROP POLICY IF EXISTS "Authenticated users can view referral status history" ON referral_status_history;
DROP POLICY IF EXISTS "Authenticated users can insert referral status history" ON referral_status_history;
CREATE POLICY "Authenticated users can view referral status history"
ON referral_status_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert referral status history"
ON referral_status_history FOR INSERT TO authenticated WITH CHECK (true);
