
# Plan: Simplify & Focus the Elevate CRM

After reviewing the codebase, the core problem isn't missing features — it's **too many of them**, with three parallel "activity logging" systems and overlapping navigation. The app today has 18+ top-level pages, two account systems (`bd_accounts` + `organizations`), and three activity tables (`bd_activities`, `activity_communications`, plus inline activity logs on contacts).

A marketer should be able to: see what to do today → drive to it → log it in 60 seconds → see the pipeline move. Everything else is decoration.

---

## Guiding principles

1. **One source of truth per concept.** One accounts table, one activity table, one place to log a visit.
2. **Two personas, two homes.** Marketer = "My Day". Leadership/John = "BD Dashboard". Everything else is a drill-down.
3. **Cut anything not used weekly.** Hide vs delete: hide first behind admin/feature flag; delete after 2 weeks of disuse.
4. **Mobile-first stays.** The FAB + 60-second visit log is the heartbeat.

---

## Part 1 — Consolidate the data model

**Accounts:** Retire `bd_accounts` as a separate table. Migrate `tier`, `next_step`, `next_step_date`, `anneli_covisit_status` onto `organizations` (most fields already exist). Backfill the 18 known matches; create `organizations` rows for the remaining ~91 BD accounts with `assigned_marketer = 'John Guerrero'`. Keep Tier E ("DD Homes — Deferred") as a filter, not a separate workspace.

**Activities:** Standardize on `bd_activities` for all visit/call/email logging (it's the simpler, newer schema). Migrate any still-useful rows from `activity_communications` then deprecate that table for new writes. The org detail's "Activity Log" tab reads from `bd_activities` going forward.

**Result:** One Accounts page, one Activity stream, one Log Visit form everywhere.

---

## Part 2 — Collapse the navigation

Current sidebar has 11 visible items + 2 admin. Proposed:

```text
PRIMARY (always visible)
  My Day         (default landing — personalized for the signed-in marketer)
  Referrals      (pipeline + kanban)
  Accounts       (was: Organizations + BD Accounts merged)
  Schedule       (calendar + route map combined)
  BD Dashboard   (weekly review — leadership view)

TOOLS (collapsible)
  Territory Map
  Story Library
  Ask Elevate AI

INSIGHTS (collapsible, leadership)
  KPI Dashboard
  Analytics
  Reports

ADMIN (admin-only)
  Users · Care Team Staff · Settings
```

Removed/merged:
- **Patients** → folded into Referrals (a referral *is* a patient record; the separate page duplicates).
- **Marketing** → merged into Story Library (both are content libraries).
- **Compliance** → moved into Reports as a tab.
- **Training** → kept but moved under Tools (not used daily).
- **Map + Schedule** → combined; the "route this week" view belongs next to the calendar.

Net: 11 → 5 primary items.

---

## Part 3 — Unify "Log Activity" 

Today there are **four** entry points: BD `LogVisitSheet`, `QuickLogActivityDialog`, `QuickLogActivitySheet`, `MobileQuickActivitySheet`. Pick one (the BD `LogVisitSheet`, it's the cleanest), make it the single component, and mount it behind:
- the global FAB (mobile + desktop, all pages)
- the "+ Log Visit" button on Account detail (pre-fills org)
- the recent-activity feed row → edit mode

Delete the other three components.

---

## Part 4 — Sharpen "My Day" (the marketer's home)

Today `MyDayView` exists but the default route is the generic `Dashboard`. Make **My Day** the landing page for non-admins. It shows, in order:

1. **Today's route** — 3–6 accounts to visit, one-tap call/navigate/log.
2. **Overdue follow-ups** — count + list, one-tap dismiss or reschedule.
3. **Goal progress this week** — visits, co-visits, CRM same-day %.
4. **New referrals assigned to me** — quick-glance card.

Everything else from the old Dashboard (census, growth metrics, alerts) moves to the **BD Dashboard** (leadership) or is dropped.

---

## Part 5 — Sharpen "BD Dashboard" (leadership)

Already mostly built. Tighten:
- Remove the "Recent Activity Feed" from this page (it belongs on Accounts/Org detail).
- Keep: weekly metrics, pipeline-by-tier table, referral attribution, referral mix.
- Add a "Stuck accounts" widget: pre_referral status with no contact > 21 days.

---

## Part 6 — Cleanup checklist (code-level)

- Delete: `bd_accounts` table + `BDAccountsTab` references to it (already migrating).
- Delete components: `QuickLogActivityDialog`, `QuickLogActivitySheet`, `MobileQuickActivitySheet`, `MobileQuickReferralSheet` (consolidate into BD `LogVisitSheet` + `MobileFAB`).
- Delete pages: `PatientsPage`, `MarketingPage`, `CompliancePage` (content moved).
- Delete `PatientDetail` route — referral detail covers it.
- Audit `src/components/crm/` — there are 50+ components, many duplicates (e.g. `EditOrganizationDialog` + `EnhancedEditOrganizationDialog` + `EnhancedAddOrganizationDialog`). Keep the "Enhanced" versions, delete the originals.
- Audit `src/components/dashboard/` — drop widgets not used in My Day or BD Dashboard.

Estimated removal: ~30 component files, 3 pages, 1 table, ~3000 LOC.

---

## Part 7 — Rollout order

1. **Migration**: backfill `organizations` from `bd_accounts`, add missing columns, switch BDAccountsTab to read from `organizations` only. *(Already partially done.)*
2. **Nav refactor**: collapse sidebar to the 5+groups structure above; make `/my-day` the default.
3. **Activity consolidation**: route all log-visit entry points through `LogVisitSheet`; remove duplicates.
4. **Page deletions**: remove Patients/Marketing/Compliance pages and routes.
5. **Component cleanup**: delete duplicates from `crm/` and `dashboard/`.
6. **Polish**: stuck-accounts widget on BD Dashboard, My Day priority sort.

Each step ships independently and is reversible.

---

## Open questions before I start

1. **Patients page** — confirm OK to remove? Anyone using it standalone (vs always navigating from a referral)?
2. **Training** — is this actively used, or can it move to Settings/Admin?
3. **Tier E (DD Homes)** — keep as filter only, or fully archive (hide unless toggled)?
4. **Default landing** — make My Day the landing for marketers, BD Dashboard for John, current Dashboard for admins? Or one landing for everyone?

Answer these and I'll execute Parts 1–7 in order.
