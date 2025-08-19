import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Referral = Database['public']['Tables']['referrals']['Row'];
// type TeamsNotification = Database['public']['Tables']['teams_notifications']['Row']; // Temporarily disabled

export interface TeamsNotificationPayload {
  title: string;
  text: string;
  themeColor: string;
  summary: string;
  sections: Array<{
    activityTitle?: string;
    activitySubtitle?: string;
    facts?: Array<{ name: string; value: string }>;
    markdown?: boolean;
  }>;
  potentialAction?: Array<{
    '@type': string;
    name: string;
    target: string[];
  }>;
}

export interface TeamsCalendarEvent {
  subject: string;
  body: {
    content: string;
    contentType: 'text' | 'html';
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
  }>;
  location?: {
    displayName: string;
  };
  categories: string[];
  importance: 'low' | 'normal' | 'high';
}

class TeamsIntegrationService {
  private readonly graphApiUrl = 'https://graph.microsoft.com/v1.0';
  
  constructor() {
    // Webhook URLs are now determined dynamically based on routing config
  }

  /**
   * Send notification to Teams about a new referral
   */
  async notifyNewReferral(referral: Referral, webhookUrl?: string, getTeamMemberMention?: (name: string) => any): Promise<void> {
    // Temporarily disabled
    console.log('Would send Teams notification for new referral:', referral.id);
  }

  /**
   * Send notification for F2F deadline alerts
   */
  async notifyF2FDeadline(referral: Referral, daysUntilDeadline: number): Promise<void> {
    // Temporarily disabled
    console.log('Would send F2F deadline notification for referral:', referral.id, 'days:', daysUntilDeadline);
  }

  /**
   * Send notification for status changes
   */
  async notifyStatusChange(referral: Referral, oldStatus: string, newStatus: string): Promise<void> {
    // Temporarily disabled
    console.log('Would send status change notification for referral:', referral.id, 'from:', oldStatus, 'to:', newStatus);
  }

