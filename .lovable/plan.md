

## Reminder & Notification System — Implementation Plan

### Overview
Add an in-app notification center with a bell icon in the page header, auto-scheduling of follow-ups based on account rating, and reminder preference settings. Phased approach: Phase 1 covers in-app notifications + auto-scheduling.

---

### Phase 1 Deliverables

#### 1. Database: `user_preferences` table
New migration to create `user_preferences`:
- Columns: `id (uuid PK)`, `user_id (uuid, NOT NULL)`, `preference_key (text)`, `preference_value (text)`, `created_at`, `updated_at`
- Unique constraint on `(user_id, preference_key)`
- RLS: users can read/write only their own rows
- Seed keys: `reminder_browser_push`, `reminder_email_digest`, `reminder_hours_before` (defaults: off, off, 24)

#### 2. Auto-Scheduling Follow-Ups by Account Rating
Modify `QuickLogActivitySheet.tsx` — instead of hardcoded `+7 days`, fetch the organization's `account_rating` and compute:
- A → 3 days, B → 7 days, C → 14 days, D → 21 days

Also update `ActivityCommunicationsLog.tsx` (the full activity form) if it sets follow-up dates, to use the same logic. Extract a shared utility `getFollowUpDays(rating: string): number` in `src/lib/followUpLogic.ts`.

The organization's `account_rating` is already available in the `OrganizationDetail` page context — pass it as a prop to `QuickLogActivitySheet`.

#### 3. In-App Notification Center
**New component: `src/components/notifications/NotificationCenter.tsx`**
- Bell icon button with unread count badge
- Opens a Sheet/Popover panel listing:
  - **Overdue** follow-ups (red) — `follow_up_date < today AND follow_up_completed = false`
  - **Due today** (amber) — `follow_up_date = today`
  - **Due tomorrow** (blue) — `follow_up_date = tomorrow`
  - **Recent referral status changes** — query `referral_status_history` for last 7 days
- Each item is tappable → navigates to the org or referral detail page
- Unread count = overdue + due today items
- Data fetched via React Query with 60s refetch interval (reuses existing sidebar queries pattern)

**Integration point: `PageLayout.tsx`**
- Add the `NotificationCenter` bell icon in the header bar, between the title area and the search bar (or in the `actions` slot area on the right side of the header)

#### 4. Reminder Settings in Settings Page
**New component: `src/components/settings/ReminderSettings.tsx`**
- Toggle: Browser push notifications (on/off)
- Toggle: Daily email digest (on/off) — labeled "Coming soon" for Phase 3
- Dropdown: Remind me X hours before (1h, 2h, 24h)
- Reads/writes to `user_preferences` table
- When browser push is toggled on, request `Notification.permission`

**Integration: `SettingsPage.tsx`** — add the Reminders card between the Onboarding Tour card and My Templates.

#### 5. Browser Notification Polling (Phase 1 - Basic)
- When the app is open and push is enabled, run a `setInterval` (every 5 minutes) checking for items due within the user's configured reminder window
- Fire `new Notification(...)` for any matching items not previously notified (track notified IDs in a React ref/Set)

---

### Files to Create
- `supabase/migrations/..._user_preferences.sql`
- `src/lib/followUpLogic.ts`
- `src/components/notifications/NotificationCenter.tsx`
- `src/components/settings/ReminderSettings.tsx`

### Files to Modify
- `src/components/layout/PageLayout.tsx` — add bell icon
- `src/components/crm/QuickLogActivitySheet.tsx` — accept `accountRating` prop, use dynamic follow-up days
- `src/pages/OrganizationDetail.tsx` — pass `accountRating` to QuickLogActivitySheet
- `src/pages/SettingsPage.tsx` — add ReminderSettings section
- `src/integrations/supabase/types.ts` — auto-updated after migration

### Technical Notes
- No edge functions needed for Phase 1; all queries run client-side
- The existing `referral_status_history` table provides recent status change data
- Notification permission is requested only on user action (toggle), not on page load
- Phase 2 (service worker push) and Phase 3 (EmailJS digest via cron + edge function) are deferred

