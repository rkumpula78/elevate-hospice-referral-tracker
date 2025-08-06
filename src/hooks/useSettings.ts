import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TeamsSettings {
  webhooks: {
    primary: string;
    urgent: string;
    scheduling: string;
    system: string;
    regionA: string;
    regionB: string;
  };
  teamMembers: Array<{
    name: string;
    email: string;
    role: string;
    region?: string;
  }>;
  notifications: {
    autoNotifyNewReferrals: boolean;
    autoNotifyStatusChanges: boolean;
    autoNotifyF2FDeadlines: boolean;
    autoCreateCalendarEvents: boolean;
    notificationFrequency: 'immediate' | 'hourly' | 'daily';
  };
  routing: {
    urgentToUrgentChannel: boolean;
    routeByRegion: boolean;
    routeByPriority: boolean;
    fallbackToPrimary: boolean;
  };
}

const defaultSettings: TeamsSettings = {
  webhooks: {
    primary: import.meta.env.VITE_TEAMS_WEBHOOK_URL || '',
    urgent: import.meta.env.VITE_TEAMS_WEBHOOK_URGENT_URL || '',
    scheduling: import.meta.env.VITE_TEAMS_WEBHOOK_SCHEDULING_URL || '',
    system: import.meta.env.VITE_TEAMS_WEBHOOK_SYSTEM_URL || '',
    regionA: import.meta.env.VITE_TEAMS_WEBHOOK_REGION_A_URL || '',
    regionB: import.meta.env.VITE_TEAMS_WEBHOOK_REGION_B_URL || ''
  },
  teamMembers: [
    { name: 'John Smith', email: 'john.smith@elevatehospice.com', role: 'Senior Marketer', region: 'North' },
    { name: 'Sarah Johnson', email: 'sarah.johnson@elevatehospice.com', role: 'Referral Coordinator', region: 'South' },
    { name: 'Mike Davis', email: 'mike.davis@elevatehospice.com', role: 'Regional Manager', region: 'North' },
    { name: 'Lisa Wilson', email: 'lisa.wilson@elevatehospice.com', role: 'Clinical Liaison', region: 'South' },
    { name: 'David Brown', email: 'david.brown@elevatehospice.com', role: 'Intake Coordinator', region: 'North' }
  ],
  notifications: {
    autoNotifyNewReferrals: true,
    autoNotifyStatusChanges: true,
    autoNotifyF2FDeadlines: true,
    autoCreateCalendarEvents: false,
    notificationFrequency: 'immediate'
  },
  routing: {
    urgentToUrgentChannel: true,
    routeByRegion: true,
    routeByPriority: true,
    fallbackToPrimary: true
  }
};

