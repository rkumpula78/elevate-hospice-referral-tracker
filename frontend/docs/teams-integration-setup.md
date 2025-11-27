# Microsoft Teams Integration Setup Guide

This guide walks through setting up the Teams integration for the Elevate Hospice Referral Tracker to send notifications to specific Teams channels and enable calendar integration.

## 🎯 Overview

The Teams integration provides:
- **Incoming Webhooks** for sending notifications to specific channels
- **Microsoft Graph API** for calendar integration
- **Targeted notifications** to the right people based on referral type/region
- **Rich message cards** with actionable buttons

## 📋 Prerequisites

- Microsoft Teams admin access
- Azure Active Directory app registration permissions
- Hospice team channels already created in Teams

---

## 🔗 Part 1: Teams Incoming Webhooks Setup

### Step 1: Create Team Channels

First, organize your Teams structure. Recommended channels:

```
📁 Elevate Hospice Team
  ├── 🏥 #referrals-general     (All new referrals)
  ├── ⚠️ #referrals-urgent      (High priority & overdue F2F)
  ├── 👥 #referrals-regional    (Region-specific notifications)
  ├── 📅 #scheduling           (F2F appointments)
  └── 🔧 #system-alerts        (Integration status)
```

### Step 2: Create Incoming Webhooks

For each channel that should receive notifications:

1. **In Teams, go to the target channel**
2. **Click the `...` (More options) next to channel name**
3. **Select "Connectors"**
4. **Find "Incoming Webhook" and click "Configure"**
5. **Enter webhook details:**
   - **Name**: `Hospice Referral Bot`
   - **Image**: Upload hospice logo (optional)
   - **Description**: `Automated referral notifications`
6. **Click "Create"**
7. **Copy the webhook URL** - you'll need this for environment variables

### Step 3: Configure Environment Variables

Add these to your `.env` file:

```bash
# Primary referral notifications (goes to #referrals-general)
REACT_APP_TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/xxx-xxx-xxx

# Urgent notifications (goes to #referrals-urgent)  
REACT_APP_TEAMS_WEBHOOK_URGENT_URL=https://outlook.office.com/webhook/xxx-xxx-xxx

# Regional notifications (optional - for multi-region hospices)
REACT_APP_TEAMS_WEBHOOK_REGION_A_URL=https://outlook.office.com/webhook/xxx-xxx-xxx
REACT_APP_TEAMS_WEBHOOK_REGION_B_URL=https://outlook.office.com/webhook/xxx-xxx-xxx

# F2F scheduling (goes to #scheduling)
REACT_APP_TEAMS_WEBHOOK_SCHEDULING_URL=https://outlook.office.com/webhook/xxx-xxx-xxx

# System alerts (goes to #system-alerts)
REACT_APP_TEAMS_WEBHOOK_SYSTEM_URL=https://outlook.office.com/webhook/xxx-xxx-xxx

# Base URL for action buttons in Teams messages
REACT_APP_BASE_URL=https://your-hospice-app.com
```

---

## 🔐 Part 2: Microsoft Graph API Setup (Calendar Integration)

### Step 1: Azure App Registration

