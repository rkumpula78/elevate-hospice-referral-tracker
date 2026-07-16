# Prioritized Implementation Backlog

## P0 — Trust, safety, and data integrity (Sprint 1–2)

### P0.1 Correct notification truthfulness

**Evidence:** `src/hooks/useTeamsIntegration.ts` shows a success toast while `src/services/teamsIntegrationService.ts` can warn and return when no webhook exists.

**Implementation:**

- Return a typed result: `queued | delivered | failed | skipped` with message and attempt ID.
- Treat missing configuration as `failed` or explicitly `skipped`, never success.
- Move secret-bearing delivery to `supabase/functions/teams-webhook`.
- Persist delivery attempts and show failure/retry status.
- Prevent duplicate delivery with an idempotency key.

**Acceptance:** Cases NT-01 through NT-06 in the test specification pass.

### P0.2 Establish staging and synthetic test mode

- Separate staging Supabase project, secrets, webhooks, and deployment URL.
- Seed only fictional data.
- Add `is_test`, `void_reason`, `voided_at`, and `voided_by` fields or an equivalent normalized model.
- Test records display a prominent banner and are excluded from production metrics and notifications by default.

### P0.3 Unify create/edit validation

- Create a shared Zod schema in `src/lib/validationSchemas.ts`.
- Model requirements by lifecycle milestone, not by component.
- Validate again in the server/database layer.
- Permit editing one field without forcing unrelated later-stage fields.

### P0.4 Fix active counts and deletion semantics

- Define active, archived, voided, duplicate, and deleted precisely.
- Update list queries and `count` queries with identical filters.
- Replace ambiguous destructive language with “Void referral” for erroneous/test records.
- Require a reason and retain an immutable audit event.

### P0.5 Align authorization and navigation

- Inspect `src/App.tsx`, `src/components/auth/AdminRoute.tsx`, `src/hooks/useRole.tsx`, and `src/components/layout/AppSidebar.tsx`.
- Derive route guards and visibility from one capability source.
- Never rely on hidden navigation as authorization; enforce RLS/API checks.
- Add an Access Denied page rather than silently redirecting to My Day.

## P1 — Operational workflow (Sprint 3–5)

### P1.1 Canonical lifecycle and transition rules

- Migrate legacy statuses to the canonical lifecycle.
- Permit only defined transitions.
- Require reasons for terminal negative outcomes.
- Record transition actor, timestamp, old state, new state, and reason.

### P1.2 Ownership, next action, and SLA

- Require owner and next action for every active referral.
- Calculate due times using urgency and configured business hours.
- Surface due-soon/overdue state in My Day, referral list, and detail page.
- Support reassignment with handoff notes.

### P1.3 Duplicate detection

- Score candidates using normalized name, DOB, phone, address, and recent dates.
- Never merge automatically.
- Show differences side-by-side.
- Audit decisions to continue, link, or mark duplicate.

### P1.4 Unified timeline

- Normalize activity types.
- Include notification attempts and delivery outcomes.
- Make entries append-only, with corrections represented as new audit events.
- Provide filters and chronological ordering.

## P2 — UX and accessibility (Sprint 5–7)

- Implement the design/accessibility requirements in `04-ux-accessibility-spec.md`.
- Mobile card view for referrals.
- Labeled toolbar controls and a single page main landmark.
- 44×44 px minimum interactive targets.
- Consistent loading, empty, success, and failure states.
- Draft autosave and recovery.

## P3 — Reporting and integrations (Sprint 7–10)

- Metric dictionary and drill-through dashboards.
- Integration outbox, retries, dead-letter handling, and health screen.
- Source attribution and conversion reporting.
- Operational reports for unowned, overdue, stalled, and failed-notification referrals.

## P4 — Governed AI (after data trust is established)

- AI drafts only; human approval before external messages or workflow changes.
- Cite internal source material for policy answers.
- Redact/minimize PHI in prompts and logs.
- Record model, prompt version, user, and approval outcome without storing unnecessary PHI.
- Provide a clear non-clinical-use boundary.

## Recommended 30/60/90-day release plan

| Window | Deliverables | Release gate |
|---|---|---|
| Days 1–30 | Notification fix, staging, test mode, validation, count fix, RBAC/navigation | All P0 tests pass; rollback tested |
| Days 31–60 | Lifecycle, ownership/SLA, duplicate review, unified timeline | Migration reconciles counts; pilot users sign off |
| Days 61–90 | Mobile/accessibility, saved views, reporting definitions, integration health | WCAG audit and critical E2E suite pass |

