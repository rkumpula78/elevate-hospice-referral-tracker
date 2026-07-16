-- Drop the third-party Dreamlit trigger attached to auth.users first
DROP TRIGGER IF EXISTS dreamlit_auth_users_trigger ON auth.users;

-- Drop the trigger function that fires on auth.users changes
DROP FUNCTION IF EXISTS dreamlit_auth_users_trigger_fn();

-- Drop the dangerous Dreamlit admin executor that runs arbitrary SQL as admin
DROP FUNCTION IF EXISTS dreamlit_auth_admin_executor(text);
DROP FUNCTION IF EXISTS dreamlit_auth_admin_executor();