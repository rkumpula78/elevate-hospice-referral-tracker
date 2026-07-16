# Acceptance and Test Specification

## Test environment rules

- Run write tests in staging with synthetic data.
- Prefix synthetic names with `E2E TEST — DELETE —` and use `is_test = true`.
- Mock all external providers unless a dedicated provider sandbox is configured.
- Cleanup must be automatic and verified.
- Tests must never include real patient information.

## Critical notification tests

| ID | Scenario | Expected result |
|---|---|---|
| NT-01 | Webhook is not configured | Referral saves; status is Failed/Suppressed; no success message |
| NT-02 | Provider accepts delivery | Status records provider-confirmed success and timestamp |
| NT-03 | Provider returns 4xx | Permanent failure shown with admin-remediation path |
| NT-04 | Provider returns 5xx/timeout | Queued retry; no duplicate referral or message |
| NT-05 | User double-clicks submit | One referral and one notification attempt |
| NT-06 | Test referral created | Notification suppressed and excluded from metrics |

## Referral lifecycle tests

- RF-01: Minimum valid intake creates a referral and assigns owner/next action.
- RF-02: Create and edit apply the same “required now” rules.
- RF-03: Later milestone requirements do not block unrelated edits.
- RF-04: Invalid lifecycle transition is rejected server-side.
- RF-05: Transition records actor, time, before/after stage, and reason.
- RF-06: Duplicate candidate appears before submission; no automatic merge occurs.
- RF-07: Voiding requires permission and reason and removes the record from active counts.
- RF-08: Reopening requires permission and creates an audit event.
- RF-09: List row count and total use identical predicates.
- RF-10: Test, voided, and duplicate records are excluded from operational reports.

## Authorization tests

- AU-01: Unauthorized admin navigation is not displayed.
- AU-02: Direct unauthorized URL returns an explicit 403 experience.
- AU-03: Direct API request is rejected by RLS/server checks.
- AU-04: Authorized admin can access the route.
- AU-05: Role/capability changes are audited.
- AU-06: Export permission is enforced separately from read permission.

## Accessibility tests

- AX-01: No critical axe violations on login, My Day, referrals, referral detail, intake, schedule, Training, or Ask ElevateAI.
- AX-02: Complete intake using keyboard only.
- AX-03: Focus enters and returns correctly for all dialogs.
- AX-04: Every interactive element has a meaningful accessible name.
- AX-05: Status and validation are announced to a screen reader.
- AX-06: Critical workflows function at 200% zoom and 320 px width.
- AX-07: Touch targets meet 44×44 px minimum.

## Performance/reliability tests

- PF-01: Referral list uses server-side pagination and does not fetch all rows.
- PF-02: P95 critical page interaction is below 2 seconds under agreed test conditions.
- PF-03: Retry after network interruption does not duplicate records.
- PF-04: Draft intake recovers after refresh/crash.
- PF-05: Backup restoration is tested and documented.

## Release checklist

- [ ] Product owner approves behavior and terminology.
- [ ] Clinical/compliance representative reviews PHI and audit implications.
- [ ] Database backup and rollback plan verified.
- [ ] Critical E2E, authorization, and accessibility tests pass.
- [ ] Counts reconciled before and after migration.
- [ ] Notification provider tested without real patient data.
- [ ] Monitoring and alerting enabled.
- [ ] Support/runbook and user-facing release notes prepared.
- [ ] Staged rollout and rollback owner identified.

