-- Add benefit_period_number column to referrals table
ALTER TABLE referrals 
ADD COLUMN benefit_period_number integer DEFAULT 1;

-- Update existing records to have benefit period 1
UPDATE referrals 
SET benefit_period_number = 1 
WHERE benefit_period_number IS NULL;