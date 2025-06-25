
-- Fix the organization_contacts table to allow insertions by making organization_id not nullable
-- and adding proper RLS policies
ALTER TABLE organization_contacts 
ALTER COLUMN organization_id SET NOT NULL;

-- Add RLS policies for organization_contacts
CREATE POLICY "Users can view organization contacts" 
  ON organization_contacts 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create organization contacts" 
  ON organization_contacts 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update organization contacts" 
  ON organization_contacts 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete organization contacts" 
  ON organization_contacts 
  FOR DELETE 
  USING (true);

-- Fix organizations table constraint issues by making sure required fields handle null properly
-- Update the organizations table to handle the constraint issue seen in the screenshot
ALTER TABLE organizations 
ALTER COLUMN name SET DEFAULT '';

-- Make sure all existing organizations have non-null names
UPDATE organizations SET name = 'Unnamed Organization' WHERE name IS NULL;
