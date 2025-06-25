
-- First, let's see what the current check constraint allows
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'organization_contacts_role_in_referral_check';

-- If the constraint is too restrictive, let's drop it and create a more flexible one
ALTER TABLE organization_contacts 
DROP CONSTRAINT IF EXISTS organization_contacts_role_in_referral_check;

-- Create a more flexible constraint or remove it entirely since the form should handle validation
-- Let's make it more permissive to allow common roles
ALTER TABLE organization_contacts 
ADD CONSTRAINT organization_contacts_role_in_referral_check 
CHECK (role_in_referral IS NULL OR role_in_referral IN (
    'decision_maker', 'influencer', 'gatekeeper', 'user', 'primary_contact', 
    'secondary_contact', 'administrator', 'nurse', 'social_worker', 
    'physician', 'manager', 'director', 'coordinator', 'other'
));
