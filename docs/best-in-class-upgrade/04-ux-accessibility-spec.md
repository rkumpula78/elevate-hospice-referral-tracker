# UX and Accessibility Specification

## Global requirements

- One `main` landmark per page, with a “Skip to main content” link.
- Logical heading order beginning with one H1.
- Every input has a persistent visible label; placeholders are examples only.
- Every icon-only control has an accessible name and tooltip.
- Keyboard focus is visible and follows visual order.
- Touch targets are at least 44×44 CSS pixels.
- Status is communicated by text/icon as well as color.
- Errors identify the field, explain the problem, and suggest correction.
- Toasts are supplementary; important results remain visible in context.
- Dialogs trap focus, name their purpose, support Escape where safe, and restore focus on close.

## Referral intake

- Show step names and current progress.
- Mark “required now” separately from “required later.”
- Preserve values when navigating backward.
- Autosave a draft after meaningful changes and show last-saved time.
- Before submit, summarize the record, likely duplicates, and planned notifications.
- Final action text should be specific: “Create referral and notify Intake Team.”
- For tests, use “Create test referral—notifications suppressed.”

## Referral detail

Above the fold, display:

- Patient display name and test/voided banner
- Stage and priority
- Owner
- Next action and due time
- Referral age/SLA state
- Primary actions appropriate to the current stage

Use tabs or sections for Overview, Timeline, Clinical/Eligibility, Contacts, Documents, and Audit. Do not hide the next action inside a tab.

## Referral list

- Desktop: sortable table with labeled selection and action controls.
- Mobile: cards showing name, stage, source, owner, due status, and one clear next action.
- Filters have visible labels and an active-filter summary.
- “Showing X of Y” uses the same filtered query as rows.
- Saved views include filters, sort, and columns.
- Zero results distinguish “no referrals exist” from “no results match filters.”

## Feedback states

Every asynchronous action needs:

1. In-progress state that prevents accidental duplication.
2. Confirmed success tied to a persisted/provider-confirmed result.
3. Actionable error with retry or recovery.
4. Stable result in the page—not only a disappearing toast.

For notifications, show `Queued`, `Delivered`, `Failed`, or `Suppressed`, with timestamp and recipient/channel.

## Content standards

- Prefer “Referral source” over ambiguous “Organization” where context requires it.
- Use sentence case.
- Avoid technical provider errors in the main UI; expose details to admins with a correlation ID.
- Use “Void referral” for an erroneous retained record, not “Delete.”
- Destructive confirmations name the record and explain reporting/audit effects.

## Accessibility verification

- Automated axe scan on every critical route.
- Keyboard-only test for intake, edit, status update, activity logging, search, and dialog workflows.
- Screen-reader smoke test with VoiceOver/Safari and NVDA/Chrome.
- Test 320, 390, 768, 1024, and 1440 px widths at 200% zoom.
- No critical workflow depends on hover, drag, or color alone.