  /**
   * Create a calendar event in Teams/Outlook
   */
  async createCalendarEvent(event: TeamsCalendarEvent, accessToken: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.graphApiUrl}/me/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        throw new Error(`Calendar event creation failed: ${response.statusText}`);
      }

      const createdEvent = await response.json();
      return createdEvent.id;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      return null;
    }
  }

  /**
   * Schedule F2F appointment in calendar
   */
  async scheduleF2FAppointment(
    referral: Referral,
    appointmentDate: Date,
    attendeeEmails: string[],
    accessToken: string
  ): Promise<string | null> {
    const event: TeamsCalendarEvent = {
      subject: `F2F Visit - ${referral.patient_name}`,
      body: {
        content: this.buildF2FAppointmentBody(referral),
        contentType: 'html'
      },
      start: {
        dateTime: appointmentDate.toISOString(),
        timeZone: 'America/New_York' // Configure based on organization timezone
      },
      end: {
        dateTime: new Date(appointmentDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
        timeZone: 'America/New_York'
      },
      attendees: attendeeEmails.map(email => ({
        emailAddress: { address: email }
      })),
      categories: ['Hospice', 'F2F Visit', 'Patient Care'],
      importance: 'high'
    };

    const eventId = await this.createCalendarEvent(event, accessToken);
    
    if (eventId) {
      // Log the calendar sync
      await this.logCalendarSync(referral.id, eventId, 'f2f_appointment', appointmentDate);
    }

    return eventId;
  }

  /**
   * Build Teams notification payload for new referrals
   */
  private buildNewReferralPayload(referral: Referral, getTeamMemberMention?: (name: string) => any): TeamsNotificationPayload {
    const priorityColor = {
      urgent: '#FF4B4B',
      routine: '#4A90E2',
      low: '#7ED321'
    };

    // Get team member mention if assigned marketer exists
    const marketerMention = referral.assigned_marketer && getTeamMemberMention
      ? getTeamMemberMention(referral.assigned_marketer)
      : null;

    const marketerValue = marketerMention 
      ? `${marketerMention.mention} - Please follow up`
      : referral.assigned_marketer || 'Unassigned';

    const payload: TeamsNotificationPayload = {
      title: '🏥 New Hospice Referral Received',
      text: `New referral for ${referral.patient_name}`,
      themeColor: priorityColor[referral.priority as keyof typeof priorityColor] || '#4A90E2',
      summary: `New ${referral.priority} priority referral`,
      sections: [
        {
          activityTitle: 'Patient Information',
          facts: [
            { name: 'Patient Name', value: referral.patient_name },
            { name: 'Priority', value: referral.priority?.toUpperCase() || 'ROUTINE' },
            { name: 'Status', value: this.formatStatus(referral.status) },
            { name: 'Assigned Marketer', value: marketerValue },
            ...(referral.diagnosis ? [{ name: 'Diagnosis', value: referral.diagnosis }] : []),
            ...(referral.insurance ? [{ name: 'Insurance', value: referral.insurance }] : [])
          ]
        },
        ...(referral.notes ? [{
          activityTitle: 'Notes',
          facts: [{ name: '', value: referral.notes }],
          markdown: true
        }] : [])
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'View Referral Details',
          target: [`${window.location.origin}/referrals/${referral.id}`]
        }
      ]
    };

    // Add entities for mentions if applicable
    if (marketerMention) {
      (payload as any).entities = [marketerMention.entity];
    }

    return payload;
  }

  /**
   * Build Teams notification payload for F2F deadline alerts
   */
  private buildF2FDeadlinePayload(referral: Referral, daysUntilDeadline: number): TeamsNotificationPayload {
    const isOverdue = daysUntilDeadline < 0;
    const urgencyColor = isOverdue ? '#FF4B4B' : daysUntilDeadline <= 3 ? '#FF8C00' : '#FFD700';
    
    const deadlineText = isOverdue 
      ? `${Math.abs(daysUntilDeadline)} days overdue`
      : daysUntilDeadline === 0 
        ? 'DUE TODAY'
        : `${daysUntilDeadline} days remaining`;

    return {
      title: isOverdue ? '🚨 F2F Visit OVERDUE' : '⏰ F2F Visit Deadline Alert',
      text: `F2F visit required for ${referral.patient_name}`,
      themeColor: urgencyColor,
      summary: `F2F deadline ${deadlineText}`,
      sections: [
        {
          activityTitle: 'Face-to-Face Visit Required',
          facts: [
            { name: 'Patient', value: referral.patient_name },
            { name: 'Status', value: deadlineText },
            { name: 'Assigned Marketer', value: referral.assigned_marketer || 'Unassigned' },
            { name: 'Benefit Period', value: `Period ${referral.benefit_period_number || 'Unknown'}` },
            ...(referral.benefit_period_start ? [{
              name: 'Period Started', 
              value: new Date(referral.benefit_period_start).toLocaleDateString()
            }] : [])
          ]
        }
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'Schedule F2F Visit',
          target: [`${window.location.origin}/referrals/${referral.id}?action=schedule-f2f`]
        }
      ]
    };
  }

  /**
   * Build Teams notification payload for status changes
   */
  private buildStatusChangePayload(referral: Referral, oldStatus: string, newStatus: string): TeamsNotificationPayload {
    const statusColors = {
      admitted: '#7ED321',
      not_admitted_patient_choice: '#FF4B4B',
      not_admitted_not_appropriate: '#FF8C00',
      assessment_scheduled: '#4A90E2',
      pending_admission: '#50E3C2'
    };

    return {
      title: '📋 Referral Status Update',
      text: `Status changed for ${referral.patient_name}`,
      themeColor: statusColors[newStatus as keyof typeof statusColors] || '#4A90E2',
      summary: `Status: ${this.formatStatus(oldStatus)} → ${this.formatStatus(newStatus)}`,
      sections: [
        {
          activityTitle: 'Status Change',
          facts: [
            { name: 'Patient', value: referral.patient_name },
            { name: 'Previous Status', value: this.formatStatus(oldStatus) },
            { name: 'New Status', value: this.formatStatus(newStatus) },
            { name: 'Updated By', value: 'System' }, // Could be enhanced to track actual user
            { name: 'Assigned Marketer', value: referral.assigned_marketer || 'Unassigned' }
          ]
        },
        ...(referral.reason_for_non_admittance && newStatus.includes('not_admitted') ? [{
          activityTitle: 'Additional Information',
          facts: [{ name: 'Reason', value: referral.reason_for_non_admittance }]
        }] : [])
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'View Referral',
          target: [`${window.location.origin}/referrals/${referral.id}`]
        }
      ]
    };
  }

  /**
   * Send notification to Teams webhook
   */
  private async sendTeamsNotification(
    payload: TeamsNotificationPayload, 
    notificationType: string,
    referralId: string,
    webhookUrl: string
  ): Promise<void> {
    if (!webhookUrl) {
      console.warn('Teams webhook URL not configured for notification type:', notificationType);
      return;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Teams notification failed: ${response.statusText}`);
    }

    // Log successful notification
    await this.logSuccessfulNotification(notificationType, referralId, payload);
  }

  /**
   * Build HTML body for F2F appointment
   */
  private buildF2FAppointmentBody(referral: Referral): string {
    return `
      <h3>Face-to-Face Visit</h3>
      <p><strong>Patient:</strong> ${referral.patient_name}</p>
      ${referral.diagnosis ? `<p><strong>Diagnosis:</strong> ${referral.diagnosis}</p>` : ''}
      ${referral.insurance ? `<p><strong>Insurance:</strong> ${referral.insurance}</p>` : ''}
      <p><strong>Assigned Marketer:</strong> ${referral.assigned_marketer || 'Unassigned'}</p>
      <p><strong>Priority:</strong> ${referral.priority?.toUpperCase() || 'ROUTINE'}</p>
      
      <h4>Requirements:</h4>
      <ul>
        <li>Complete face-to-face evaluation</li>
        <li>Document patient condition and care needs</li>
        <li>Verify eligibility for hospice services</li>
        <li>Update referral status in system</li>
      </ul>
      
      ${referral.notes ? `<h4>Notes:</h4><p>${referral.notes}</p>` : ''}
      
      <p><em>This appointment was automatically scheduled based on benefit period requirements.</em></p>
    `;
  }

  /**
   * Format status for display
   */
  private formatStatus(status: string): string {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Log successful notification to database
   */
  private async logSuccessfulNotification(
    notificationType: string,
    referralId: string,
    payload: TeamsNotificationPayload
  ): Promise<void> {
    // Temporarily disabled - would log to teams_notifications table
    console.log('Would log successful notification:', notificationType, referralId);
  }

  /**
   * Log failed notification for retry
   */
  private async logFailedNotification(
    notificationType: string,
    referralId: string,
    error: any
  ): Promise<void> {
    // Temporarily disabled - would log to teams_notifications table
    console.log('Would log failed notification:', notificationType, referralId, error);
  }

  /**
   * Log calendar sync to database
   */
  private async logCalendarSync(
    referralId: string,
    eventId: string,
    eventType: string,
    eventDate: Date
  ): Promise<void> {
    // Temporarily disabled - would log to teams_calendar_sync table
    console.log('Would log calendar sync:', referralId, eventId, eventType);
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(): Promise<void> {
    // Temporarily disabled - would retry failed notifications from teams_notifications table
    console.log('Would retry failed notifications');
  }
}

export const teamsService = new TeamsIntegrationService();