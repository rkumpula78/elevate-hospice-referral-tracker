-- Update RLS policies on referrals table to allow all authenticated users

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Healthcare staff can insert referrals" ON referrals;
DROP POLICY IF EXISTS "Healthcare staff can update referrals" ON referrals;
DROP POLICY IF EXISTS "Healthcare staff can delete referrals" ON referrals;
DROP POLICY IF EXISTS "Healthcare staff can view referrals" ON referrals;

-- Create new policies for all authenticated users
CREATE POLICY "Authenticated users can insert referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update referrals"
  ON referrals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete referrals"
  ON referrals FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (true);