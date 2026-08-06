# Referral & Admission Reporting Dashboard

## The core problem to fix first

Today's Reports/Analytics pages count an admission as "current status = admitted". In the live data that is 56 records — but 189 referrals actually have an admission date, because once a patient is discharged or passes away the status changes and they drop out of the count. Every admission and conversion number in the app is currently understated by roughly 3x.

New rule for all reporting: **an admission is any referral with an admission date**, regardless of its current status. Referral volume is counted by referral date (falling back to created date).

## What gets built

A single reporting hub at `/reports`, reorganized into tabs, with one shared period filter (this month, last month, last 3/6/12 months, year to date, custom range) and CSV/print export on every section.

### Tab 1 — Overview
Top row of metric cards for the selected period, each with change vs. the prior equal period:
- Referrals received
- Admissions
- Conversion rate (admissions / referrals)
- Average days from referral to admission
- Active pipeline (open referrals not yet resolved)

Below: a combined monthly bar + line chart showing referrals and admissions side by side for the last 12 months, with the conversion-rate line overlaid.

### Tab 2 — Referral Sources
- Table of referring organizations: referrals, admissions, conversion rate, average days to admit, last referral date — sortable, with each row linking to the organization page.
- Source-type breakdown (physician office, assisted living, hospital, SNF, home health, other) as a share-of-volume chart plus admissions per type.
- Top-growing and declining sources: this period vs. prior period, so management can see which accounts are heating up or going quiet.

### Tab 3 — Admissions
- Month-by-month admissions list with patient, admit date, referring organization, referral-to-admit days, and current status (active / discharged / deceased).
- Admission source mix for the period.
- Outcome breakdown of everything referred in the period: admitted, declined, not appropriate, lost to follow-up, palliative outreach, still open.

### Tab 4 — Team
- Per-marketer referrals, admissions, conversion rate, and logged activity volume for the period.
- Keeps the existing Activity Compliance card.

### Data quality note surfaced in the UI
Some records are inconsistent (a handful of referrals dated in the future, 16 marked admitted with no admission date, activity where admission date exists on non-admitted statuses). The Overview tab gets a small "Data quality" link listing counts of these records so they can be cleaned up rather than silently skewing reports.

## Exports
Every table exports to CSV with the same rows shown on screen, and the whole page supports print-to-PDF for sharing with management, using the existing export utilities.

## Technical notes
- New shared hook (e.g. `src/hooks/useReferralReporting.ts`) holding the period logic and the canonical predicates: admissions = `admission_date is not null`; referral month = `coalesce(referral_date, created_at)`; open pipeline = statuses not in the resolved set. All tabs read from it so list totals and headline numbers always agree.
- Monthly aggregates run through a new `SECURITY DEFINER` SQL function (`get_referral_report(start, end)`) returning JSON, so the 434+ row scans and per-organization rollups happen in Postgres instead of pulling rows into the browser; per-row tables still query `referrals` directly with the explicit `organizations!organization_id` foreign-key hint.
- React Query keyed on the period; charts use the existing Recharts setup and chart export button; page uses `PageLayout` and mobile tab-scroll conventions.
- `AnalyticsPage` keeps its current role as the quick-glance view but is switched over to the same admission definition so it stops disagreeing with Reports.

## Out of scope for this pass
Scheduled/emailed reports, saved custom report builder, and census/compliance reporting (already covered on other pages).
