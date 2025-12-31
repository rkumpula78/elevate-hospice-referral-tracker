-- Add F2F (Face-to-Face) and Benefit Period tracking functionality
-- This migration adds comprehensive tracking for hospice benefit periods and F2F visit requirements

-- Add benefit period tracking to referrals table
ALTER TABLE public.referrals 
ADD COLUMN benefit_period_start date,
ADD COLUMN benefit_period_end date, 
ADD COLUMN benefit_period_number integer DEFAULT 1,
ADD COLUMN days_in_current_period integer;

-- Add F2F tracking fields to visits table  
ALTER TABLE public.visits
ADD COLUMN f2f_required boolean DEFAULT false,
ADD COLUMN f2f_type text CHECK (f2f_type IN ('initial', 'recertification', 'change_of_condition')),
ADD COLUMN certification_period text,
ADD COLUMN f2f_deadline date,
ADD COLUMN physician_order_date date,
ADD COLUMN f2f_completed boolean DEFAULT false,
ADD COLUMN f2f_completed_date date;

-- Create F2F requirements tracking table
CREATE TABLE public.f2f_requirements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  benefit_period_number integer NOT NULL,
  f2f_type text NOT NULL CHECK (f2f_type IN ('initial', 'recertification', 'change_of_condition')),
  required_by_date date NOT NULL,
  completed_date date,
  physician_name text,
  visit_id uuid REFERENCES public.visits(id),
  certification_days integer DEFAULT 60, -- 60, 90, or subsequent 60-day periods
  is_overdue boolean GENERATED ALWAYS AS (completed_date IS NULL AND required_by_date < CURRENT_DATE) STORED,
  days_until_due integer GENERATED ALWAYS AS (EXTRACT(days FROM (required_by_date - CURRENT_DATE))) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_f2f_requirements_referral_id ON public.f2f_requirements(referral_id);
CREATE INDEX idx_f2f_requirements_required_by_date ON public.f2f_requirements(required_by_date);
CREATE INDEX idx_f2f_requirements_overdue ON public.f2f_requirements(is_overdue) WHERE is_overdue = true;
CREATE INDEX idx_visits_f2f_required ON public.visits(f2f_required) WHERE f2f_required = true;
CREATE INDEX idx_visits_f2f_deadline ON public.visits(f2f_deadline) WHERE f2f_deadline IS NOT NULL;

