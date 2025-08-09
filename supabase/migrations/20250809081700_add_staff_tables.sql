-- Create the marketers table
CREATE TABLE public.marketers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the intake_coordinators table
CREATE TABLE public.intake_coordinators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the marketers table
INSERT INTO public.marketers (name) VALUES
('John Smith'),
('Sarah Johnson'),
('Mike Davis'),
('Lisa Wilson'),
('David Brown');

-- Seed the intake_coordinators table
INSERT INTO public.intake_coordinators (name) VALUES
('Maria Rodriguez'),
('Jennifer Thompson'),
('Robert Chen'),
('Amanda Williams'),
('Michael Foster');

-- Add comments to the new tables
COMMENT ON TABLE public.marketers IS 'Stores information about marketing staff.';
COMMENT ON TABLE public.intake_coordinators IS 'Stores information about referral intake coordinators.';
