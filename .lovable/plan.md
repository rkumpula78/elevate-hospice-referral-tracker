## What's actually wrong

John Guerrero (`jguerrero@elevatehospiceaz.com`, user id `10268c8b-de33-4f0f-8ec7-0f078a2c3765`) has an account but his email was never confirmed:

- `email_confirmed_at`: **null**
- `last_sign_in_at`: **null** (he's never successfully signed in)
- Created 4/21/2026

Supabase blocks login on unconfirmed emails with the exact error he's seeing ("Email not confirmed" / "email not authenticated"). His row is fine — it just needs to be marked confirmed, or he needs a fresh link.

## Immediate fix for John (one-shot, no code)

I'll run a one-time admin update on his account to mark the email confirmed and set a fresh temporary password you can share with him. Two SQL/admin actions:

1. Set `email_confirmed_at = now()` on his auth user (so login is no longer blocked).
2. Reset his password to a temporary value you can hand him; he changes it on first sign-in.

After that he can sign in with the temp password.

## Permanent admin tooling (so this never requires the dev again)

Right now the **Admin → Users** page has "Resend Invite" and "Set Password" buttons, but no way to directly **mark a pending user as confirmed**. I'll add that.

### Changes

**1. Edge function `admin-users` — add a new action `confirm-email`**
   - Validates caller is admin (already in place).
   - Calls `adminClient.auth.admin.updateUserById(userId, { email_confirm: true })`.
   - Writes an `admin_audit_log` entry (`action: 'confirm_email'`).
   - Returns standard success/error JSON.

**2. `src/pages/AdminUsersPage.tsx`**
   - Add a new row action visible only when `status === 'pending'`: **"Confirm Email"** (CheckCircle icon).
   - Calls the new edge function action, shows a toast, refreshes the table.
   - Tighten the existing "Pending" badge with a tooltip explaining what it means ("User has not confirmed their email — they cannot log in until confirmed or sent a new link").

**3. UX polish on the login screen (small)**
   - In `src/components/auth/LoginForm.tsx`, when Supabase returns `Email not confirmed`, show a friendlier message telling the user to contact their admin or click the "Resend confirmation" link, instead of the raw Supabase string.

### Files touched

- `supabase/functions/admin-users/index.ts` — add `confirm-email` action
- `src/pages/AdminUsersPage.tsx` — new "Confirm Email" button on pending users
- `src/components/auth/LoginForm.tsx` — friendlier error mapping

### What you'll be able to do as admin after this ships

From **Admin → Users**, for any user with a **Pending** badge you'll have three buttons:

| Button | What it does | When to use |
|---|---|---|
| **Confirm Email** *(new)* | Instantly marks the account confirmed; user can log in with whatever password is on file | User lost/never got the confirmation email but you trust the address |
| **Resend Invite** *(existing)* | Sends a fresh signup/reset link to their email | You want the user to set their own password via email |
| **Set Password** *(existing)* | You type a temp password; user can sign in immediately | User can't access email or you need them in fast |

## Why not just always auto-confirm new admin-invite users?

`validate-signup` already does `email_confirm: true` for the admin-invite path, so this only affects users created via **self sign-up** — which is what John used originally. We could disable self-signup entirely (recommended per our prior security review), but that's a separate decision; the admin button covers all current and future cases regardless.

## After you approve

I'll do both: run the one-shot fix for John in the same step as the migration/code changes, so he can log in immediately and you have the permanent tooling going forward.
