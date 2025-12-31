-- Marketing Growth Management Enhancement
-- Focused on marketing-controllable metrics and strategic planning

-- Add growth tracking fields to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS monthly_referral_goal INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quarterly_referral_goal INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_month_referrals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_quarter_referrals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ytd_referrals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS growth_status TEXT CHECK (growth_status IN ('on_track', 'at_risk', 'behind', 'exceeding')),
ADD COLUMN IF NOT EXISTS growth_notes TEXT,
ADD COLUMN IF NOT EXISTS last_goal_review_date DATE,
ADD COLUMN IF NOT EXISTS prospect_stage TEXT CHECK (prospect_stage IN ('identified', 'researching', 'initial_contact', 'building_relationship', 'active_referrer')),
ADD COLUMN IF NOT EXISTS target_reason TEXT,
ADD COLUMN IF NOT EXISTS initial_contact_strategy TEXT,
ADD COLUMN IF NOT EXISTS ninety_day_goal INTEGER;

-- Create strategic actions table for account-level planning
CREATE TABLE IF NOT EXISTS strategic_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  action_title TEXT NOT NULL,
  action_description TEXT,
  action_type TEXT CHECK (action_type IN ('lunch_learn', 'training', 'meeting', 'event', 'follow_up', 'relationship_building', 'other')),
  assigned_to TEXT NOT NULL,
  due_date DATE,
  expected_outcome TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  completion_date DATE,
  result_notes TEXT,
  impact_on_referrals INTEGER, -- Actual referrals attributed to this action
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Create marketing programs table for differentiation initiatives
CREATE TABLE IF NOT EXISTS marketing_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_name TEXT NOT NULL,
  program_type TEXT CHECK (program_type IN ('training', 'event', 'service_enhancement', 'community_outreach', 'clinical_program', 'other')),
  description TEXT,
  target_segment TEXT[], -- Array of organization types
  success_metric TEXT,
  target_value INTEGER,
  actual_value INTEGER,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'paused')),
  start_date DATE,
  end_date DATE,
  owner TEXT,
  budget DECIMAL(10, 2),
  roi_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create program participation tracking
CREATE TABLE IF NOT EXISTS program_participation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES marketing_programs(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  participation_date DATE,
  participant_count INTEGER,
  feedback TEXT,
  referrals_generated INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(program_id, organization_id, participation_date)
);

-- Create barriers and countermeasures table
CREATE TABLE IF NOT EXISTS marketing_barriers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barrier_type TEXT CHECK (barrier_type IN ('relationship', 'competition', 'process', 'clinical', 'operational', 'communication', 'other')),
  barrier_description TEXT NOT NULL,
  impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  affected_organizations UUID[], -- Array of organization IDs
  identified_date DATE DEFAULT CURRENT_DATE,
  countermeasure TEXT,
  countermeasure_owner TEXT,
  countermeasure_due_date DATE,
  status TEXT DEFAULT 'identified' CHECK (status IN ('identified', 'addressing', 'resolved', 'escalated')),
  resolution_date DATE,
  resolution_notes TEXT,
  estimated_referral_impact INTEGER, -- Estimated monthly referrals lost
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Create account growth goals history for tracking changes over time
CREATE TABLE IF NOT EXISTS growth_goal_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  period_type TEXT CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  referral_goal INTEGER NOT NULL,
  actual_referrals INTEGER DEFAULT 0,
  admission_goal INTEGER,
  actual_admissions INTEGER DEFAULT 0,
  variance_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_strategic_actions_org ON strategic_actions(organization_id);
CREATE INDEX IF NOT EXISTS idx_strategic_actions_status ON strategic_actions(status);
CREATE INDEX IF NOT EXISTS idx_strategic_actions_due_date ON strategic_actions(due_date);
CREATE INDEX IF NOT EXISTS idx_marketing_programs_status ON marketing_programs(status);
CREATE INDEX IF NOT EXISTS idx_program_participation_org ON program_participation(organization_id);
CREATE INDEX IF NOT EXISTS idx_marketing_barriers_status ON marketing_barriers(status);
CREATE INDEX IF NOT EXISTS idx_growth_goal_history_org ON growth_goal_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_growth_goal_history_period ON growth_goal_history(period_start, period_end);

-- Enable RLS on new tables
ALTER TABLE strategic_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_barriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_goal_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Authenticated users can manage strategic actions" 
  ON strategic_actions FOR ALL TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage marketing programs" 
  ON marketing_programs FOR ALL TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage program participation" 
  ON program_participation FOR ALL TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage marketing barriers" 
  ON marketing_barriers FOR ALL TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage growth goal history" 
  ON growth_goal_history FOR ALL TO authenticated 
  USING (true) WITH CHECK (true);

-- Create function to automatically update current month/quarter referrals
CREATE OR REPLACE FUNCTION update_organization_referral_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current month referrals
  UPDATE organizations o
  SET 
    current_month_referrals = (
      SELECT COUNT(*) 
      FROM referrals r 
      WHERE r.organization_id = o.id 
        AND DATE_TRUNC('month', r.created_at) = DATE_TRUNC('month', CURRENT_DATE)
    ),
    current_quarter_referrals = (
      SELECT COUNT(*) 
      FROM referrals r 
      WHERE r.organization_id = o.id 
        AND DATE_TRUNC('quarter', r.created_at) = DATE_TRUNC('quarter', CURRENT_DATE)
    ),
    ytd_referrals = (
      SELECT COUNT(*) 
      FROM referrals r 
      WHERE r.organization_id = o.id 
        AND DATE_TRUNC('year', r.created_at) = DATE_TRUNC('year', CURRENT_DATE)
    )
  WHERE o.id = COALESCE(NEW.organization_id, OLD.organization_id);
  
  -- Update growth status based on goals
  UPDATE organizations o
  SET growth_status = 
    CASE 
      WHEN current_month_referrals >= monthly_referral_goal * 1.1 THEN 'exceeding'
      WHEN current_month_referrals >= monthly_referral_goal * 0.9 THEN 'on_track'
      WHEN current_month_referrals >= monthly_referral_goal * 0.7 THEN 'at_risk'
      ELSE 'behind'
    END
  WHERE o.id = COALESCE(NEW.organization_id, OLD.organization_id)
    AND o.monthly_referral_goal > 0;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update counts when referrals change
DROP TRIGGER IF EXISTS update_org_referral_counts_trigger ON referrals;
CREATE TRIGGER update_org_referral_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON referrals
FOR EACH ROW
EXECUTE FUNCTION update_organization_referral_counts();

-- Add sample marketing programs for common initiatives
INSERT INTO marketing_programs (program_name, program_type, description, target_segment, success_metric, target_value, status, owner)
VALUES 
  ('Dementia Care Advantage', 'training', 'Specialized dementia training for ALF staff', ARRAY['assisted_living', 'memory_care'], 'New ALF referrals', 5, 'planning', 'Marketing Team'),
  ('Memory Moments Volunteer Program', 'service_enhancement', 'Volunteer visits with personalized memory activities', ARRAY['assisted_living', 'personal_care'], 'Positive feedback and referrals', 3, 'planning', 'Marketing Team'),
  ('Lunch & Learn Series', 'training', 'Educational sessions for healthcare partners', ARRAY['physician', 'hospital', 'snf'], 'Attendee referrals', 10, 'planning', 'Marketing Team')
ON CONFLICT DO NOTHING;