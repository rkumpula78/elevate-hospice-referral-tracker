-- Add Microsoft Teams integration infrastructure
-- This migration creates the foundation for Teams notifications and calendar synchronization

-- Teams notification tracking table
CREATE TABLE public.teams_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id uuid REFERENCES public.referrals(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES public.visits(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (
    notification_type IN (
      'new_referral', 'referral_status_update', 'visit_scheduled', 'visit_completed',
      'f2f_deadline_approaching', 'f2f_overdue', 'admission_confirmed', 'discharge_notification',
      'organization_update', 'referrer_communication', 'urgent_alert', 'daily_summary'
    )
  ),
  teams_channel_id text,
  teams_message_id text,
  teams_conversation_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')),
  priority_level integer DEFAULT 3 CHECK (priority_level BETWEEN 1 AND 5), -- 1=highest, 5=lowest
  payload jsonb NOT NULL, -- Contains the notification content and metadata
  template_name text, -- Reference to the notification template used
  recipient_users text[], -- Array of user IDs who should receive this notification
  scheduled_for timestamptz, -- For scheduled notifications
  sent_at timestamptz,
  delivered_at timestamptz,
  error_message text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Teams calendar synchronization tracking
CREATE TABLE public.teams_calendar_sync (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id uuid NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  teams_event_id text UNIQUE, -- Microsoft Graph event ID
  teams_calendar_id text, -- Calendar where the event is stored
  sync_status text DEFAULT 'pending' CHECK (
    sync_status IN ('pending', 'synced', 'sync_failed', 'conflict', 'cancelled', 'deleted')
  ),
  sync_direction text DEFAULT 'outbound' CHECK (
    sync_direction IN ('outbound', 'inbound', 'bidirectional')
  ),
  last_synced_at timestamptz,
  last_sync_hash text, -- Hash of visit data to detect changes
  teams_meeting_url text, -- URL for Teams meeting if created
  teams_meeting_id text, -- Teams meeting ID
  conflict_resolution text CHECK (
    conflict_resolution IN ('crm_wins', 'teams_wins', 'manual_review', 'merge')
  ),
  sync_error text,
  sync_metadata jsonb, -- Store additional sync-related information
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Teams webhook events log
CREATE TABLE public.teams_webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_type text NOT NULL, -- 'message', 'calendar', 'channel', etc.
  event_type text NOT NULL, -- 'created', 'updated', 'deleted', etc.
  teams_resource_id text NOT NULL, -- Teams resource identifier
  change_type text, -- What changed in Teams
  resource_data jsonb, -- The actual change data from Teams
  processed boolean DEFAULT false,
  processing_error text,
  related_referral_id uuid REFERENCES public.referrals(id),
  related_visit_id uuid REFERENCES public.visits(id),
  related_notification_id uuid REFERENCES public.teams_notifications(id),
  received_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Teams configuration and settings
CREATE TABLE public.teams_integration_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  setting_type text DEFAULT 'string' CHECK (
    setting_type IN ('string', 'number', 'boolean', 'json', 'array')
  ),
  description text,
  is_sensitive boolean DEFAULT false, -- For API keys, secrets, etc.
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Teams notification templates
CREATE TABLE public.teams_notification_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name text NOT NULL UNIQUE,
  notification_type text NOT NULL,
  template_subject text,
  template_body text NOT NULL,
  template_variables jsonb, -- List of variables that can be substituted
  is_active boolean DEFAULT true,
  priority_level integer DEFAULT 3 CHECK (priority_level BETWEEN 1 AND 5),
  created_by text,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_teams_notifications_type ON public.teams_notifications(notification_type);
CREATE INDEX idx_teams_notifications_status ON public.teams_notifications(status);
CREATE INDEX idx_teams_notifications_scheduled ON public.teams_notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_teams_notifications_referral ON public.teams_notifications(referral_id);
CREATE INDEX idx_teams_notifications_organization ON public.teams_notifications(organization_id);
CREATE INDEX idx_teams_notifications_retry ON public.teams_notifications(retry_count) WHERE retry_count > 0;

CREATE INDEX idx_teams_calendar_sync_visit ON public.teams_calendar_sync(visit_id);
CREATE INDEX idx_teams_calendar_sync_status ON public.teams_calendar_sync(sync_status);
CREATE INDEX idx_teams_calendar_sync_event_id ON public.teams_calendar_sync(teams_event_id);
CREATE INDEX idx_teams_calendar_sync_last_synced ON public.teams_calendar_sync(last_synced_at);

CREATE INDEX idx_teams_webhook_events_processed ON public.teams_webhook_events(processed) WHERE processed = false;
CREATE INDEX idx_teams_webhook_events_type ON public.teams_webhook_events(webhook_type, event_type);
CREATE INDEX idx_teams_webhook_events_received ON public.teams_webhook_events(received_at);

-- Create function to queue Teams notification
CREATE OR REPLACE FUNCTION queue_teams_notification(
  p_notification_type text,
  p_payload jsonb,
  p_referral_id uuid DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_visit_id uuid DEFAULT NULL,
  p_priority_level integer DEFAULT 3,
  p_scheduled_for timestamptz DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.teams_notifications (
    notification_type,
    payload,
    referral_id,
    organization_id,
    visit_id,
    priority_level,
    scheduled_for
  ) VALUES (
    p_notification_type,
    p_payload,
    p_referral_id,
    p_organization_id,
    p_visit_id,
    p_priority_level,
    p_scheduled_for
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to trigger new referral Teams notification
CREATE OR REPLACE FUNCTION trigger_new_referral_teams_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_payload jsonb;
  org_name text;
  referrer_name text;
BEGIN
  -- Only trigger for new referrals
  IF NEW.status = 'new_referral' AND (OLD IS NULL OR OLD.status != 'new_referral') THEN
    
    -- Get organization name
    SELECT name INTO org_name 
    FROM public.organizations 
    WHERE id = NEW.organization_id;
    
    -- Get referrer name if specified
    IF NEW.referring_contact_id IS NOT NULL THEN
      SELECT first_name || ' ' || last_name INTO referrer_name
      FROM public.organization_contacts
      WHERE id = NEW.referring_contact_id;
    END IF;
    
    -- Build notification payload
    notification_payload := jsonb_build_object(
      'patient_name', NEW.patient_name,
      'organization_name', COALESCE(org_name, 'Unknown Organization'),
      'referrer_name', COALESCE(referrer_name, 'General Referral'),
      'priority', NEW.priority,
      'diagnosis', NEW.diagnosis,
      'insurance', NEW.insurance,
      'referral_date', NEW.referral_date,
      'assigned_marketer', NEW.assigned_marketer,
      'next_steps', jsonb_build_array(
        'Contact patient/family',
        'Verify insurance',
        'Schedule assessment',
        'Coordinate with referring physician'
      )
    );
    
    -- Queue Teams notification
    PERFORM queue_teams_notification(
      'new_referral',
      notification_payload,
      NEW.id,
      NEW.organization_id,
      NULL,
      CASE NEW.priority 
        WHEN 'urgent' THEN 1
        WHEN 'routine' THEN 3
        ELSE 5
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to trigger visit assignment notification
CREATE OR REPLACE FUNCTION trigger_visit_assignment_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_payload jsonb;
  patient_name text;
BEGIN
  -- Trigger when a visit is assigned (staff_name is set)
  IF NEW.staff_name IS NOT NULL AND (OLD IS NULL OR OLD.staff_name IS NULL OR OLD.staff_name != NEW.staff_name) THEN
    
    -- Get patient name from referral
    SELECT r.patient_name INTO patient_name
    FROM public.referrals r
    WHERE r.id = NEW.referral_id;
    
    -- Build notification payload
    notification_payload := jsonb_build_object(
      'patient_name', COALESCE(patient_name, 'Unknown Patient'),
      'visit_type', NEW.visit_type,
      'assigned_staff', NEW.staff_name,
      'scheduled_date', NEW.scheduled_date,
      'f2f_required', NEW.f2f_required,
      'visit_id', NEW.id
    );
    
    -- Queue Teams notification
    PERFORM queue_teams_notification(
      'visit_scheduled',
      notification_payload,
      NEW.referral_id,
      NULL,
      NEW.id,
      CASE 
        WHEN NEW.f2f_required THEN 2
        WHEN NEW.visit_type = 'urgent' THEN 1
        ELSE 3
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic Teams notifications
CREATE TRIGGER trigger_new_referral_teams_notification
  AFTER INSERT OR UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_referral_teams_notification();

CREATE TRIGGER trigger_visit_assignment_notification
  AFTER INSERT OR UPDATE ON public.visits
  FOR EACH ROW
  EXECUTE FUNCTION trigger_visit_assignment_notification();

-- Insert default Teams integration settings
INSERT INTO public.teams_integration_settings (setting_key, setting_value, setting_type, description) VALUES
('teams_enabled', 'true', 'boolean', 'Enable Microsoft Teams integration'),
('default_channel_id', '""', 'string', 'Default Teams channel for notifications'),
('notification_retry_interval', '300', 'number', 'Retry interval in seconds for failed notifications'),
('calendar_sync_enabled', 'true', 'boolean', 'Enable Teams calendar synchronization'),
('webhook_verification_token', '""', 'string', 'Token for webhook verification'),
('max_notification_retries', '3', 'number', 'Maximum retry attempts for failed notifications');

-- Insert default notification templates
INSERT INTO public.teams_notification_templates (template_name, notification_type, template_subject, template_body, template_variables) VALUES
('new_referral_alert', 'new_referral', 'New Hospice Referral - {{patient_name}}', 
 '🏥 **New Referral Alert**\n\n**Patient:** {{patient_name}}\n**From:** {{organization_name}}\n**Referrer:** {{referrer_name}}\n**Priority:** {{priority}}\n**Diagnosis:** {{diagnosis}}\n**Insurance:** {{insurance}}\n**Assigned Marketer:** {{assigned_marketer}}\n\n**Next Steps:**\n{{#each next_steps}}- {{this}}\n{{/each}}',
 '["patient_name", "organization_name", "referrer_name", "priority", "diagnosis", "insurance", "assigned_marketer", "next_steps"]'),

('visit_scheduled_alert', 'visit_scheduled', 'Visit Scheduled - {{patient_name}}',
 '📅 **Visit Scheduled**\n\n**Patient:** {{patient_name}}\n**Type:** {{visit_type}}\n**Staff:** {{assigned_staff}}\n**Date:** {{scheduled_date}}\n{{#if f2f_required}}**⚠️ F2F Required**{{/if}}',
 '["patient_name", "visit_type", "assigned_staff", "scheduled_date", "f2f_required"]'),

('f2f_deadline_alert', 'f2f_deadline_approaching', 'F2F Deadline Approaching - {{patient_name}}',
 '⏰ **F2F Deadline Alert**\n\n**Patient:** {{patient_name}}\n**Deadline:** {{deadline_date}}\n**Days Remaining:** {{days_remaining}}\n**Benefit Period:** {{benefit_period_number}}\n\n**Action Required:** Schedule F2F visit immediately',
 '["patient_name", "deadline_date", "days_remaining", "benefit_period_number"]');

-- Enable Row Level Security
ALTER TABLE public.teams_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams_calendar_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams_integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams_notification_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for authenticated users)
CREATE POLICY "Users can manage Teams notifications" ON public.teams_notifications FOR ALL USING (true);
CREATE POLICY "Users can manage Teams calendar sync" ON public.teams_calendar_sync FOR ALL USING (true);
CREATE POLICY "Users can view Teams webhook events" ON public.teams_webhook_events FOR SELECT USING (true);
CREATE POLICY "Users can manage Teams settings" ON public.teams_integration_settings FOR ALL USING (true);
CREATE POLICY "Users can manage Teams templates" ON public.teams_notification_templates FOR ALL USING (true);

-- Add helpful comments
COMMENT ON TABLE public.teams_notifications IS 'Manages Teams notifications with delivery tracking and retry logic';
COMMENT ON TABLE public.teams_calendar_sync IS 'Synchronizes hospice visits with Microsoft Teams calendar';
COMMENT ON TABLE public.teams_webhook_events IS 'Logs incoming webhook events from Microsoft Teams';
COMMENT ON TABLE public.teams_integration_settings IS 'Configuration settings for Teams integration';
COMMENT ON TABLE public.teams_notification_templates IS 'Templates for different types of Teams notifications';
COMMENT ON FUNCTION queue_teams_notification IS 'Queues a new Teams notification for processing';
COMMENT ON FUNCTION trigger_new_referral_teams_notification IS 'Automatically creates Teams notification for new referrals';
COMMENT ON FUNCTION trigger_visit_assignment_notification IS 'Automatically creates Teams notification when visits are assigned';