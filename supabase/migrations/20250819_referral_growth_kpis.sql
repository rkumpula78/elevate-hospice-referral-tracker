-- Referral Growth KPI Tracking System
-- Based on Trella Health's 10 Essential KPIs for PAC Sales Leaders

-- Enhanced organization fields for better segmentation and tracking
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS segment_type TEXT CHECK (segment_type IN ('hospital', 'snf', 'alf', 'physician', 'home_health', 'other')),
ADD COLUMN IF NOT EXISTS visit_frequency_requirement TEXT CHECK (visit_frequency_requirement IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
ADD COLUMN IF NOT EXISTS last_visit_date DATE,
ADD COLUMN IF NOT EXISTS next_scheduled_visit DATE,
ADD COLUMN IF NOT EXISTS account_tier TEXT DEFAULT 'C' CHECK (account_tier IN ('A', 'B', 'C', 'P')),
ADD COLUMN IF NOT EXISTS potential_monthly_referrals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_monthly_referrals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS territory_id UUID,
ADD COLUMN IF NOT EXISTS drive_time_minutes INTEGER;

-- Event tracking for leading indicators
CREATE TABLE IF NOT EXISTS sales_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  marketer_name TEXT NOT NULL,
  event_type TEXT CHECK (event_type IN ('in_person', 'virtual', 'phone', 'email', 'event', 'training')),
  event_date DATE NOT NULL,
  duration_minutes INTEGER,
  contacts_engaged INTEGER DEFAULT 1,
  referrals_generated INTEGER DEFAULT 0,
  notes TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rep performance tracking
CREATE TABLE IF NOT EXISTS rep_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marketer_name TEXT NOT NULL,
  period_date DATE NOT NULL,
  period_type TEXT CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  
  -- Leading indicators
  events_completed INTEGER DEFAULT 0,
  events_goal INTEGER DEFAULT 50, -- Weekly goal
  unique_accounts_visited INTEGER DEFAULT 0,
  
  -- Lagging indicators
  referrals_generated INTEGER DEFAULT 0,
  referrals_goal INTEGER DEFAULT 0,
  admissions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  
  -- Account management
  total_assigned_accounts INTEGER DEFAULT 0,
  a_accounts INTEGER DEFAULT 0,
  b_accounts INTEGER DEFAULT 0,
  c_accounts INTEGER DEFAULT 0,
  
  -- Time management
  total_drive_time_minutes INTEGER DEFAULT 0,
  total_visit_time_minutes INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(marketer_name, period_date, period_type)
);

-- Coaching events tracking
CREATE TABLE IF NOT EXISTS coaching_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marketer_name TEXT NOT NULL,
  coach_name TEXT NOT NULL,
  coaching_date DATE NOT NULL,
  coaching_type TEXT CHECK (coaching_type IN ('field_coaching', 'pto_management', 'performance_review', 'skill_development')),
  focus_areas TEXT[],
  action_items TEXT,
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Segment mix tracking
CREATE TABLE IF NOT EXISTS segment_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_date DATE NOT NULL,
  segment_type TEXT NOT NULL,
  
  -- Volume metrics
  total_referrals INTEGER DEFAULT 0,
  total_admissions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  
  -- Account metrics
  active_accounts INTEGER DEFAULT 0,
  new_accounts_added INTEGER DEFAULT 0,
  
  -- Payer mix within segment
  medicare_count INTEGER DEFAULT 0,
  medicaid_count INTEGER DEFAULT 0,
  commercial_count INTEGER DEFAULT 0,
  other_payer_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(period_date, segment_type)
);

-- Territory management
CREATE TABLE IF NOT EXISTS territories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  territory_name TEXT NOT NULL,
  marketer_name TEXT,
  zip_codes TEXT[],
  counties TEXT[],
  total_accounts INTEGER DEFAULT 0,
  active_accounts INTEGER DEFAULT 0,
  monthly_referral_goal INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visit scheduling and alerts
