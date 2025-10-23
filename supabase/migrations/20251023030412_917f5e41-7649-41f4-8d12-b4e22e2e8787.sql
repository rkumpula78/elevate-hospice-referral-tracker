-- Create census_entries table
CREATE TABLE IF NOT EXISTS public.census_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  census_date DATE NOT NULL,
  patient_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_census_date UNIQUE (census_date)
);

-- Enable RLS
ALTER TABLE public.census_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - allow authenticated users to manage census entries
CREATE POLICY "Authenticated users can view census entries"
  ON public.census_entries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert census entries"
  ON public.census_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update census entries"
  ON public.census_entries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete census entries"
  ON public.census_entries
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_census_entries_updated_at
  BEFORE UPDATE ON public.census_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on census_date for faster lookups
CREATE INDEX idx_census_entries_date ON public.census_entries(census_date DESC);