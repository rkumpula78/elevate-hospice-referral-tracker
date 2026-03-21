

## Marketer Weekly Prioritization Enhancements

Based on the five audit questions, here are the gaps and a plan to address the most impactful ones.

### What to Build

#### 1. "My Route This Week" View (highest impact)
Add a new tab or section in MyDayView that filters organizations by routing week tag (parsed from `partnership_notes` like "West Valley Week 1"). Shows:
- Only orgs for the current routing week (auto-detected or manually selected)
- Last contact date with color coding
- Overdue follow-ups count
- Quick-log button inline
- Sorted by priority (days since last contact × account rating weight)

#### 2. Activity Compliance Cards (for Ryan)
Add a section to the Reports page or a new admin widget showing per-marketer:
- Total activities logged this week/month
- % of assigned accounts contacted in current cycle
- Average notes length (quality proxy)
- Follow-up completion rate
- Goal vs. actual (pulls from `liaison_goals` table)

#### 3. Required Notes Validation
Add minimum validation to the Quick Log and Activity Log forms:
- `discussion_points` required (min 10 chars) for in-person visits
- `next_step` required when `follow_up_required` is checked
- Toast warning (not blocking) for very short notes

#### 4. Marketer Goal Widget in MyDayView
Surface the `liaison_goals` data as a progress bar widget: "This week: 8/15 visits, 3/10 calls, 0/2 lunch-and-learns"

### Technical Approach

**Files to modify:**
- `src/components/dashboard/MyDayView.tsx` — Add "My Route" section and goal progress widget
- `src/pages/ReportsPage.tsx` — Add marketer activity compliance report card
- `src/components/crm/QuickLogActivitySheet.tsx` — Add notes validation
- `src/components/crm/ActivityCommunicationsLog.tsx` — Add notes validation

**No database changes needed** — all data already exists in `organizations.partnership_notes`, `activity_communications`, and `liaison_goals`.

**Routing week detection:** Parse `partnership_notes` for "Week N" pattern, then use `Math.ceil(weekOfMonth / 1)` or let the marketer select which week they're on via a dropdown.

### Priority
Recommend building #1 (My Route) and #2 (Compliance Cards) first — these directly answer "what's missing that would change how the marketer prioritizes their week."

