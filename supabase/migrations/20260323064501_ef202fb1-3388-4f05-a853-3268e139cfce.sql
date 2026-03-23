-- Add RLS policies for activity_communications table
CREATE POLICY "Authenticated users can view activity communications"
  ON activity_communications FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert activity communications"
  ON activity_communications FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update activity communications"
  ON activity_communications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete activity communications"
  ON activity_communications FOR DELETE TO authenticated USING (true);