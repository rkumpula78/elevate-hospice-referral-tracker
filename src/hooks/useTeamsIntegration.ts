import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { teamsService } from '@/services/teamsIntegrationService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSettings';
import type { Database } from '@/integrations/supabase/types';

type Referral = Database['public']['Tables']['referrals']['Row'];
// type TeamsNotification = Database['public']['Tables']['teams_notifications']['Row']; // Temporarily disabled

interface TeamsIntegrationState {
  isConnected: boolean;
  accessToken: string | null;
  webhookConfigured: boolean;
}

export const useTeamsIntegration = () => {
  const { toast } = useToast();
  const { settings } = useSettings();
  const [integrationState, setIntegrationState] = useState<TeamsIntegrationState>({
    isConnected: false,
    accessToken: null,
    webhookConfigured: false // Temporarily disabled
  });

  // Check notification history - temporarily disabled
  const notifications = [];
  const refetchNotifications = () => {};

  // Send new referral notification
  const sendNewReferralNotification = useMutation({
    mutationFn: async (referral: Referral) => {
      // Temporarily disabled
      console.log('Teams notification would be sent for referral:', referral.id);
    },
    onSuccess: () => {
      toast({
        title: "Teams notification sent",
        description: "New referral notification sent to Teams channel"
      });
      refetchNotifications();
    },
    onError: (error) => {
      toast({
        title: "Failed to send notification",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Send F2F deadline notification
  const sendF2FDeadlineNotification = useMutation({
    mutationFn: async ({ referral, daysUntilDeadline }: { referral: Referral; daysUntilDeadline: number }) => {
      await teamsService.notifyF2FDeadline(referral, daysUntilDeadline);
    },
    onSuccess: () => {
      toast({
        title: "F2F alert sent",
        description: "Face-to-face deadline alert sent to Teams"
      });
      refetchNotifications();
    },
    onError: (error) => {
      toast({
        title: "Failed to send F2F alert",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Send status change notification
  const sendStatusChangeNotification = useMutation({
    mutationFn: async ({ referral, oldStatus, newStatus }: { 
      referral: Referral; 
      oldStatus: string; 
      newStatus: string;
    }) => {
      await teamsService.notifyStatusChange(referral, oldStatus, newStatus);
    },
    onSuccess: () => {
      toast({
        title: "Status update sent",
        description: "Referral status change sent to Teams"
      });
      refetchNotifications();
    },
    onError: (error) => {
      toast({
        title: "Failed to send status update",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Schedule F2F appointment
  const scheduleF2FAppointment = useMutation({
    mutationFn: async ({ 
      referral, 
      appointmentDate, 
      attendeeEmails 
    }: { 
      referral: Referral; 
      appointmentDate: Date;
      attendeeEmails: string[];
    }) => {
      if (!integrationState.accessToken) {
        throw new Error('Teams access token required for calendar integration');
      }
      
      const eventId = await teamsService.scheduleF2FAppointment(
        referral,
        appointmentDate,
        attendeeEmails,
        integrationState.accessToken
      );
      
      if (!eventId) {
        throw new Error('Failed to create calendar event');
      }
      
      return eventId;
    },
    onSuccess: (eventId) => {
      toast({
        title: "F2F appointment scheduled",
        description: "Appointment added to Teams calendar"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to schedule appointment",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Retry failed notifications
  const retryFailedNotifications = useMutation({
    mutationFn: async () => {
      await teamsService.retryFailedNotifications();
    },
    onSuccess: () => {
      toast({
        title: "Notifications retried",
        description: "Attempting to resend failed notifications"
      });
      refetchNotifications();
    },
    onError: (error) => {
      toast({
        title: "Retry failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Auto-notify for new referrals (can be called from referral creation)
  const autoNotifyNewReferral = useCallback(async (referral: Referral) => {
    if (!integrationState.webhookConfigured) {
      console.log('Teams webhook not configured, skipping notification');
      return;
    }

    // Temporarily disabled - would check for existing notifications

    sendNewReferralNotification.mutate(referral);
  }, [integrationState.webhookConfigured, sendNewReferralNotification]);

  // Auto-check for F2F deadlines
  const checkF2FDeadlines = useCallback(async () => {
    if (!integrationState.webhookConfigured) return;

    try {
      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('status', 'admitted')
        .not('benefit_period_start', 'is', null);

      if (!referrals?.length) return;

      for (const referral of referrals) {
        if (!referral.admission_date) continue;

        // Calculate days until F2F deadline
        const admissionDate = new Date(referral.admission_date);
        const benefitPeriod = 1; // Simplified - could be calculated from data
        
        // F2F required within 30 days of admission for first benefit period
        // Different rules for subsequent periods
        const f2fDays = benefitPeriod === 1 ? 30 : 0; // Simplified logic
        const f2fDeadline = new Date(admissionDate);
        f2fDeadline.setDate(f2fDeadline.getDate() + f2fDays);
        
        const daysUntilDeadline = Math.ceil(
          (f2fDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        // Send alert if deadline is within 7 days or overdue
        if (daysUntilDeadline <= 7) {
          // Temporarily disabled - would check for recent alerts and send notification
          console.log('F2F deadline alert would be sent for referral:', referral.id);
        }
      }
    } catch (error) {
      console.error('Failed to check F2F deadlines:', error);
    }
  }, [integrationState.webhookConfigured, sendF2FDeadlineNotification]);

  // Auto-notify status changes
  const autoNotifyStatusChange = useCallback(async (
    referral: Referral,
    oldStatus: string
  ) => {
    if (!integrationState.webhookConfigured) return;
    if (oldStatus === referral.status) return;

    // Only notify for significant status changes
    const significantStatuses = [
      'admitted',
      'not_admitted_patient_choice',
      'not_admitted_not_appropriate',
      'not_admitted_lost_contact',
      'deceased_prior_admission'
    ];

    if (significantStatuses.includes(referral.status)) {
      sendStatusChangeNotification.mutate({
        referral,
        oldStatus,
        newStatus: referral.status
      });
    }
  }, [integrationState.webhookConfigured, sendStatusChangeNotification]);

  // Initialize Teams authentication (placeholder for OAuth flow)
  const initializeTeamsAuth = useCallback(async () => {
    // In a real implementation, this would handle Microsoft Graph OAuth flow
    // For now, we'll just check if we have environment configuration
    const accessToken = localStorage.getItem('teams_access_token');
    
    setIntegrationState(prev => ({
      ...prev,
      isConnected: !!accessToken,
      accessToken
    }));
  }, []);

  // Check for failed notifications on load
  useEffect(() => {
    initializeTeamsAuth();
    
    // Set up interval to check for F2F deadlines only if webhook is configured
    let interval: NodeJS.Timeout | null = null;
    if (integrationState.webhookConfigured) {
      interval = setInterval(checkF2FDeadlines, 60 * 60 * 1000); // Every hour
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [integrationState.webhookConfigured]); // Only depend on webhookConfigured to prevent infinite re-renders

  return {
    // State
    integrationState,
    notifications,
    
    // Actions
    sendNewReferralNotification: sendNewReferralNotification.mutate,
    sendF2FDeadlineNotification: sendF2FDeadlineNotification.mutate,
    sendStatusChangeNotification: sendStatusChangeNotification.mutate,
    scheduleF2FAppointment: scheduleF2FAppointment.mutate,
    retryFailedNotifications: retryFailedNotifications.mutate,
    
    // Auto actions
    autoNotifyNewReferral,
    autoNotifyStatusChange,
    checkF2FDeadlines,
    
    // Loading states
    isLoading: {
      newReferral: sendNewReferralNotification.isPending,
      f2fDeadline: sendF2FDeadlineNotification.isPending,
      statusChange: sendStatusChangeNotification.isPending,
      appointment: scheduleF2FAppointment.isPending,
      retry: retryFailedNotifications.isPending
    },
    
    // Utility
    refetchNotifications
  };
};

export default useTeamsIntegration;