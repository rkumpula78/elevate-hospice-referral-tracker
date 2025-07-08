-- Create census_entries table for manual census tracking
CREATE TABLE IF NOT EXISTS public.census_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  census_date DATE NOT NULL,
  patient_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(census_date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_census_date ON public.census_entries(census_date DESC);

-- Enable RLS
ALTER TABLE public.census_entries ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Authenticated users can manage census entries" 
ON public.census_entries 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create a function to get the latest census
CREATE OR REPLACE FUNCTION get_latest_census()
RETURNS TABLE(census_date DATE, patient_count INTEGER)
LANGUAGE sql
STABLE
AS $$
  SELECT census_date, patient_count
  FROM public.census_entries
  ORDER BY census_date DESC
  LIMIT 1;
$$; 