1. **Go to [Azure Portal](https://portal.azure.com)**
2. **Navigate to "Azure Active Directory" → "App registrations"**
3. **Click "New registration"**
4. **Fill out the form:**
   - **Name**: `Hospice Referral Tracker`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: `Web` → `https://your-app.com/auth/callback`
5. **Click "Register"**

### Step 2: Configure API Permissions

1. **In your app registration, go to "API permissions"**
2. **Click "Add a permission"**
3. **Select "Microsoft Graph"**
4. **Choose "Delegated permissions"**
5. **Add these permissions:**
   - `Calendars.ReadWrite` - Create and modify calendar events
   - `User.Read` - Basic profile info
   - `offline_access` - Refresh tokens
6. **Click "Add permissions"**
7. **Click "Grant admin consent" (requires admin)**

### Step 3: Create Client Secret

1. **Go to "Certificates & secrets"**
2. **Click "New client secret"**
3. **Description**: `Hospice App Secret`
4. **Expires**: `24 months` (or as per policy)
5. **Click "Add"**
6. **Copy the secret value immediately** (you can't see it again)

### Step 4: Add to Environment Variables

```bash
# Microsoft Graph API
REACT_APP_AZURE_CLIENT_ID=your-app-client-id
REACT_APP_AZURE_CLIENT_SECRET=your-client-secret
REACT_APP_AZURE_TENANT_ID=your-tenant-id
REACT_APP_AZURE_REDIRECT_URI=https://your-app.com/auth/callback
```

---

## ⚙️ Part 3: Advanced Configuration

### Smart Routing Configuration

Create a configuration file for routing notifications to appropriate channels:

```typescript
// src/config/teamsRouting.ts
export const teamsRoutingConfig = {
  // Route by referral priority
  byPriority: {
    urgent: process.env.REACT_APP_TEAMS_WEBHOOK_URGENT_URL,
    routine: process.env.REACT_APP_TEAMS_WEBHOOK_URL,
    low: process.env.REACT_APP_TEAMS_WEBHOOK_URL
  },
  
  // Route by organization type
  byOrgType: {
    hospital: process.env.REACT_APP_TEAMS_WEBHOOK_URL,
    snf: process.env.REACT_APP_TEAMS_WEBHOOK_URL,
    physician_office: process.env.REACT_APP_TEAMS_WEBHOOK_URL
  },
  
  // Route by assigned marketer (if regional teams)
  byMarketer: {
    'John Smith': process.env.REACT_APP_TEAMS_WEBHOOK_REGION_A_URL,
    'Sarah Johnson': process.env.REACT_APP_TEAMS_WEBHOOK_REGION_B_URL,
    // Default for others
    default: process.env.REACT_APP_TEAMS_WEBHOOK_URL
  },
  
  // Special notification types
  special: {
    f2fOverdue: process.env.REACT_APP_TEAMS_WEBHOOK_URGENT_URL,
    scheduling: process.env.REACT_APP_TEAMS_WEBHOOK_SCHEDULING_URL,
    systemAlerts: process.env.REACT_APP_TEAMS_WEBHOOK_SYSTEM_URL
  }
};
```

### Team Member Tagging

To tag specific team members in notifications, you can include their Teams user IDs:

```typescript
// In your Teams notification payload
{
  "sections": [{
    "facts": [
      {
        "name": "Assigned Marketer", 
        "value": `<at>John Smith</at> - Please follow up`
      }
    ]
  }],
  "entities": [
    {
      "type": "mention",
      "text": "<at>John Smith</at>",
      "mentioned": {
        "id": "john.smith@yourhospice.com",
        "name": "John Smith"
      }
    }
  ]
}
```

---

## 📱 Part 4: Testing the Integration

### Test Script

Create a test button in your admin panel:

```typescript
// Test different notification types
const testNotifications = {
  newReferral: () => teamsService.notifyNewReferral(mockReferral),
  urgentF2F: () => teamsService.notifyF2FDeadline(mockReferral, -2), // 2 days overdue
  statusChange: () => teamsService.notifyStatusChange(mockReferral, 'new_referral', 'admitted')
};
```

### Verification Checklist

- [ ] New referral notifications appear in #referrals-general
- [ ] Urgent notifications go to #referrals-urgent  
- [ ] F2F scheduling notifications go to #scheduling
- [ ] Action buttons link back to correct referral
- [ ] Calendar integration creates events in correct calendars
- [ ] Failed notifications appear in dashboard for retry

---

## 🚀 Part 5: Production Deployment

### Supabase Edge Function Deployment

Deploy the Teams webhook handler:

```bash
# Deploy the Edge Function
supabase functions deploy teams-webhook

# Set environment variables for the function
supabase secrets set TEAMS_WEBHOOK_URL=your-webhook-url
supabase secrets set TEAMS_WEBHOOK_URGENT_URL=your-urgent-webhook-url
supabase secrets set APP_URL=https://your-app.com
```

### Environment Variables Summary

Production `.env` should include:

```bash
# Teams Webhooks
REACT_APP_TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/xxx
REACT_APP_TEAMS_WEBHOOK_URGENT_URL=https://outlook.office.com/webhook/xxx
REACT_APP_TEAMS_WEBHOOK_SCHEDULING_URL=https://outlook.office.com/webhook/xxx

# Azure/Graph API
REACT_APP_AZURE_CLIENT_ID=your-client-id
REACT_APP_AZURE_CLIENT_SECRET=your-client-secret  
REACT_APP_AZURE_TENANT_ID=your-tenant-id

# App URLs
REACT_APP_BASE_URL=https://your-hospice-app.com
```

---

## 🎯 Part 6: Team Training

### For Staff Using Teams

**What to expect:**
- 🔔 Real-time notifications for new referrals
- ⚠️ Urgent alerts for overdue F2F visits
- 📋 Status update confirmations
- 🔗 Direct links to take action in the app

**How to respond:**
1. **Click notification links** to go directly to referral details
2. **Use @mentions** to assign tasks to team members
3. **React with emojis** to acknowledge notifications
4. **Reply in channel** for team coordination

### For Administrators

**Monitor integration health:**
- Check Teams Notification Dashboard weekly
- Retry any failed notifications
- Review notification volume and adjust routing
- Update webhook URLs if channels change

---

## 🔧 Troubleshooting

### Common Issues

**Notifications not appearing:**
- Verify webhook URLs are correct and active
- Check Supabase Edge Function logs
- Ensure environment variables are set

**Calendar integration not working:**
- Verify Azure app permissions granted
- Check if user is authenticated with Graph API
- Ensure tenant ID is correct

**Wrong channel receiving notifications:**
- Review routing configuration
- Check environment variable mappings
- Verify webhook URLs match intended channels

**Mentions not working:**
- Ensure user IDs are correct email addresses
- Verify users are members of the Teams organization
- Check message card format includes entities array

---

This setup ensures your Teams integration delivers the right notifications to the right people at the right time, creating an efficient workflow for your hospice referral team!