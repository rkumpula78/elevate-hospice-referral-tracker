-- Create training modules table for organization types
CREATE TABLE IF NOT EXISTS public.organization_training_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_type TEXT NOT NULL,
  module_name TEXT NOT NULL,
  module_category TEXT NOT NULL, -- 'value_proposition', 'action_plan', 'kpi', 'best_practice'
  content JSONB NOT NULL, -- Structured content with title, description, bullet points, etc.
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checklists table for organization partnership development
CREATE TABLE IF NOT EXISTS public.organization_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_type TEXT NOT NULL,
  checklist_name TEXT NOT NULL,
  phase TEXT NOT NULL, -- 'foundation', 'engagement', 'optimization'
  items JSONB NOT NULL, -- Array of checklist items with descriptions
  order_index INTEGER DEFAULT 0,
  days_range TEXT, -- e.g., "1-30", "31-60", "61-90"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checklist completion tracking table
CREATE TABLE IF NOT EXISTS public.checklist_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  checklist_id UUID REFERENCES public.organization_checklists(id) ON DELETE CASCADE,
  completed_items JSONB DEFAULT '[]'::jsonb, -- Array of completed item IDs
  completed_by TEXT,
  notes TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, checklist_id)
);

-- Create KPI tracking table for organizations
CREATE TABLE IF NOT EXISTS public.organization_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  kpi_type TEXT NOT NULL, -- 'referral_volume', 'conversion_rate', 'avg_los', 'satisfaction_score', etc.
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_value NUMERIC,
  actual_value NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training completion tracking for marketers
CREATE TABLE IF NOT EXISTS public.marketer_training_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marketer_name TEXT NOT NULL,
  module_id UUID REFERENCES public.organization_training_modules(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE,
  quiz_score NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(marketer_name, module_id)
);

-- Add training-related fields to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS partnership_stage TEXT DEFAULT 'prospect', -- 'prospect', 'developing', 'active', 'strategic'
ADD COLUMN IF NOT EXISTS last_training_review DATE,
ADD COLUMN IF NOT EXISTS partnership_notes TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_modules_org_type ON public.organization_training_modules(organization_type);
CREATE INDEX IF NOT EXISTS idx_checklists_org_type ON public.organization_checklists(organization_type);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_org ON public.checklist_completions(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_kpis_org ON public.organization_kpis(organization_id);
CREATE INDEX IF NOT EXISTS idx_marketer_progress_marketer ON public.marketer_training_progress(marketer_name);

-- Enable RLS on new tables
ALTER TABLE public.organization_training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketer_training_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view training modules" 
  ON public.organization_training_modules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage training modules" 
  ON public.organization_training_modules FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view checklists" 
  ON public.organization_checklists FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage checklists" 
  ON public.organization_checklists FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage checklist completions" 
  ON public.checklist_completions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage KPIs" 
  ON public.organization_kpis FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage training progress" 
  ON public.marketer_training_progress FOR ALL TO authenticated USING (true) WITH CHECK (true); 