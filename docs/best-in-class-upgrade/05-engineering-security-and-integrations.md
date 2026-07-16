# Engineering, Security, and Integration Requirements

## Architecture guardrails

- Keep browser code untrusted; authorization and important validation belong on the server/database too.
- Use typed service results and never infer success from absence of a thrown exception.
- Use TanStack Query keys consistently and invalidate only affected data.
- Centralize domain types, validation schemas, statuses, and capabilities.
- Use Supabase migrations for schema changes and commit generated type updates.

## Notification architecture

Recommended flow:

1. Referral transaction creates an outbox event with a unique idempotency key.
2. Edge Function claims the event.
3. Provider request is attempted using server-side secrets.
4. Attempt and sanitized response are persisted.
5. Retry transient errors with bounded exponential backoff.
6. Permanent failures move to a dead-letter state and alert an administrator.
7. UI reads delivery status; it does not manufacture success.

Never place webhook URLs in frontend bundles. Test mode and automated tests use a fake provider.

## Security/privacy baseline

- Confirm a HIPAA-appropriate architecture and signed BAAs with vendors handling PHI.
- Enforce least privilege through Supabase RLS and server-side capability checks.
- Require MFA for privileged roles if supported by the chosen identity setup.
- Establish inactivity timeout and session revocation.
- Encrypt in transit and at rest using platform controls.
- Keep secrets in managed secret storage and rotate them on schedule or suspected exposure.
- Minimize PHI in logs, analytics, notifications, URLs, and AI prompts.
- Audit access to sensitive records, exports, and documents.
- Define retention, backup, recovery, incident response, and breach-response procedures.

This document is a product engineering specification, not a legal compliance determination. Compliance/security leadership should validate the final controls.

## Observability

- Structured logs with correlation IDs, no unnecessary PHI.
- Error monitoring for browser, Edge Functions, and database failures.
- Metrics for request latency, error rate, notification queue depth, retries, failures, and stale referrals.
- Alerts for sustained notification failure, auth anomalies, and migration errors.
- Admin health view showing configuration and delivery status without revealing secrets.

## CI/CD

Add scripts and pipelines for:

- Type checking
- ESLint
- Unit tests
- Integration/API tests
- Playwright E2E tests
- Automated accessibility scans
- Production build
- Dependency/security scanning
- Migration validation

Use preview/staging deployments and feature flags. Production releases require passing critical tests, migration backup/rollback readiness, and human approval.

## Performance

- Paginate large referral datasets server-side.
- Avoid loading full record sets to calculate counts.
- Add indexes based on measured query plans for stage, owner, due date, source, received date, and active/void predicates.
- Debounce search and cancel stale requests.
- Track Core Web Vitals and P95 API latency.

## AI safeguards

- AI output is advisory/draft unless explicitly approved by a human.
- Never allow AI to determine hospice eligibility autonomously.
- Do not send external messages or update referral state without confirmation.
- Ground policy/training answers in approved content and show sources.
- Defend against prompt injection in uploaded or retrieved content.
- Evaluate quality, PHI leakage, hallucination, and unsafe-action rates before release.

