## Goal

Turn the freeform Monday-Friday recap emails into structured data in the CRM, so marketers log their week as they go and management can quickly see who is active, what was done, and what's coming next.

The good news: you already capture the underlying data — `bd_activities` (field visits, calls, in-services, co-visits, emails) and `referrals` (new intakes, evals scheduled, admits). We just need a **Weekly Activity** view that rolls these up by marketer / by week in the exact format your team writes today.

## What this builds

### 1. Weekly Activity page (`/weekly-activity`)
A new page reachable from the sidebar with three controls at the top:
- **Marketer** dropdown (defaults to "Me" for marketers; "All" for admins)
- **Week** picker (defaults to current week, prev/next arrows)
- **Export / Copy** button (copies a plain-text recap to the clipboard in the John/Susan format, and exports CSV/PDF)

Body shows a **Monday → Friday grid**, each day with:
- Activities logged that day grouped by type (Field Visits, Calls, Emails, In-Services, Co-Visits, Office/Meetings)
- Each item links to the organization
- New referrals created that day (patient name + status, links to referral)
- Status changes on existing referrals (e.g., "Eval Scheduled", "Admitted") pulled from `referral_status_history`
- Free-text "day note" the marketer can add (e.g., "Office F/U with Judith", "CRM training")

Footer of each week shows totals: visits, calls, emails, new referrals, evals scheduled, admits.

### 2. Management rollup (admins only)
At the top of the same page when "All" marketers is selected:
- Table of marketers × this week's totals (visits / calls / new referrals / admits / accounts touched)
- "Last activity logged" timestamp per marketer — red if >2 business days ago
- Click a row to drill into that marketer's week view

### 3. Quick "Day Note" capture
Small button on the dashboard and on the Weekly Activity page: **"Add note for today"** — captures things that aren't a visit or call (chamber meetings, training, market research, office time). Stored in a new lightweight `marketer_day_notes` table so they show up in the weekly recap without polluting `bd_activities`.

### 4. Sidebar entry
New nav item **"Weekly Activity"** under the Marketing/CRM group, with a small badge showing "X activities this week" for the current user.

## What does NOT change

- `bd_activities`, `activity_communications`, `referrals`, `referral_status_history` schemas stay as-is — this is a read view over existing data plus one new small table for day notes.
- Existing Log Visit / Quick Log Activity flows stay the same; they're what feed this page.
- No changes to permissions model — marketers see their own data, admins see all (uses existing `has_role` / `is_admin`).

## Technical notes

- New table `marketer_day_notes` (user_id, note_date, content) with RLS: users manage their own; admins read all. Standard GRANTs + service_role.
- New page `src/pages/WeeklyActivityPage.tsx` + components `WeeklyGrid.tsx`, `MarketerRollupTable.tsx`, `DayNoteDialog.tsx`.
- Data fetched with React Query in one batched call per week (bd_activities + referrals created + status_history + day_notes) filtered by `assigned_marketer` and date range.
- Copy-to-clipboard format mirrors the John/Susan recap structure so the team can paste it straight into chat/email.
- Route added in `src/App.tsx`; sidebar entry in `AppSidebar.tsx`.

```text
┌─ Weekly Activity ───────────── [ Marketer: John ▾ ] [ ◀ Jun 8–12 ▶ ] [ Copy / Export ]
│
│ Mon Jun 8 — Field Visits (5)
│   • Immanuel Campus      • Freedom Plaza Care    • The Forum at Desert Harbor
│   • Peoria Post Acute    • Lake Pleasant Post Acute
│   Day note: —
│
│ Tue Jun 9 — Office, Email Outreach (5), Market Research
│   Emails: Sunview Health, Sun City Health, ...
│   New referral: Adele Araza — Eval Scheduled
│   Day note: Created 7 orgs for Healthy U Clinics
│
│ ... Wed / Thu / Fri ...
│
│ Totals: 18 visits · 12 calls · 10 emails · 2 new referrals · 1 admit
└────────────────────────────────────────────────────────────────────────────
```

## Open question

Should the **"Day Note"** be one free-text field per day (simple, matches today's style) or a small structured list (meeting, training, admin, market research) so management can filter? I'd recommend free-text for v1 and add categories later if useful — let me know if you'd rather start structured.
