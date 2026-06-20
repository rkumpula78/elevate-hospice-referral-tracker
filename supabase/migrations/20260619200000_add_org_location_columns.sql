-- Structured location columns for the Territory Map (filter/sort by city, state, zip).
-- Organizations only had a free-text `address`; these let us filter/sort reliably.
-- Populated automatically by the geocode-address edge function on create/edit,
-- and via a one-time backfill for existing rows. Idempotent via IF NOT EXISTS.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS zip_code TEXT;
