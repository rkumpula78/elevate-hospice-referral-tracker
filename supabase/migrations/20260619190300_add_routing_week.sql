-- Explicit routing week (1-4) for the "My Route This Week" planner.
-- Previously the week was parsed out of free-text partnership_notes ("Week N"),
-- which was unreliable. This gives each org an explicit, editable routing week.
-- NULL means "not assigned to a specific week".

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS routing_week SMALLINT CHECK (routing_week BETWEEN 1 AND 4);
