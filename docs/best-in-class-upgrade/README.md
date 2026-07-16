# Elevate Referral App — Best-in-Class Upgrade Package

**Audience:** Lovable, Claude Code, developers, product owners, and QA  
**Application:** `referrals.elevatehospiceaz.com`  
**Stack observed:** React 18, TypeScript, Vite, shadcn/Radix, Tailwind, TanStack Query, Supabase  
**Status:** Implementation specification based on a production end-to-end review on July 15, 2026

## Purpose

This package converts the production review into an implementation-ready program. The objective is a trustworthy, fast, accessible referral operating system—not merely a collection of UI fixes.

## Read this first

1. Read [01-product-requirements.md](01-product-requirements.md).
2. Implement the P0 work in [02-prioritized-backlog.md](02-prioritized-backlog.md) before new features.
3. Use [03-data-workflow-and-permissions.md](03-data-workflow-and-permissions.md) for schema and authorization decisions.
4. Apply [04-ux-accessibility-spec.md](04-ux-accessibility-spec.md) to every changed screen.
5. Follow [05-engineering-security-and-integrations.md](05-engineering-security-and-integrations.md) for implementation constraints.
6. Do not call a phase complete until [06-acceptance-tests.md](06-acceptance-tests.md) passes.
7. Use [07-agent-implementation-prompt.md](07-agent-implementation-prompt.md) as the initial Lovable or Claude prompt.

## Non-negotiable safety rules

- Never test with real patient data outside the authorized production workflow.
- Never send a real Teams/email/SMS/fax notification from automated tests.
- Create a staging Supabase project with synthetic seed data before broad changes.
- Do not weaken Row Level Security (RLS) to make a feature work.
- Do not expose service-role keys, webhook URLs, access tokens, or PHI in browser code or logs.
- Do not perform a destructive production migration without backup, rollback steps, and explicit approval.
- Preserve an immutable audit trail for referral and access changes.
- A notification is “sent” only after the provider confirms acceptance. Missing configuration is a failure, not success.

## Verified production observations

- Authentication and the primary referral list work.
- A synthetic referral could be created, viewed, updated with an activity note, and removed from the visible pipeline.
- Creation showed “Teams notification sent,” while the console reported `No webhook URL configured for new referral notifications`.
- Create allowed incomplete data that Edit later marked required.
- The visible total increased from 414 to 415 after creating and deleting the test record, while exact search returned zero, indicating count/soft-delete inconsistency.
- User Management and Care Team Staff links were visible but redirected to My Day for the tested account.
- Mobile avoided horizontal overflow, but included undersized touch targets and unlabeled controls.
- Ask ElevateAI and Training lacked a semantic main landmark during review.

## Definition of done for the program

- No false-success notification messages.
- Test/voided records never affect operational metrics.
- Create and edit share one validation contract.
- Navigation and API authorization use the same capability model.
- Core workflows meet WCAG 2.2 AA.
- Critical referral paths have automated end-to-end coverage.
- Every referral state change, access-sensitive action, and integration delivery has an auditable record.
- Product and engineering metrics in the PRD are measurable in production.

