# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Hospice referral tracking CRM for Elevate Hospice & Palliative Care. Single-page React app (Vite) backed by Supabase (Postgres + Auth + Edge Functions). It manages referrals, patients, partner organizations, scheduling/visits, hospice compliance (benefit periods / F2F), business-development activity, training, and an AI assistant.

This repo is also edited through the **Lovable** platform (see `LOVABLE_README.md`); changes made there are committed automatically. Keep edits compatible with that workflow.

## Commands

```bash
npm install        # or: bun install  (bun.lock is committed)
npm run dev        # Vite dev server on http://localhost:8080
npm run build      # production build
npm run build:dev  # build in development mode (sourcemaps, no minify)
npm run lint       # ESLint over the repo
npm run preview    # serve the production build
```

There is **no test runner configured** — no `npm test`, no test files. Don't assume a test harness exists; verify changes via `npm run build` + `npm run lint`.

### Supabase (local/edge)
Edge functions live in `supabase/functions/*/index.ts` (Deno). Deploy with the Supabase CLI, e.g. `supabase functions deploy <name>`. Function JWT settings are in `supabase/config.toml` — most functions run with `verify_jwt = false` and do their own auth. DB schema changes are tracked as ordered SQL files in `supabase/migrations/` (90+ files).

## Architecture

### Routing & layout (`src/App.tsx`)
- Everything except `/auth` is wrapped in `<ProtectedRoute>` → `<ProtectedLayout>` (sidebar + routed content).
- Index `/` redirects to `/my-day` (the default landing page, not `/dashboard`).
- Page components are in `src/pages/`; route names map closely to file names (e.g. `referrals` → `ReferralsPage`, detail routes `referral/:id`, `patient/:id`, `organizations/:id`).
- `admin/*` routes are additionally wrapped in `<AdminRoute>`.

### Auth & authorization
- Supabase Auth with **hard email-domain restriction to `@elevatehospiceaz.com`**, enforced client-side in `src/hooks/useAuth.tsx` (sign-in and sign-up) and server-side in the `validate-signup` edge function. Preserve this check when touching auth.
- `useAuth` is the source of truth for `user`, `session`, `roles`, and `isAdmin`. Roles come from the `user_roles` table.
- `useRole()` / `AdminRoute` / `ProtectedRoute` gate access. Use these rather than re-deriving role logic.
- `src/lib/featureFlags.ts` holds small per-email allow-lists for in-progress features (e.g. Ask Elevate AI). Gate new experimental features there.

### Data layer
- **`src/integrations/supabase/client.ts` and `types.ts` are auto-generated — do not hand-edit.** `types.ts` (3000+ lines) is the generated `Database` type; regenerate it from the schema rather than editing. Import the client as `import { supabase } from "@/integrations/supabase/client"`.
- Server state goes through **React Query** (`@tanstack/react-query`). The global client (in `App.tsx`) is configured `networkMode: 'offlineFirst'` with a 5-min `staleTime`. Mutations should invalidate the relevant query keys.
- Note the schema has **two related referral tables**: `referrals` and `hospice_referrals`. Check which one a feature uses before querying/writing.

### Offline-first PWA
This is a real offline app, not just cached assets:
- `vite-plugin-pwa` (config in `vite.config.ts`) with Workbox runtime caching. Supabase `rest/*` is `NetworkOnly`; `auth/*` is `NetworkFirst`.
- Writes made while offline are queued via `src/lib/offlineQueue.ts` and flushed by `useOfflineSync` (mounted in `App.tsx`). `OfflineBanner` shows connectivity. When adding mutations that must survive offline, route them through the queue rather than calling `supabase` directly.

### Domain logic (`src/lib/`)
Business rules live here, separate from components — read these before changing related UI:
- `benefitPeriodLogic.ts` — hospice benefit-period math and Face-to-Face (F2F) certification deadlines (90-day periods 1–2, 60-day periods 3+). Core compliance logic.
- `followUpLogic.ts` — referral follow-up scheduling rules.
- `validationSchemas.ts` — Zod schemas used with React Hook Form.
- `auditLog.ts` — writes to `admin_audit_log`; use for tracked admin actions.
- `webhookNotifier.ts` — client side of outbound notifications (actual delivery is server-side).
- `formatters.ts`, `geocode.ts`, `exportUtils.ts`, `constants.ts`, `utils.ts` (the shadcn `cn` helper).

### Edge functions (`supabase/functions/`)
Server-side logic and anything requiring secrets:
- AI: `ai-assist`, `ai-search`, `elevate-ops-chat` (the "Ask Elevate" / ops chat assistant).
- Maps: `get-mapbox-token`, `geocode-address`, `mapbox-directions` (Mapbox tokens never ship to the client).
- Notifications: `teams-webhook`, `notify-webhook`, `send-admission-email`.
- Admin: `admin-users` (privileged user management), `validate-signup` (domain enforcement).

### Microsoft Teams integration
Notification routing config is in `src/config/teamsRouting.ts`, but **all webhook URLs are intentionally blank client-side** — routing/delivery happens entirely in the `teams-webhook` edge function using `TEAMS_WEBHOOK_URL` secrets. Never put webhook URLs in client code. See `docs/teams-integration-setup.md`.

### Components (`src/components/`)
- `ui/` — shadcn/ui primitives (Radix-based). Add new shadcn components here; alias `@/` → `src/`.
- Feature folders mirror domains: `crm/`, `referrals/`, `dashboard/`, `kpis/`, `bd/`, `teams/`, `training/`, `stories/`, `map/`, `charts/`, `reports/`, `search/`, `settings/`, `notifications/`, `mobile/`, `offline/`, `onboarding/`, `value-props/`, `chat/`, `auth/`, `layout/`.

### Responsive / mobile
`useBreakpoint`/`use-responsive` drive layout; `MobileFAB` and the `mobile/` components provide a phone experience. The sidebar defaults open only on desktop.

## Conventions
- Path alias `@/` → `src/` (configured in `vite.config.ts` and `tsconfig`).
- UI feedback: Sonner toasts (`import { toast } from "sonner"`) plus the shadcn `Toaster`.
- Dates: `date-fns` is primary; `moment` is also present in places — prefer `date-fns` for new code.
- Manual chunks split `mapbox-gl` and chart libs (`recharts`, `react-big-calendar`) in `vite.config.ts`; keep heavy deps out of the main bundle.
- TypeScript is lenient here (`tsconfig` relaxes strict null/unused checks) — don't rely on strict-mode guarantees.
