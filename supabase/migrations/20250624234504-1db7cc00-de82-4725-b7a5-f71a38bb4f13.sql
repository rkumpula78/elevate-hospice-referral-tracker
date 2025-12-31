
-- Create training modules table for organization types (if not exists)
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

-- Create checklists table for organization partnership development (if not exists)
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

-- Create checklist completion tracking table (if not exists)
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

-- Add training-related fields to organizations table (if not exists)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='partnership_stage') THEN
    ALTER TABLE public.organizations ADD COLUMN partnership_stage TEXT DEFAULT 'prospect';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='last_training_review') THEN
    ALTER TABLE public.organizations ADD COLUMN last_training_review DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='partnership_notes') THEN
    ALTER TABLE public.organizations ADD COLUMN partnership_notes TEXT;
  END IF;
END $$;

-- Create indexes for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_training_modules_org_type ON public.organization_training_modules(organization_type);
CREATE INDEX IF NOT EXISTS idx_checklists_org_type ON public.organization_checklists(organization_type);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_org ON public.checklist_completions(organization_id);

-- Clear existing training content to avoid duplicates
DELETE FROM public.organization_training_modules WHERE organization_type IN ('assisted_living', 'hospital');
DELETE FROM public.organization_checklists WHERE organization_type IN ('assisted_living', 'hospital');

-- Insert comprehensive training content
INSERT INTO public.organization_training_modules (organization_type, module_name, module_category, content, order_index) VALUES
('assisted_living', 'Core Value Proposition', 'value_proposition', 
  '{"title": "Core Value Proposition for Assisted Living",
    "main_message": "Enable aging in place with dignity while reducing family anxiety and liability exposure",
    "positioning": "Position Elevate Hospice as the essential partner that helps facilities fulfill their core mission of allowing residents to remain in their chosen home environment during their final chapter.",
    "key_benefits": [
      {
        "icon": "shield",
        "title": "Reduce Liability",
        "description": "Minimize family complaints and legal exposure through expert end-of-life care"
      },
      {
        "icon": "heart",
        "title": "Family Peace",
        "description": "Provide families confidence their loved one receives specialized care"
      },
      {
        "icon": "trophy",
        "title": "Differentiation",
        "description": "Stand out from competitors with comprehensive end-of-life partnership"
      }
    ]
  }'::jsonb, 1),

('assisted_living', 'Value Props - Executive Directors', 'value_proposition',
  '{"title": "Value Propositions for Executive Directors",
    "stakeholder": "Executive Director",
    "color": "blue",
    "primary_concerns": [
      "Liability and family complaints",
      "Occupancy rates and reputation",
      "Regulatory compliance",
      "Competitive differentiation"
    ],
    "value_propositions": [
      "Reduce liability exposure and family complaints",
      "Enhance satisfaction scores and reviews",
      "Differentiate from competitors",
      "Support aging-in-place mission"
    ],
    "talking_points": [
      "Our hospice partnership dramatically reduces your liability exposure by providing expert end-of-life care that families trust",
      "We help you maintain higher occupancy rates by enabling residents to stay in your facility through their final days",
      "Partnership with us becomes a powerful marketing tool that differentiates your facility from competitors"
    ]
  }'::jsonb, 2),

('hospital', 'Hospital Partnership Strategy', 'value_proposition',
  '{"title": "Hospital Partnership Value Propositions",
    "description": "Comprehensive approach to hospital partnerships focusing on reducing readmissions and improving discharge planning",
    "key_benefits": [
      {"title": "Reduce Readmissions", "description": "Lower 30-day readmission rates through expert care transitions"},
      {"title": "Improve HCAHPS", "description": "Enhance patient satisfaction scores with comprehensive end-of-life care"},
      {"title": "Streamline Discharge", "description": "Faster, more efficient discharge planning for complex patients"}
    ]
  }'::jsonb, 1);

-- Insert sample checklists
INSERT INTO public.organization_checklists (organization_type, checklist_name, phase, items, order_index, days_range) VALUES
('assisted_living', 'Relationship Mapping & Initial Assessment', 'foundation',
  '[
    {"id": "1", "task": "Identify and document all key stakeholders (ED, DON, Marketing, Social Services)", "priority": "high"},
    {"id": "2", "task": "Map existing hospice relationships and competitive landscape", "priority": "high"},
    {"id": "3", "task": "Schedule initial meet-and-greet with Executive Director", "priority": "high"},
    {"id": "4", "task": "Review facility annual resident mortality data", "priority": "high"},
    {"id": "5", "task": "Assess current hospice utilization percentage", "priority": "high"}
  ]'::jsonb, 1, '1-15'),

('hospital', 'Hospital Partnership Assessment', 'foundation',
  '[
    {"id": "1", "task": "Identify key discharge planners and case managers", "priority": "high"},
    {"id": "2", "task": "Review hospital readmission data and patterns", "priority": "high"},
    {"id": "3", "task": "Assess current hospice referral volume", "priority": "high"},
    {"id": "4", "task": "Meet with social work department leadership", "priority": "medium"}
  ]'::jsonb, 1, '1-30');
