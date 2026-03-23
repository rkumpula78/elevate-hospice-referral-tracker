// Teams notification routing configuration
// NOTE: All Teams webhook URLs are stored as Edge Function secrets (TEAMS_WEBHOOK_URL).
// Notifications are routed through the teams-webhook Edge Function — never from the client.

export interface TeamsRoutingConfig {
  byPriority: Record<string, string>;
  byOrgType: Record<string, string>;
  byMarketer: Record<string, string>;
  special: {
    f2fOverdue: string;
    f2fUpcoming: string;
    scheduling: string;
    systemAlerts: string;
  };
}

// All webhook URLs are empty client-side — routing is handled server-side in the teams-webhook Edge Function
export const teamsRoutingConfig: TeamsRoutingConfig = {
  byPriority: {
    urgent: '',
    routine: '',
    low: ''
  },
  byOrgType: {
    hospital: '',
    snf: '',
    physician_office: '',
    home_health: '',
    other: ''
  },
  byMarketer: {
    default: ''
  },
  special: {
    f2fOverdue: '',
    f2fUpcoming: '',
    scheduling: '',
    systemAlerts: ''
  }
};

// Team member mapping for @mentions
export const teamMemberMapping = {
  'John Smith': {
    id: 'john.smith@elevatehospice.com',
    name: 'John Smith',
    role: 'Senior Marketer'
  },
  'Sarah Johnson': {
    id: 'sarah.johnson@elevatehospice.com',
    name: 'Sarah Johnson',
    role: 'Referral Coordinator'
  },
  'Mike Davis': {
    id: 'mike.davis@elevatehospice.com',
    name: 'Mike Davis',
    role: 'Regional Manager'
  },
  'Lisa Wilson': {
    id: 'lisa.wilson@elevatehospice.com',
    name: 'Lisa Wilson',
    role: 'Clinical Liaison'
  },
  'David Brown': {
    id: 'david.brown@elevatehospice.com',
    name: 'David Brown',
    role: 'Intake Coordinator'
  }
};

/**
 * Determines the notification routing category based on referral data and notification type.
 * The actual webhook URL resolution happens server-side in the teams-webhook Edge Function.
 */
export function getNotificationCategory(
  referral: any,
  notificationType: 'new_referral' | 'f2f_deadline' | 'status_change' | 'system_alert',
  additionalContext?: { isOverdue?: boolean; daysUntilDeadline?: number }
): string {
  if (notificationType === 'f2f_deadline') {
    if (additionalContext?.isOverdue || (additionalContext?.daysUntilDeadline !== undefined && additionalContext.daysUntilDeadline < 0)) {
      return 'urgent';
    }
    if (additionalContext?.daysUntilDeadline !== undefined && additionalContext.daysUntilDeadline <= 3) {
      return 'urgent';
    }
    return 'routine';
  }
  
  if (notificationType === 'system_alert') {
    return 'system';
  }
  
  if (referral?.priority === 'urgent') {
    return 'urgent';
  }
  
  if (notificationType === 'status_change') {
    const criticalStatuses = ['not_admitted_patient_choice', 'not_admitted_not_appropriate', 'deceased_prior_admission'];
    if (criticalStatuses.includes(referral?.status)) {
      return 'urgent';
    }
  }
  
  return 'routine';
}

/**
 * @deprecated Use getNotificationCategory instead. Webhook URLs are resolved server-side.
 */
export function getWebhookUrl(
  referral: any,
  notificationType: 'new_referral' | 'f2f_deadline' | 'status_change' | 'system_alert',
  additionalContext?: { isOverdue?: boolean; daysUntilDeadline?: number }
): string {
  // Always return empty — webhooks are resolved server-side
  return '';
}

/**
 * Gets team member info for @mentions
 */
export function getTeamMemberMention(memberName: string) {
  const member = teamMemberMapping[memberName as keyof typeof teamMemberMapping];
  if (!member) return null;
  
  return {
    mention: `<at>${member.name}</at>`,
    entity: {
      type: "mention",
      text: `<at>${member.name}</at>`,
      mentioned: {
        id: member.id,
        name: member.name
      }
    }
  };
}

/**
 * Validates that Teams integration is configured.
 * Webhook URLs are stored as Edge Function secrets, not client-side env vars.
 */
export function validateTeamsConfiguration(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  return {
    isValid: true,
    errors: [],
    warnings: [
      'Teams webhook URLs are configured as Edge Function secrets. Check the Supabase dashboard to verify configuration.'
    ]
  };
}

export default teamsRoutingConfig;
