# Product Requirements Document

## Product vision

Elevate Referral App should be the dependable command center for receiving, triaging, coordinating, and converting hospice and palliative referrals. A staff member should always know what happened, what must happen next, who owns it, and whether communications were delivered.

## Primary users


| Persona               | Primary goal                                   | Failure to prevent                        |
| --------------------- | ---------------------------------------------- | ----------------------------------------- |
| Intake coordinator    | Capture a referral quickly and accurately      | Lost or incomplete referral               |
| Clinical liaison      | Evaluate eligibility and coordinate next steps | Missed evaluation or unclear handoff      |
| Marketer/BD           | Maintain referral-source relationships         | Incorrect attribution or stale follow-up  |
| Clinical/admin leader | Monitor workload, conversion, and compliance   | Misleading metrics or unauthorized access |
| System administrator  | Manage users, integrations, and reference data | Misconfiguration without visibility       |


## Product principles

1. **Truth over reassurance:** never display success until success is confirmed.
2. **Next action is obvious:** every active referral has an owner, due time, and next step.
3. **Progressive completeness:** collect minimum intake data first; clearly identify what is required before later milestones.
4. **Audit by design:** important changes are attributable and timestamped.
5. **Mobile is operational:** common tasks work comfortably from a phone.
6. **Metrics are explainable:** every number has a definition and drill-down.

## Canonical referral lifecycle

Use stable machine values and editable display labels:

1. `received`
2. `triage`
3. `contact_attempted`
4. `evaluation_scheduled`
5. `evaluated`
6. Terminal: `admitted`, `not_admitted`, `withdrawn`, `duplicate`, or `voided`

“Pending” may be a reason/flag, but should not become an indefinite workflow state. Every non-terminal referral must have `owner_id`, `next_action`, and `next_action_due_at`.

## Functional requirements

### Intake

- Allow a minimum viable referral with patient name, source, received time, service line, and intake owner.
- Label fields as “required now” or “required before evaluation/admission.”
- Save drafts and recover interrupted entries.
- Detect likely duplicates before submission and permit an authorized override with reason.
- Provide an explicit `is_test` control available only in non-production or to authorized admins.
- Preview notification recipients before submission when notifications will be triggered.

### Referral workspace

- Present summary, current stage, owner, SLA, next action, contact information, eligibility information, documents, and timeline.
- Allow inline next-action completion and scheduling.
- Record notes, calls, status changes, assignments, visits, documents, and notification results in one timeline.
- Separate clinical facts from operational notes.
- Show incomplete milestone requirements without blocking unrelated edits.

### Work management

- “My Day” is generated from ownership, deadlines, overdue tasks, and scheduled activities.
- Reassignment requires a new owner and optional handoff note.
- SLA breaches are visible and escalatable.
- Bulk actions require confirmation and respect permissions.

### Search and reporting

- Search by name, DOB, phone, referral source, physician, owner, and referral identifier.
- Saved views must retain filters, sort, and column configuration.
- Active metrics exclude test, voided, duplicate, and soft-deleted records unless explicitly selected.
- Every dashboard card links to the exact supporting record set.

### Administration

- Users see only navigation they are authorized to use.
- Admins can inspect integration health and delivery failures.
- Role changes and integration configuration changes are audited.

## Service-level expectations

- Urgent referral: first-contact target configurable, default 15 minutes.
- Routine referral: first-contact target configurable, default 60 minutes during business hours.
- P95 interactive page response: under 2 seconds on a normal broadband connection.
- Availability target: 99.9%, excluding scheduled maintenance.
- Notification status recorded for 100% of attempts.

## Product success metrics

- Median intake time below 2 minutes.
- Fewer than 1% of submissions blocked by unexpected validation.
- Zero false-positive notification success messages.
- 100% of active referrals have an owner and next action.
- 100% of operational counts exclude test/voided records.
- Reduced median time from received to first contact and evaluation.
- WCAG 2.2 AA for all critical workflows.

## Out of scope until P0/P1 are complete

- Autonomous clinical decisions.
- Broad AI automation that sends messages or changes status without human approval.
- Cosmetic dashboard expansion unsupported by trustworthy data definitions.
- New external integrations without delivery monitoring and auditability.