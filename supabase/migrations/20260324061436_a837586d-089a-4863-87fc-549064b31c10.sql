
-- Add staff_type column to profiles for filtering in dropdowns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS staff_type text DEFAULT 'marketer';

-- Add a comment for clarity
COMMENT ON COLUMN public.profiles.staff_type IS 'Staff type for dropdown filtering: marketer, intake_coordinator, admin';
