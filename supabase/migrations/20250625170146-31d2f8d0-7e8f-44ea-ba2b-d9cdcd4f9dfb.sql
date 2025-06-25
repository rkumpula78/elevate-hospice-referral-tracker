
-- Enhance organizations table with comprehensive CRM fields
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS dba_name text,
ADD COLUMN IF NOT EXISTS sub_type text,
ADD COLUMN IF NOT EXISTS license_numbers text[],
ADD COLUMN IF NOT EXISTS medicare_id text,
ADD COLUMN IF NOT EXISTS bed_count integer,
ADD COLUMN IF NOT EXISTS ownership_type text CHECK (ownership_type IN ('for_profit', 'non_profit', 'chain', 'independent')),
ADD COLUMN IF NOT EXISTS service_radius integer, -- in miles
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS after_hours_contact text,
ADD COLUMN IF NOT EXISTS gps_latitude numeric,
ADD COLUMN IF NOT EXISTS gps_longitude numeric,
ADD COLUMN IF NOT EXISTS account_rating text CHECK (account_rating IN ('A', 'B', 'C', 'P', 'D')) DEFAULT 'C',
ADD COLUMN IF NOT EXISTS referral_potential integer CHECK (referral_potential >= 1 AND referral_potential <= 10) DEFAULT 5,
ADD COLUMN IF NOT EXISTS competitive_landscape text,
ADD COLUMN IF NOT EXISTS current_hospice_providers text[],
ADD COLUMN IF NOT EXISTS contract_status text CHECK (contract_status IN ('exclusive', 'preferred', 'open', 'competitive', 'lost')) DEFAULT 'open',
ADD COLUMN IF NOT EXISTS financial_health_notes text,
ADD COLUMN IF NOT EXISTS expansion_plans text,
ADD COLUMN IF NOT EXISTS regulatory_notes text;

-- Create organization_contacts table for individual contacts within organizations
CREATE TABLE IF NOT EXISTS organization_contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    title text,
    direct_phone text,
    email text,
    role_in_referral text CHECK (role_in_referral IN ('decision_maker', 'influencer', 'gatekeeper', 'other')),
    years_in_position integer,
    previous_experience text,
    communication_preferences text[] DEFAULT ARRAY['email'],
    best_contact_times text,
    relationship_strength integer CHECK (relationship_strength >= 1 AND relationship_strength <= 5) DEFAULT 1,
    personal_interests text,
    professional_networks text,
    influence_level text CHECK (influence_level IN ('high', 'medium', 'low')) DEFAULT 'medium',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create activity_log table for comprehensive interaction tracking
CREATE TABLE IF NOT EXISTS activity_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id uuid REFERENCES organization_contacts(id) ON DELETE SET NULL,
    activity_type text NOT NULL CHECK (activity_type IN ('phone', 'email', 'in_person', 'educational_event', 'lunch_learn', 'presentation')),
    activity_date timestamp with time zone NOT NULL DEFAULT now(),
    duration_minutes integer,
    participants text[],
    purpose text,
    discussion_points text,
    materials_left text[],
    next_steps text,
    follow_up_date date,
    follow_up_completed boolean DEFAULT false,
    marketer_name text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create competitive_analysis table
CREATE TABLE IF NOT EXISTS competitive_analysis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    competitor_name text NOT NULL,
    relationship_strength text CHECK (relationship_strength IN ('strong', 'weak', 'neutral')) DEFAULT 'neutral',
    contract_details text,
    strengths text,
    weaknesses text,
    displacement_opportunities text,
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_account_rating ON organizations(account_rating);
CREATE INDEX IF NOT EXISTS idx_organizations_partnership_stage ON organizations(partnership_stage);
CREATE INDEX IF NOT EXISTS idx_organization_contacts_org_id ON organization_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_org_id ON activity_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(activity_date);
CREATE INDEX IF NOT EXISTS idx_activity_log_follow_up ON activity_log(follow_up_date) WHERE follow_up_completed = false;

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organization_contacts_updated_at 
    BEFORE UPDATE ON organization_contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_log_updated_at 
    BEFORE UPDATE ON activity_log 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
