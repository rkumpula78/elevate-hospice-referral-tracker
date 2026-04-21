

## Fix bundle: search, duplicates, schema error, admin promotions

### 1. Organizations search (top bar)
Add a debounced search input to `OrganizationsList.tsx` mirroring the Referrals search pattern (Ctrl/Cmd+K focus, X clear, result counter). Searches across: name, dba_name, contact_person, contact_email, phone, address, assigned_marketer, type.

### 2. Fix "benefit_period column not found" save error
**Root cause**: In `EditReferralDialog.tsx` line ~622, the Status/Notes tab `<Select>` is named `name="benefit_period"` but the database column is `benefit_period_number`. The form submit handler reads `formData.get('benefit_period')` and writes that key directly to Supabase.
**Fix**: Rename the `<Select name="benefit_period">` to `name="benefit_period_number"` and ensure the submit handler coerces it to integer (matches `AddReferralDialog` pattern).

### 3. Close-reason required for Closed status (Edit dialog)
The wizard already enforces this (`StepClinicalDetails`), but `EditReferralDialog` has no Close Reason field. Add a conditional `<Select name="reason_for_non_admittance">` with the same options (Patient Choice, Not Appropriate, Lost Contact, Deceased) that appears only when status === 'closed', and block submit with a toast if empty.

### 4. Duplicate-prevention on Add (Org + Patient/Referral)
- **Organizations** (`EnhancedAddOrganizationDialog`): on name blur (and before submit), query `organizations` for fuzzy name matches (`ilike %name%`). If matches found, show a "Possible duplicates" panel listing them with "Use this one" links and a "Continue anyway" confirm checkbox required to proceed.
- **Referrals/Patients** (wizard `StepPatientInfo` already has duplicate detection on patient name blur per memory): tighten so the Next button is disabled until the user explicitly acknowledges any matches via a "Not a duplicate, continue" checkbox.

### 5. Allow deleting duplicates
Add a row-level "Delete" action (trash icon, admin/healthcare-staff only) to:
- `OrganizationsList.tsx` list + card views — soft delete via `is_active = false` (or hard delete admin-only), with confirm AlertDialog.
- `PatientsList.tsx` — soft delete (`deleted_at = now()`) with confirm AlertDialog.
- Referrals already support bulk delete; add single-row delete to `ReferralCard` overflow menu for parity.

All deletes write to `admin_audit_log` and invalidate React Query caches.

### 6. Differentiate Palliative Outreach vs Referrals (visual + label)
- Add a colored left border + "Palliative" pill badge (amber) on any referral card whose status is `palliative_outreach` or `not_appropriate` so they stand out anywhere they appear (Referrals list, Kanban, Dashboard, Search results).
- In the Referrals page, the Palliative tab already filters separately; add a short helper line under the tab header explaining: *"Palliative Outreach tracks pre-hospice patients. Convert to Hospice by changing status to Admitted."*
- In the global Referrals list, exclude `palliative_outreach`/`not_appropriate` by default (with a toggle to include them) so the two pipelines are clearly separated.

### 7. Make Bethany & Jodie admins
Insert into `user_roles` (admin role) for:
- Bethany Odenbrett — `b1057a58-9e99-4d06-9276-0435d603dffd`
- Jodie Ramsey — `3da8b92a-8b9e-4972-9b41-605db069c231`

Logged in `admin_audit_log` with action `assign_admin_role`.

### 8. Fix "Create User Edge function returned an error"
Investigation: `AdminUsersPage.handleAddUser` calls `validate-signup` with both `password` and `mode: 'admin-invite'`, but the admin-invite branch only does `inviteUserByEmail` (which sends an invite — no password is set, and Supabase invite may reject when the email already has a pending invite, returning a generic 400 surfaced as "Edge function returned an error").

Fix:
- Update `validate-signup` admin-invite branch to: (a) if `password` is provided, use `adminClient.auth.admin.createUser({ email, password, email_confirm: true, user_metadata })` instead of `inviteUserByEmail`, so admins can directly create a working account; (b) return clearer error messages (currently generic "Failed to send invitation").
- Update the dialog to show the real error string from the function response.
- Make the "Password" field optional in the Add User dialog: if empty → invite flow; if provided → direct create flow.

### Technical notes
- All RLS already permits authenticated users for org/referral writes; no new policies needed.
- Soft-delete columns: `organizations.is_active` (existing), `patients.deleted_at` (verify exists, add migration if missing), `referrals.deleted_at` (existing).
- Edge function changes redeploy automatically.
- No schema changes needed for the `benefit_period` fix — it's purely a frontend field-name bug.

### Files to edit
- `src/components/crm/OrganizationsList.tsx` (search, delete action)
- `src/components/crm/EnhancedAddOrganizationDialog.tsx` (duplicate check)
- `src/components/crm/EditReferralDialog.tsx` (rename benefit_period field, add close reason)
- `src/components/crm/PatientsList.tsx` (delete action)
- `src/components/crm/ReferralCard.tsx` + `ReferralKanban.tsx` (palliative styling, delete)
- `src/components/crm/referral-wizard/StepPatientInfo.tsx` (duplicate gate)
- `src/pages/ReferralsPage.tsx` (default-exclude palliative from main list, helper text)
- `src/pages/AdminUsersPage.tsx` (better error surfacing, optional password)
- `supabase/functions/validate-signup/index.ts` (createUser path, error clarity)
- New migration: assign admin role to Bethany & Jodie; add `patients.deleted_at` if missing.

