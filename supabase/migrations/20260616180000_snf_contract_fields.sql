
-- SNF contract and training tracking fields
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS contract_start_date date,
  ADD COLUMN IF NOT EXISTS contract_expiry_date date,
  ADD COLUMN IF NOT EXISTS contract_types text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS contract_notes text;

-- last_training_review already exists as text (we'll use it as a date string)
-- No changes needed to that column.
