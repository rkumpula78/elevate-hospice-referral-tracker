# Data, Workflow, and Permissions Specification

## Data model direction

Do not implement this as an unreviewed copy/paste migration. First map the current Supabase schema and preserve existing identifiers and history.

### Referral fields

Recommended logical fields:

- Identity: `id`, `display_id`, `created_at`, `created_by`, `updated_at`
- Person: `first_name`, `middle_name`, `last_name`, `suffix`, `preferred_name`, `dob`
- Intake: `received_at`, `service_line`, `priority`, `source_organization_id`, `source_contact_id`
- Workflow: `stage`, `owner_id`, `next_action`, `next_action_due_at`, `stage_changed_at`
- Completion: `outcome`, `outcome_reason_code`, `outcome_notes`, `completed_at`
- Governance: `is_test`, `voided_at`, `voided_by`, `void_reason`, `archived_at`

Avoid parsing a permanent legal name from one free-text field. Compute `display_name` from structured fields.

## Lifecycle transition matrix

| From | Allowed next states | Required at transition |
|---|---|---|
| received | triage, duplicate, voided | owner, next action |
| triage | contact_attempted, evaluation_scheduled, not_admitted, withdrawn | triage result |
| contact_attempted | contact_attempted, evaluation_scheduled, withdrawn | attempt type and outcome |
| evaluation_scheduled | evaluated, withdrawn | scheduled time and assigned staff |
| evaluated | admitted, not_admitted | evaluation outcome and reason if not admitted |
| terminal state | reopened by authorized role only | reason and audit event |

All transitions must execute through a server-side function/transaction that validates permission, state, required fields, and audit logging.

## Audit events

Record append-only events for:

- Create and void
- Field changes to sensitive or operationally important values
- Stage and owner changes
- Document upload/download/delete
- Export
- Notification attempt/result
- User/role/integration configuration changes
- Break-glass access, if introduced

Each event includes actor, timestamp, action, entity, entity ID, correlation ID, and safe before/after metadata. Do not duplicate unnecessary PHI into the audit table.

## Count definitions

- **Active:** non-test, non-voided, non-duplicate referrals in non-terminal workflow stages.
- **Completed:** admitted/not-admitted/withdrawn within the selected period.
- **Archived:** retained but intentionally removed from routine work queues.
- **Test:** `is_test = true`; excluded from all operational metrics unless explicitly requested.
- **Voided:** erroneous record retained for audit; excluded from operational metrics.

List results and displayed total must be generated from the same query predicate.

## Capability model

Suggested capabilities:

- `referral.read`, `referral.create`, `referral.update`
- `referral.assign`, `referral.transition`, `referral.void`, `referral.reopen`
- `referral.export`, `referral.read_sensitive`
- `schedule.manage`
- `organization.manage`
- `report.view`, `report.export`
- `user.manage`, `role.manage`, `staff.manage`
- `integration.view`, `integration.manage`, `audit.view`

Map roles to capabilities in data, not scattered route conditionals. The UI reads capabilities for presentation; Supabase RLS and Edge Functions independently enforce them.

## Permission behavior

- Unauthorized navigation is hidden.
- Direct URL access renders an explicit 403 page.
- API/RLS rejects unauthorized requests regardless of UI.
- Export, void, role changes, and integration changes require elevated capabilities and audit events.
- Avoid revealing record existence through error-message differences.

## Migration requirements

1. Inventory current statuses, null rates, and duplicate values.
2. Create a reversible mapping from legacy to canonical states.
3. Backfill governance fields without changing active counts.
4. Reconcile pre/post counts by status, owner, source, and outcome.
5. Run migrations in staging against a sanitized production-like snapshot.
6. Document rollback and verify it before production deployment.

