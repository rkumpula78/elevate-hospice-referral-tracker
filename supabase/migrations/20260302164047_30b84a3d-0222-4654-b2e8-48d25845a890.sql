-- Remove unused/duplicate tables
-- "Elevate CRM" is an empty placeholder table with no references
DROP TABLE IF EXISTS public."Elevate CRM";

-- activity_log is a duplicate of activity_communications (which is the active table used throughout the app)
DROP TABLE IF EXISTS public.activity_log;