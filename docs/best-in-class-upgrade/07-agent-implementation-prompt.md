# Lovable / Claude Implementation Prompt

Copy the prompt below into Lovable or Claude together with this repository.

---

You are improving the Elevate Hospice Referral App, a React/TypeScript/Vite/shadcn/Supabase application. Read every file in `docs/best-in-class-upgrade/` before changing code. Treat `README.md` in that directory as the governing order of work.

## Objective

Implement the P0 backlog safely, beginning with notification truthfulness. Do not start P1–P4 until the P0 release gates pass.

## Required working method

1. Inspect the current implementation and Supabase schema before proposing changes. Specifically inspect:
   - `src/hooks/useTeamsIntegration.ts`
   - `src/services/teamsIntegrationService.ts`
   - `supabase/functions/teams-webhook/`
   - `src/lib/validationSchemas.ts`
   - referral create/edit components
   - referral list/count queries
   - `src/App.tsx`
   - `src/components/auth/AdminRoute.tsx`
   - `src/hooks/useRole.tsx`
   - `src/components/layout/AppSidebar.tsx`
   - relevant Supabase migrations and RLS policies
2. Produce a short implementation plan listing files, schema changes, tests, risks, and rollback steps.
3. Make small, reviewable changes. Do not combine unrelated P0 items into one opaque rewrite.
4. Add or update automated tests for every behavioral change.
5. Validate type checking, lint, tests, production build, and migration safety.
6. Report what changed, what was verified, remaining risks, and any manual configuration required.

## First implementation target: notification truthfulness

- Replace fire-and-forget/void return behavior with a typed delivery result.
- Missing webhook configuration must never produce a success toast.
- Persist or otherwise expose auditable attempt status.
- Keep webhook secrets server-side.
- Prevent duplicate notifications.
- Suppress notifications for test referrals.
- Implement NT-01 through NT-06 from `06-acceptance-tests.md`.

## Safety constraints

- Do not use real patient data.
- Do not send real Teams/email/SMS/fax messages during development or testing.
- Do not disable or weaken RLS.
- Do not expose credentials or webhook URLs.
- Do not run destructive production migrations.
- Do not claim success based only on a toast or lack of an exception.
- Preserve existing production data and history.

## Definition of done for each change

- Acceptance criteria are explicitly mapped to tests.
- Error, loading, empty, and success states are handled.
- Keyboard and screen-reader behavior is considered.
- Permissions are enforced server-side.
- Logs contain no unnecessary PHI.
- Rollback is documented.
- The repository builds cleanly.

Begin by summarizing the current notification execution path and explaining exactly why the UI can report success when no webhook is configured. Then propose the smallest safe fix and wait for approval before changing schema or production configuration.

---

## Follow-on prompts

After P0.1 is verified, use one prompt per backlog item:

> Implement P0.2 from `docs/best-in-class-upgrade/02-prioritized-backlog.md`. Follow all package guardrails and acceptance tests. First inspect the current schema and deployment configuration, then provide a file-by-file plan and rollback strategy.

Repeat for P0.3, P0.4, and P0.5. Avoid asking an agent to “implement everything” in a single run.