CREATE TABLE IF NOT EXISTS visit_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  marketer_name TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  visit_type TEXT CHECK (visit_type IN ('routine', 'urgent', 'introduction', 'training', 'event')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  completed_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Account scoring for prioritization
CREATE TABLE IF NOT EXISTS account_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Scoring factors
  referral_volume_score INTEGER DEFAULT 0, -- Based on potential
  conversion_rate_score INTEGER DEFAULT 0, -- Historical conversion
  relationship_score INTEGER DEFAULT 0, -- Engagement level
  growth_potential_score INTEGER DEFAULT 0, -- Untapped opportunity
  strategic_value_score INTEGER DEFAULT 0, -- Strategic importance
  
  total_score INTEGER GENERATED ALWAYS AS (
    referral_volume_score + conversion_rate_score + relationship_score + 
    growth_potential_score + strategic_value_score
  ) STORED,
  
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_events_org ON sales_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_events_marketer ON sales_events(marketer_name);
CREATE INDEX IF NOT EXISTS idx_sales_events_date ON sales_events(event_date);
CREATE INDEX IF NOT EXISTS idx_rep_performance_marketer ON rep_performance(marketer_name);
CREATE INDEX IF NOT EXISTS idx_rep_performance_date ON rep_performance(period_date);
CREATE INDEX IF NOT EXISTS idx_coaching_events_marketer ON coaching_events(marketer_name);
CREATE INDEX IF NOT EXISTS idx_visit_schedule_org ON visit_schedule(organization_id);
CREATE INDEX IF NOT EXISTS idx_visit_schedule_date ON visit_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_territories_marketer ON territories(marketer_name);

-- Enable RLS on new tables
ALTER TABLE sales_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rep_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_scores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can manage sales events" 
  ON sales_events FOR ALL TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage rep performance" 
  ON rep_performance FOR ALL TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage coaching events" 
  ON coaching_events FOR ALL TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage segment performance" 
  ON segment_performance FOR ALL TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage territories" 
  ON territories FOR ALL TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage visit schedule" 
  ON visit_schedule FOR ALL TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage account scores" 
  ON account_scores FOR ALL TO authenticated 
  USING (true) WITH CHECK (true);

-- Function to calculate visit frequency compliance
CREATE OR REPLACE FUNCTION calculate_visit_compliance()
RETURNS TABLE (
  organization_id UUID,
  organization_name TEXT,
  required_frequency TEXT,
  last_visit DATE,
  days_since_visit INTEGER,
  is_compliant BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.visit_frequency_requirement,
    o.last_visit_date,
    CASE 
      WHEN o.last_visit_date IS NULL THEN 999
      ELSE (CURRENT_DATE - o.last_visit_date)::INTEGER
    END as days_since_visit,
    CASE
      WHEN o.visit_frequency_requirement = 'weekly' AND (CURRENT_DATE - o.last_visit_date) <= 7 THEN true
      WHEN o.visit_frequency_requirement = 'biweekly' AND (CURRENT_DATE - o.last_visit_date) <= 14 THEN true
      WHEN o.visit_frequency_requirement = 'monthly' AND (CURRENT_DATE - o.last_visit_date) <= 30 THEN true
      WHEN o.visit_frequency_requirement = 'quarterly' AND (CURRENT_DATE - o.last_visit_date) <= 90 THEN true
      ELSE false
    END as is_compliant
  FROM organizations o
  WHERE o.is_active = true
    AND o.visit_frequency_requirement IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rep performance metrics
CREATE OR REPLACE FUNCTION update_rep_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily performance
  INSERT INTO rep_performance (
    marketer_name,
    period_date,
    period_type,
    events_completed,
    referrals_generated
  )
  VALUES (
    NEW.marketer_name,
    NEW.event_date,
    'daily',
    1,
    NEW.referrals_generated
  )
  ON CONFLICT (marketer_name, period_date, period_type)
  DO UPDATE SET
    events_completed = rep_performance.events_completed + 1,
    referrals_generated = rep_performance.referrals_generated + NEW.referrals_generated;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic performance tracking
DROP TRIGGER IF EXISTS update_rep_performance_trigger ON sales_events;
CREATE TRIGGER update_rep_performance_trigger
AFTER INSERT ON sales_events
FOR EACH ROW
EXECUTE FUNCTION update_rep_performance();