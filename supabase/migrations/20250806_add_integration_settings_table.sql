-- Create integration_settings table for dynamic configuration
CREATE TABLE IF NOT EXISTS public.integration_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    integration_type text NOT NULL,
    organization_id text NOT NULL DEFAULT 'default',
    settings jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by text,
    UNIQUE(integration_type, organization_id)
);

-- Add RLS policies
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to manage their organization's settings
CREATE POLICY "Users can manage integration settings" ON public.integration_settings
    FOR ALL USING (true);

-- Add indexes
CREATE INDEX idx_integration_settings_type_org ON public.integration_settings(integration_type, organization_id);
CREATE INDEX idx_integration_settings_updated ON public.integration_settings(updated_at);

-- Insert default Teams integration settings
INSERT INTO public.integration_settings (
    integration_type, 
    organization_id, 
    settings,
    created_by
) VALUES (
    'teams',
    'default',
    '{
        "webhooks": {
            "primary": "",
            "urgent": "",
            "scheduling": "",
            "system": "",
            "regionA": "",
            "regionB": ""
        },
        "teamMembers": [
            {
                "name": "John Smith",
                "email": "john.smith@elevatehospice.com",
                "role": "Senior Marketer",
                "region": "North"
            },
            {
                "name": "Sarah Johnson", 
                "email": "sarah.johnson@elevatehospice.com",
                "role": "Referral Coordinator",
                "region": "South"
            },
            {
                "name": "Mike Davis",
                "email": "mike.davis@elevatehospice.com", 
                "role": "Regional Manager",
                "region": "North"
            },
            {
                "name": "Lisa Wilson",
                "email": "lisa.wilson@elevatehospice.com",
                "role": "Clinical Liaison", 
                "region": "South"
            },
            {
                "name": "David Brown",
                "email": "david.brown@elevatehospice.com",
                "role": "Intake Coordinator",
                "region": "North"
            }
        ],
        "notifications": {
            "autoNotifyNewReferrals": true,
            "autoNotifyStatusChanges": true, 
            "autoNotifyF2FDeadlines": true,
            "autoCreateCalendarEvents": false,
            "notificationFrequency": "immediate"
        },
        "routing": {
            "urgentToUrgentChannel": true,
            "routeByRegion": true,
            "routeByPriority": true,
            "fallbackToPrimary": true
        }
    }',
    'system'
) ON CONFLICT (integration_type, organization_id) DO NOTHING;

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_integration_settings_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_integration_settings_updated_at
    BEFORE UPDATE ON public.integration_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_integration_settings_updated_at();

-- Comment on table
COMMENT ON TABLE public.integration_settings IS 'Stores dynamic configuration settings for various integrations like Teams, Slack, etc.';
COMMENT ON COLUMN public.integration_settings.integration_type IS 'Type of integration (teams, slack, email, etc.)';
COMMENT ON COLUMN public.integration_settings.organization_id IS 'Organization identifier for multi-tenant support';
COMMENT ON COLUMN public.integration_settings.settings IS 'JSON configuration for the integration';