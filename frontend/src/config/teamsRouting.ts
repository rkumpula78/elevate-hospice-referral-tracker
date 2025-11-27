// Teams notification routing configuration
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

export const teamsRoutingConfig: TeamsRoutingConfig = {
  // Route by referral priority
  byPriority: {
    urgent: process.env.REACT_APP_TEAMS_WEBHOOK_URGENT_URL || process.env.REACT_APP_TEAMS_WEBHOOK_URL || '',
    routine: process.env.REACT_APP_TEAMS_WEBHOOK_URL || '',
    low: process.env.REACT_APP_TEAMS_WEBHOOK_URL || ''
  },
  
  // Route by organization type
  byOrgType: {
    hospital: process.env.REACT_APP_TEAMS_WEBHOOK_URL || '',
    snf: process.env.REACT_APP_TEAMS_WEBHOOK_URL || '',
    physician_office: process.env.REACT_APP_TEAMS_WEBHOOK_URL || '',
    home_health: process.env.REACT_APP_TEAMS_WEBHOOK_URL || '',
    other: process.env.REACT_APP_TEAMS_WEBHOOK_URL || ''
  },
  
  // Route by assigned marketer (regional teams)
  byMarketer: {
    'John Smith': process.env.REACT_APP_TEAMS_WEBHOOK_REGION_A_URL || process.env.REACT_APP_TEAMS_WEBHOOK_URL || '',
    'Sarah Johnson': process.env.REACT_APP_TEAMS_WEBHOOK_REGION_B_URL || process.env.REACT_APP_TEAMS_WEBHOOK_URL || '',
    'Mike Davis': process.env.REACT_APP_TEAMS_WEBHOOK_REGION_A_URL || process.env.REACT_APP_TEAMS_WEBHOOK_URL || '',
    'Lisa Wilson': process.env.REACT_APP_TEAMS_WEBHOOK_REGION_B_URL || process.env.REACT_APP_TEAMS_WEBHOOK_URL || '',
    'David Brown': process.env.REACT_APP_TEAMS_WEBHOOK_REGION_A_URL || process.env.REACT_APP_TEAMS_WEBHOOK_URL || '',
    // Default fallback
    default: process.env.REACT_APP_TEAMS_WEBHOOK_URL || ''
  },
  
  // Special notification routing
  special: {
    f2fOverdue: process.env.REACT_APP_TEAMS_WEBHOOK_URGENT_URL || process.env.REACT_APP_TEAMS_WEBHOOK_URL || '',
    f2fUpcoming: process.env.REACT_APP_TEAMS_WEBHOOK_URL || '',
    scheduling: process.env.REACT_APP_TEAMS_WEBHOOK_SCHEDULING_URL || process.env.REACT_APP_TEAMS_WEBHOOK_URL || '',
    systemAlerts: process.env.REACT_APP_TEAMS_WEBHOOK_SYSTEM_URL || process.env.REACT_APP_TEAMS_WEBHOOK_URL || ''
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
 * Determines the appropriate Teams webhook URL based on referral data and notification type
 */
export function getWebhookUrl(
  referral: any,
  notificationType: 'new_referral' | 'f2f_deadline' | 'status_change' | 'system_alert',
  additionalContext?: { isOverdue?: boolean; daysUntilDeadline?: number }
): string {
  
  // Special routing for F2F notifications
  if (notificationType === 'f2f_deadline') {
    if (additionalContext?.isOverdue || (additionalContext?.daysUntilDeadline !== undefined && additionalContext.daysUntilDeadline < 0)) {
      return teamsRoutingConfig.special.f2fOverdue;
    }
    if (additionalContext?.daysUntilDeadline !== undefined && additionalContext.daysUntilDeadline <= 3) {
      return teamsRoutingConfig.special.f2fOverdue; // Also route urgent upcoming to urgent channel
    }
    return teamsRoutingConfig.special.f2fUpcoming;
  }
  
  // System alerts
  if (notificationType === 'system_alert') {
    return teamsRoutingConfig.special.systemAlerts;
  }
  
  // Priority-based routing for urgent referrals
  if (referral.priority === 'urgent') {
    return teamsRoutingConfig.byPriority.urgent;
  }
  
  // Status change routing for critical statuses
  if (notificationType === 'status_change') {
    const criticalStatuses = ['not_admitted_patient_choice', 'not_admitted_not_appropriate', 'deceased_prior_admission'];
    if (criticalStatuses.includes(referral.status)) {
      return teamsRoutingConfig.special.f2fOverdue; // Use urgent channel for critical status changes
    }
  }
  
  // Regional routing by marketer
  if (referral.assigned_marketer && teamsRoutingConfig.byMarketer[referral.assigned_marketer]) {
    return teamsRoutingConfig.byMarketer[referral.assigned_marketer];
  }
  
  // Priority-based routing
  if (referral.priority && teamsRoutingConfig.byPriority[referral.priority]) {
    return teamsRoutingConfig.byPriority[referral.priority];
  }
  
  // Default fallback
  return teamsRoutingConfig.byMarketer.default;
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
 * Validates that webhook URLs are configured
 */
export function validateTeamsConfiguration(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check primary webhook
  if (!process.env.REACT_APP_TEAMS_WEBHOOK_URL) {
    errors.push('Primary Teams webhook URL (REACT_APP_TEAMS_WEBHOOK_URL) is not configured');
  }
  
  // Check optional webhooks
  if (!process.env.REACT_APP_TEAMS_WEBHOOK_URGENT_URL) {
    warnings.push('Urgent webhook URL not configured - urgent notifications will go to primary channel');
  }
  
  if (!process.env.REACT_APP_TEAMS_WEBHOOK_SCHEDULING_URL) {
    warnings.push('Scheduling webhook URL not configured - scheduling notifications will go to primary channel');
  }
  
  if (!process.env.REACT_APP_TEAMS_WEBHOOK_SYSTEM_URL) {
    warnings.push('System alerts webhook URL not configured - system alerts will go to primary channel');
  }
  
  // Check regional webhooks
  if (!process.env.REACT_APP_TEAMS_WEBHOOK_REGION_A_URL && !process.env.REACT_APP_TEAMS_WEBHOOK_REGION_B_URL) {
    warnings.push('Regional webhook URLs not configured - all notifications will go to primary channels');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export default teamsRoutingConfig;