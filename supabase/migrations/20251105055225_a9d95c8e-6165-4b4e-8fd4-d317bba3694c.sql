-- Create marketing themes table (physician outreach, SNF outreach, etc.)
CREATE TABLE IF NOT EXISTS marketing_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create marketing materials table (whitepapers, strategies, templates)
CREATE TABLE IF NOT EXISTS marketing_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID REFERENCES marketing_themes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  material_type TEXT NOT NULL, -- 'whitepaper', 'strategy', 'template', 'guide'
  file_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create marketing campaigns table (track outreach efforts)
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID REFERENCES marketing_themes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_audience TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'completed'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE marketing_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_themes
CREATE POLICY "Anyone can view marketing themes"
  ON marketing_themes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage marketing themes"
  ON marketing_themes FOR ALL
  USING (auth.role() = 'authenticated');

-- RLS Policies for marketing_materials
CREATE POLICY "Anyone can view marketing materials"
  ON marketing_materials FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage marketing materials"
  ON marketing_materials FOR ALL
  USING (auth.role() = 'authenticated');

-- RLS Policies for marketing_campaigns
CREATE POLICY "Anyone can view marketing campaigns"
  ON marketing_campaigns FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage marketing campaigns"
  ON marketing_campaigns FOR ALL
  USING (auth.role() = 'authenticated');

-- Insert initial Physician Outreach theme
INSERT INTO marketing_themes (name, description, icon, color) VALUES
  ('Physician Outreach', 'Materials and strategies for building relationships with physicians and medical practices', 'Stethoscope', '#3b82f6');

-- Triggers for updated_at
CREATE TRIGGER update_marketing_themes_updated_at
  BEFORE UPDATE ON marketing_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_materials_updated_at
  BEFORE UPDATE ON marketing_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();