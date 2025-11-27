-- Create teams_notifications table to track notification history
CREATE TABLE public.teams_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type TEXT NOT NULL,
  referral_id UUID REFERENCES public.referrals(id),
  organization_id UUID REFERENCES public.organizations(id),
  status TEXT NOT NULL DEFAULT 'pending'::text, -- pending, sent, failed, retrying
  payload JSONB,
  n8n_webhook_url TEXT,
  response_data JSONB,
  error_message TEXT,
  attempt_count INTEGER DEFAULT 1,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teams_configuration table for webhook management
CREATE TABLE public.teams_configuration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_type TEXT NOT NULL, -- 'webhook_url', 'team_mapping', 'notification_settings'
  config_key TEXT NOT NULL, -- e.g., 'urgent_notifications', 'routine_notifications', 'f2f_alerts'
  config_value JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(config_type, config_key)
);

-- Enable Row Level Security
ALTER TABLE public.teams_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams_configuration ENABLE ROW LEVEL SECURITY;

-- Create policies for teams_notifications
CREATE POLICY "Authenticated users can view teams notifications" 
ON public.teams_notifications 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create teams notifications" 
ON public.teams_notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update teams notifications" 
ON public.teams_notifications 
FOR UPDATE 
USING (true);

-- Create policies for teams_configuration  
CREATE POLICY "Authenticated users can view teams configuration" 
ON public.teams_configuration 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage teams configuration" 
ON public.teams_configuration 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_teams_notifications_updated_at
  BEFORE UPDATE ON public.teams_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_configuration_updated_at
  BEFORE UPDATE ON public.teams_configuration
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configuration for n8n webhooks
INSERT INTO public.teams_configuration (config_type, config_key, config_value, description, created_by) VALUES
('webhook_url', 'urgent_notifications', '{"url": "", "enabled": false}'::jsonb, 'n8n webhook URL for urgent notifications', 'system'),
('webhook_url', 'routine_notifications', '{"url": "", "enabled": false}'::jsonb, 'n8n webhook URL for routine notifications', 'system'), 
('webhook_url', 'f2f_alerts', '{"url": "", "enabled": false}'::jsonb, 'n8n webhook URL for F2F deadline alerts', 'system'),
('webhook_url', 'status_changes', '{"url": "", "enabled": false}'::jsonb, 'n8n webhook URL for status change notifications', 'system'),
('notification_settings', 'auto_notify_new_referrals', '{"enabled": true, "priority_filter": ["urgent", "routine"]}'::jsonb, 'Automatically notify Teams when new referrals are created', 'system'),
('notification_settings', 'auto_notify_status_changes', '{"enabled": true, "statuses": ["admitted", "not_admitted_patient_choice", "not_admitted_not_appropriate"]}'::jsonb, 'Automatically notify Teams when referral status changes', 'system'),
('notification_settings', 'f2f_deadline_alerts', '{"enabled": true, "alert_days": [7, 3, 1, 0], "overdue_alerts": true}'::jsonb, 'F2F deadline notification settings', 'system');