# Elevate Hospice Referral Tracker - Lovable.dev Implementation Guide

This project is optimized for Lovable.dev development with comprehensive Teams integration and dynamic configuration.

## 🚀 Quick Start for Lovable.dev

### Project Structure
```
src/
├── components/
│   ├── crm/                    # Core referral management
│   │   ├── AddReferralDialog.tsx
│   │   ├── BenefitPeriodTracker.tsx
│   │   ├── F2FVisitIndicator.tsx
│   │   └── ReferringContactSelector.tsx
│   ├── teams/                  # Teams integration components
│   │   ├── TeamsNotificationDashboard.tsx
│   │   ├── TeamsConfigurationWizard.tsx
│   │   └── TeamsSettingsPanel.tsx
│   └── settings/               # Dynamic settings system
│       └── IntegrationSettings.tsx
├── services/
│   └── teamsIntegrationService.ts
├── hooks/
│   ├── useTeamsIntegration.ts
│   └── useSettings.ts
├── config/
│   └── teamsRouting.ts
└── lib/
    └── benefitPeriodLogic.ts
```

### Key Features Implemented

1. **Medicare Benefit Period Tracking** - Automatic F2F deadline calculation
2. **Teams Integration** - Smart notification routing with @mentions
3. **Referring Contact Management** - Track specific referrers vs organizations
4. **Dynamic Settings** - Runtime configuration without code changes
5. **F2F Visit Indicators** - Visual deadline alerts throughout the UI

## 🔧 Environment Variables for Lovable.dev

Add these to your Lovable.dev project environment:

```bash
# Supabase Configuration (already exists)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Teams Integration (add these)
VITE_TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/xxx-xxx-xxx
VITE_TEAMS_WEBHOOK_URGENT_URL=https://outlook.office.com/webhook/xxx-xxx-xxx
VITE_TEAMS_WEBHOOK_SCHEDULING_URL=https://outlook.office.com/webhook/xxx-xxx-xxx
VITE_TEAMS_WEBHOOK_SYSTEM_URL=https://outlook.office.com/webhook/xxx-xxx-xxx

# Application URL for Teams action buttons
VITE_APP_BASE_URL=https://your-lovable-app.lovable.app

# Optional: Multi-region support
VITE_TEAMS_WEBHOOK_REGION_A_URL=https://outlook.office.com/webhook/xxx-xxx-xxx
VITE_TEAMS_WEBHOOK_REGION_B_URL=https://outlook.office.com/webhook/xxx-xxx-xxx
```

## 📋 Database Migrations

The following migrations need to be applied to your Supabase instance:

1. **F2F & Benefit Period Tracking**: `supabase/migrations/20250806_add_f2f_benefit_period_tracking.sql`
2. **Referring Contacts**: `supabase/migrations/20250806_add_referring_contacts_management.sql`
3. **Teams Integration**: `supabase/migrations/20250806_add_teams_integration_tracking.sql`

## 🎯 Lovable.dev Implementation Notes

### What Works Out of Box
- ✅ All React components use modern hooks and TypeScript
- ✅ Supabase integration follows Lovable patterns
- ✅ TailwindCSS and shadcn/ui components throughout
- ✅ React Query for data fetching and caching
- ✅ Environment-based configuration

### What Needs Lovable.dev Attention
- 🔧 **Supabase Migrations**: Apply the 3 migration files to your database
- 🔧 **Environment Variables**: Add Teams webhook URLs to project settings
- 🔧 **Edge Function**: Deploy `supabase/functions/teams-webhook/index.ts`

### Recommended Lovable.dev Workflow

1. **Import Project**: GitHub import should bring in all components
2. **Apply Migrations**: Run the SQL migrations in Supabase dashboard
3. **Set Environment Variables**: Add Teams webhook URLs in Lovable settings
4. **Deploy Edge Function**: Upload the Teams webhook handler
5. **Test Integration**: Use the built-in configuration wizard

## 🛠️ Dynamic Settings System

The project includes a comprehensive settings system that allows runtime configuration without code changes:

### Settings Features
- **Teams Webhook Management**: Add/edit/test webhook URLs through UI
- **Team Member Configuration**: Manage @mentions and regional routing
- **Notification Preferences**: Enable/disable specific notification types
- **Testing Tools**: Send test messages to validate configuration
- **Configuration Import/Export**: Backup and restore settings

### Settings Access
Navigate to **Settings** → **Integrations** → **Teams Configuration**

## 📱 User Interface Components

### Core CRM Components
- **AddReferralDialog**: Enhanced with Teams notifications and referring contacts
- **BenefitPeriodTracker**: Visual F2F deadline tracking with progress indicators
- **F2FVisitIndicator**: Color-coded deadline alerts throughout the UI
- **ReferringContactSelector**: Choose specific referrer vs general organization

### Teams Components
- **TeamsNotificationDashboard**: Monitor all notifications, retry failed ones
- **TeamsConfigurationWizard**: Step-by-step setup for first-time users
- **TeamsSettingsPanel**: Runtime configuration and management

## 🔄 Automated Workflows

The system includes several automated workflows:

### Notification Triggers
- **New Referral** → Instant Teams notification with assigned marketer @mention
- **F2F Deadlines** → Escalating alerts (7 days → 3 days → overdue)
- **Status Changes** → Critical status notifications
- **System Events** → Integration health monitoring

### Smart Routing
- **Priority-based**: Urgent referrals → urgent channel
- **Region-based**: Route by assigned marketer's region
- **Type-based**: F2F alerts, scheduling, system messages
- **Fallback**: Always has default channel for safety

## 🧪 Testing Features

### Built-in Testing
- **Webhook Testing**: Send test messages to any configured channel
- **Configuration Validation**: Real-time validation of settings
- **Notification History**: Track all sent/failed notifications
- **Retry Mechanism**: Automatic and manual retry for failed notifications

### Test Data
The system includes sample data generators for:
- Sample referrals with various priorities and statuses
- F2F deadline scenarios (upcoming, overdue, completed)
- Team member configurations with realistic names and roles

## 🚀 Production Deployment

### Lovable.dev Deployment
1. **Build Process**: Standard Vite build works with all components
2. **Environment Variables**: Configured through Lovable settings
3. **Supabase Integration**: Existing connection works with new tables
4. **Edge Functions**: Deploy through Supabase CLI or dashboard

### Post-Deployment Setup
1. Run the configuration wizard in the deployed app
2. Test all webhook endpoints
3. Verify team member @mentions work correctly
4. Set up automated F2F deadline checking (runs hourly)

## 🔧 Customization Guide

### Adding New Notification Types
1. Extend `teamsRoutingConfig.ts` with new routing rules
2. Add new payload builder in `teamsIntegrationService.ts`
3. Update the dashboard to track new notification type
4. Add settings UI for the new notification

### Regional Customization
- Update team member mappings in `teamsRouting.ts`
- Add new regional webhook URLs to environment variables
- Extend marketer → region mapping logic

### UI Customization
All components use Tailwind CSS and shadcn/ui, making them easy to customize through:
- Color scheme updates in `tailwind.config.js`
- Component variants in shadcn/ui theme
- Custom styling through CSS variables

This implementation provides a robust, production-ready Teams integration that can be easily managed through the UI without requiring code changes!