export const useTeamsSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load Teams settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['teams-settings'],
    queryFn: async (): Promise<TeamsSettings> => {
      const { data, error } = await supabase
        .from('integration_settings')
        .select('settings')
        .eq('integration_type', 'teams')
        .eq('organization_id', 'default')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') { // Not found is OK
        throw error;
      }
      
      // Merge with defaults and environment variables
      const savedSettings = data?.settings as Partial<TeamsSettings> || {};
      
      return {
        ...defaultSettings,
        ...savedSettings,
        webhooks: {
          ...defaultSettings.webhooks,
          ...savedSettings.webhooks
        },
        notifications: {
          ...defaultSettings.notifications,
          ...savedSettings.notifications
        },
        routing: {
          ...defaultSettings.routing,
          ...savedSettings.routing
        },
        teamMembers: savedSettings.teamMembers || defaultSettings.teamMembers
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Save Teams settings
  const saveSettings = useMutation({
    mutationFn: async (newSettings: TeamsSettings) => {
      const { error } = await supabase
        .from('integration_settings')
        .upsert({
          integration_type: 'teams',
          organization_id: 'default',
          settings: newSettings,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      return newSettings;
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Teams integration settings updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['teams-settings'] });
    },
    onError: (error) => {
      console.error('Failed to save Teams settings:', error);
      toast({
        title: "Save failed",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Helper functions
  const getWebhookUrl = (
    referral: any,
    notificationType: 'new_referral' | 'f2f_deadline' | 'status_change' | 'system_alert',
    additionalContext?: { isOverdue?: boolean; daysUntilDeadline?: number }
  ): string => {
    if (!settings) return '';

    // Special routing for F2F notifications
    if (notificationType === 'f2f_deadline') {
      if (additionalContext?.isOverdue || (additionalContext?.daysUntilDeadline !== undefined && additionalContext.daysUntilDeadline < 0)) {
        return settings.webhooks.urgent || settings.webhooks.primary;
      }
      if (additionalContext?.daysUntilDeadline !== undefined && additionalContext.daysUntilDeadline <= 3) {
        return settings.webhooks.urgent || settings.webhooks.primary;
      }
      return settings.webhooks.primary;
    }
    
    // System alerts
    if (notificationType === 'system_alert') {
      return settings.webhooks.system || settings.webhooks.primary;
    }
    
    // Priority-based routing for urgent referrals
    if (referral.priority === 'urgent' && settings.routing.urgentToUrgentChannel) {
      return settings.webhooks.urgent || settings.webhooks.primary;
    }
    
    // Status change routing for critical statuses
    if (notificationType === 'status_change') {
      const criticalStatuses = ['not_admitted_patient_choice', 'not_admitted_not_appropriate', 'deceased_prior_admission'];
      if (criticalStatuses.includes(referral.status)) {
        return settings.webhooks.urgent || settings.webhooks.primary;
      }
    }
    
    // Regional routing by marketer
    if (settings.routing.routeByRegion && referral.assigned_marketer) {
      const teamMember = settings.teamMembers.find(m => m.name === referral.assigned_marketer);
      if (teamMember?.region === 'North' && settings.webhooks.regionA) {
        return settings.webhooks.regionA;
      }
      if (teamMember?.region === 'South' && settings.webhooks.regionB) {
        return settings.webhooks.regionB;
      }
    }
    
    // Default fallback
    return settings.webhooks.primary;
  };

  const getTeamMemberMention = (memberName: string) => {
    if (!settings) return null;

    const member = settings.teamMembers.find(m => m.name === memberName);
    if (!member) return null;
    
    return {
      mention: `<at>${member.name}</at>`,
      entity: {
        type: "mention",
        text: `<at>${member.name}</at>`,
        mentioned: {
          id: member.email,
          name: member.name
        }
      }
    };
  };

  const validateConfiguration = () => {
    if (!settings) {
      return {
        isValid: false,
        errors: ['Settings not loaded'],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check primary webhook
    if (!settings.webhooks.primary) {
      errors.push('Primary Teams webhook URL is required');
    }
    
    // Check optional webhooks
    if (!settings.webhooks.urgent) {
      warnings.push('Urgent webhook URL not configured - urgent notifications will go to primary channel');
    }
    
    if (!settings.webhooks.scheduling) {
      warnings.push('Scheduling webhook URL not configured - scheduling notifications will go to primary channel');
    }
    
    if (!settings.webhooks.system) {
      warnings.push('System alerts webhook URL not configured - system alerts will go to primary channel');
    }
    
    // Check team members
    const invalidMembers = settings.teamMembers.filter(m => !m.name || !m.email);
    if (invalidMembers.length > 0) {
      warnings.push(`${invalidMembers.length} team member(s) missing name or email`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  return {
    // Data
    settings: settings || defaultSettings,
    isLoading,
    error,
    
    // Actions
    saveSettings: saveSettings.mutate,
    savingSettings: saveSettings.isPending,
    
    // Helper functions
    getWebhookUrl,
    getTeamMemberMention,
    validateConfiguration
  };
};

export default useTeamsSettings;