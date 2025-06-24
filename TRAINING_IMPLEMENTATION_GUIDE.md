# Training Functionality Implementation Guide

## Overview
The training functionality has been fully integrated into your Elevate Hospice Referral Tracker with comprehensive content for partnership development.

## What's Been Implemented

### 1. Database Structure
- **organization_training_modules** - Stores value propositions, action plans, and best practices
- **organization_checklists** - Phase-based checklists for partnership development
- **checklist_completions** - Tracks progress per organization
- **organization_kpis** - Performance metrics tracking
- **marketer_training_progress** - Individual training completion tracking

### 2. UI Components
- **OrganizationTraining** - Displays training content within each organization
- **TrainingDashboard** - Overview of marketer progress
- **TrainingPage** - Dedicated training center
- Integration with existing organization detail pages

### 3. Content Seeded
- **Assisted Living Facilities** - Complete content including:
  - Value propositions for all stakeholders (ED, DON, Marketing, Social Services)
  - 90-day implementation roadmap
  - Key qualifying questions
  - Comprehensive KPIs
  - 6 phase-based checklists (90 days)

- **Cancer Centers** - Complete content including:
  - Value propositions for oncologists, nurse navigators, social workers, administrators
  - 90-day partnership plan
  - Specialized programs
  - Cancer-specific KPIs
  - 6 phase-based checklists

## Next Steps to Go Live

### 1. Run Database Migrations
```bash
# Apply the database schema
npx supabase migration up

# Or if using Supabase CLI
supabase db push
```

### 2. Seed Training Content
```bash
# Run the seed file
npx supabase db seed -f supabase/migrations/20250117_training_content_seed.sql

# Or execute directly
psql $DATABASE_URL -f supabase/migrations/20250117_training_content_seed.sql
```

### 3. Test the Features
1. Start your development server
2. Navigate to any organization (create test ones for each type)
3. Click the "Training & Resources" tab
4. Test checking off checklist items
5. Visit `/training` to see the dashboard

### 4. Connect Authentication
Update `src/components/training/TrainingDashboard.tsx` line 19:
```typescript
// Replace this:
const marketerName = "Current Marketer";

// With actual auth:
const { user } = useAuth();
const marketerName = user?.user_metadata?.full_name || user?.email || "Unknown";
```

### 5. Expand Content for Other Types
Add similar comprehensive content for:
- Hospitals
- Physician Offices  
- Skilled Nursing Facilities
- Home Health Agencies

Use the same structure as Assisted Living and Cancer Centers.

## Features Available

### For Marketers
- Context-specific value propositions by stakeholder role
- Interactive checklists with progress tracking
- 90-day action plans with phased approach
- KPI tracking and success metrics
- Training progress dashboard

### For Administrators
- Track marketer training completion
- Monitor partnership development progress
- Analyze KPIs across all organizations
- Quarterly review frameworks

## Customization Options

### Adding New Content
1. Add new modules to the seed file
2. Follow the JSONB structure for consistency
3. Re-run the seed file

### Modifying Checklists
1. Update the items array in the checklists table
2. Add priority levels: high, medium, low
3. Organize by phase: foundation, engagement, optimization

### Creating Custom Programs
1. Add new entries to organization_training_modules
2. Set module_category to 'best_practice'
3. Include structured content with components

## Troubleshooting

### If migrations fail
- Check Supabase connection
- Ensure tables don't already exist
- Run migrations individually

### If content doesn't appear
- Check organization type matches exactly
- Verify is_active = true
- Check browser console for errors

### Performance optimization
- Content is loaded per organization type
- Checklists are cached after first load
- Progress updates are optimistic

## Support
For questions or issues:
1. Check the Supabase logs
2. Verify all migrations ran successfully
3. Ensure proper authentication is set up 