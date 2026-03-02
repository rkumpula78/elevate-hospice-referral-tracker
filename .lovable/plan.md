

## Plan: "My Day" Personalized Dashboard View

### Overview
Create a new `MyDayView` component that serves as a personalized daily action plan for hospice marketers. It will be accessible via a toggle at the top of the Dashboard page, switching between "My Day" and "Dashboard" views.

### Architecture

**New file:** `src/components/dashboard/MyDayView.tsx`
- Self-contained component with all 6 sections and their own TanStack Query hooks

**Modified file:** `src/pages/Dashboard.tsx`
- Add a view toggle (tabs) at the top: "My Day" | "Dashboard"
- Default to "My Day" view
- Conditionally render `MyDayView` or existing dashboard content

### Data Queries (all in MyDayView)

1. **Today's Schedule** — Query `activity_communications` where `activity_date` is today, join with `organizations(name, id)`. Render as vertical timeline with time, org name, activity type. Each item navigates to `/organizations/:id`.

2. **Overdue Follow-ups** — Query `activity_communications` where `follow_up_required = true`, `follow_up_completed = false`, `follow_up_date < today`. Join `organizations(name, id, phone)`. Show red-highlighted cards with days-overdue count. "Follow Up" button navigates to org detail.

3. **New Referrals to Review** — Query `referrals` where `status = 'new_referral'`, ordered by `created_at DESC`, join `organizations(name)`. Show first name + redacted last initial, source org, date.

4. **Accounts Due for Visit** — Query `organizations` that are active, then cross-reference with `activity_communications` to find last activity date. Show orgs where last visit > 14 days ago, sorted by longest gap. Display org name, days since last visit, account rating badge.

5. **Quick Stats Bar** — Three inline metrics: visits today (count activities today), referrals this week (count referrals since start of week), conversion rate this month (admitted / total referrals this month).

6. **Floating Action Button (mobile only)** — Use existing `FloatingActionButton` component + existing `QuickAddDialog` which already has "Add Referral", "Add Referral Source", "Schedule Visit" options.

### Mobile Features
- Pull-to-refresh using `react-simple-pull-to-refresh` (already installed), invalidating all My Day query keys
- FAB at bottom-right on mobile only
- Skeleton loading states for all sections

### Technical Details

- All queries use `useQuery` with descriptive keys like `['my-day-schedule']`, `['my-day-overdue']`, etc.
- Current user's `displayName` from `useAuth()` used as marketer filter where applicable (matching `assigned_marketer` or `completed_by` fields)
- The `AccountRatingBadge` component (existing) used for account rating display in the "Accounts Due" section
- Date utilities from `date-fns` (already installed)
- Overdue section placed at top for priority visibility

### Files to Create/Modify
1. **Create** `src/components/dashboard/MyDayView.tsx` — Main component (~300 lines)
2. **Modify** `src/pages/Dashboard.tsx` — Add tab toggle and conditional rendering (~15 lines changed)