-- Create function to calculate benefit period from admission date
CREATE OR REPLACE FUNCTION calculate_benefit_period(admission_date date, target_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (
  period_number integer,
  period_start date,
  period_end date,
  days_elapsed integer,
  certification_days integer
) AS $$
DECLARE
  days_since_admission integer;
  current_period integer := 1;
  period_start_date date := admission_date;
  period_end_date date;
BEGIN
  days_since_admission := target_date - admission_date;
  
  -- First period is 60 days
  IF days_since_admission <= 60 THEN
    period_end_date := admission_date + interval '60 days';
    RETURN QUERY SELECT current_period, period_start_date, period_end_date, days_since_admission, 60;
    RETURN;
  END IF;
  
  -- Second period is 90 days (days 61-150)
  IF days_since_admission <= 150 THEN
    current_period := 2;
    period_start_date := admission_date + interval '61 days';
    period_end_date := admission_date + interval '150 days';
    RETURN QUERY SELECT current_period, period_start_date, period_end_date, (days_since_admission - 60), 90;
    RETURN;
  END IF;
  
  -- Subsequent periods are 60 days each
  current_period := 3 + ((days_since_admission - 150) / 60);
  period_start_date := admission_date + interval '150 days' + ((current_period - 3) * interval '60 days');
  period_end_date := period_start_date + interval '60 days';
  
  RETURN QUERY SELECT current_period, period_start_date, period_end_date, 
                      (days_since_admission - (150 + ((current_period - 3) * 60))), 60;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically create F2F requirements when referral is admitted
CREATE OR REPLACE FUNCTION create_f2f_requirements_for_admission()
RETURNS TRIGGER AS $$
DECLARE
  benefit_period RECORD;
  f2f_deadline_date date;
BEGIN
  -- Only create F2F requirements if status changed to admitted and we have an admission date
  IF NEW.status IN ('admitted', 'admitted_our_hospice') 
     AND OLD.status != NEW.status 
     AND NEW.admission_date IS NOT NULL THEN
    
    -- Get the current benefit period
    SELECT * INTO benefit_period 
    FROM calculate_benefit_period(NEW.admission_date::date);
    
    -- Calculate F2F deadline (must be completed before end of benefit period)
    f2f_deadline_date := benefit_period.period_end - interval '5 days'; -- 5 day buffer
    
    -- Create initial F2F requirement
    INSERT INTO public.f2f_requirements (
      referral_id,
      benefit_period_number,
      f2f_type,
      required_by_date,
      certification_days
    ) VALUES (
      NEW.id,
      benefit_period.period_number,
      'initial',
      f2f_deadline_date,
      benefit_period.certification_days
    );
    
    -- Update referral with benefit period info
    NEW.benefit_period_start := benefit_period.period_start;
    NEW.benefit_period_end := benefit_period.period_end;
    NEW.benefit_period_number := benefit_period.period_number;
    NEW.days_in_current_period := benefit_period.days_elapsed;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic F2F requirement creation
CREATE TRIGGER trigger_create_f2f_requirements_on_admission
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION create_f2f_requirements_for_admission();

-- Create function to update benefit period information daily
CREATE OR REPLACE FUNCTION update_benefit_periods()
RETURNS void AS $$
DECLARE
  referral_record RECORD;
  benefit_period RECORD;
BEGIN
  -- Update all active referrals with current benefit period information
  FOR referral_record IN 
    SELECT id, admission_date 
    FROM public.referrals 
    WHERE status IN ('admitted', 'admitted_our_hospice') 
    AND admission_date IS NOT NULL
  LOOP
    -- Calculate current benefit period
    SELECT * INTO benefit_period 
    FROM calculate_benefit_period(referral_record.admission_date::date);
    
    -- Update referral with current benefit period info
    UPDATE public.referrals 
    SET 
      benefit_period_start = benefit_period.period_start,
      benefit_period_end = benefit_period.period_end,
      benefit_period_number = benefit_period.period_number,
      days_in_current_period = benefit_period.days_elapsed,
      updated_at = now()
    WHERE id = referral_record.id;
    
    -- Create new F2F requirement if entering a new benefit period
    IF NOT EXISTS (
      SELECT 1 FROM public.f2f_requirements 
      WHERE referral_id = referral_record.id 
      AND benefit_period_number = benefit_period.period_number
    ) THEN
      INSERT INTO public.f2f_requirements (
        referral_id,
        benefit_period_number,
        f2f_type,
        required_by_date,
        certification_days
      ) VALUES (
        referral_record.id,
        benefit_period.period_number,
        CASE 
          WHEN benefit_period.period_number = 1 THEN 'initial'
          ELSE 'recertification'
        END,
        benefit_period.period_end - interval '5 days',
        benefit_period.certification_days
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS) for new tables
ALTER TABLE public.f2f_requirements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for f2f_requirements table
CREATE POLICY "Users can view all F2F requirements" ON public.f2f_requirements
  FOR SELECT USING (true);

CREATE POLICY "Users can insert F2F requirements" ON public.f2f_requirements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update F2F requirements" ON public.f2f_requirements
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete F2F requirements" ON public.f2f_requirements
  FOR DELETE USING (true);

-- Add helpful comments
COMMENT ON TABLE public.f2f_requirements IS 'Tracks Face-to-Face visit requirements based on Medicare benefit periods';
COMMENT ON COLUMN public.f2f_requirements.f2f_type IS 'Type of F2F visit required: initial, recertification, or change_of_condition';
COMMENT ON COLUMN public.f2f_requirements.certification_days IS 'Number of days in this certification period (60, 90, or 60 for subsequent periods)';
COMMENT ON FUNCTION calculate_benefit_period IS 'Calculates which benefit period a patient is in based on admission date';
COMMENT ON FUNCTION create_f2f_requirements_for_admission IS 'Automatically creates F2F requirements when a referral is admitted';
COMMENT ON FUNCTION update_benefit_periods IS 'Updates benefit period information for all active patients (run daily)';