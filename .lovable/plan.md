

## Add Cell Phone Field to Organization Contacts

### Problem
The `organization_contacts` table has `direct_phone` but no dedicated mobile/cell phone column. The Excel import contains separate Phone and Cell columns for many contacts.

### Plan

**Step 1: Database Migration**
Add a `cell_phone` column to the `organization_contacts` table:
```sql
ALTER TABLE public.organization_contacts
ADD COLUMN cell_phone text;
```

**Step 2: Update TypeScript Types**
The `src/integrations/supabase/types.ts` file will auto-update after migration.

**Step 3: Update Contact UI Components**
Add the cell phone field to forms and display components that handle contacts:
- `AddContactDialog.tsx` — add cell phone input field
- `OrganizationContactsTab.tsx` — display cell phone in contact cards/lists
- Any contact detail views that show phone numbers

This is a small change — one migration, then surface the field in 2-3 components. After this, the bulk import can map the Excel "Cell" column directly to `cell_phone`.

