

## Plan: Refactor AddReferralDialog into Multi-Step Wizard

### Approach
Split the 795-line monolith into a parent wizard controller + 4 step components + a review step. The parent keeps all form state and the mutation logic; each step receives only its relevant fields via props.

### Files to Create

1. **`src/components/crm/referral-wizard/ReferralWizardStepper.tsx`** (~40 lines)
   - Horizontal progress bar showing steps 1-4 with labels: Patient Info, Source, Clinical, Review
   - Active/completed/upcoming dot states with connecting lines

2. **`src/components/crm/referral-wizard/StepPatientInfo.tsx`** (~80 lines)
   - Fields: Patient Name (required), Date of Birth, Phone Number
   - Validates patient_name is non-empty before allowing Next

3. **`src/components/crm/referral-wizard/StepSourceAssignment.tsx`** (~120 lines)
   - Fields: Source Organization (existing searchable Select + "Create New" inline form), Referring Contact (existing `ReferringContactSelector`), Referring Physician, Assigned Marketer, Intake Coordinator
   - No required fields -- Next always allowed

4. **`src/components/crm/referral-wizard/StepClinicalDetails.tsx`** (~80 lines)
   - Fields: Diagnosis, Insurance, Priority, Benefit Period, Status, conditional Close Reason
   - Validates close reason if status is "closed"

5. **`src/components/crm/referral-wizard/StepReview.tsx`** (~100 lines)
   - Read-only summary cards for each section with an "Edit" button per section (jumps to that step)
   - Notes textarea (optional, with CharacterCounterTextarea)
   - Shows all entered data; redacts empty optional fields as "Not provided"

### File to Modify

6. **`src/components/crm/AddReferralDialog.tsx`** (rewrite ~300 lines, down from 795)
   - `useState` step counter (1-4)
   - All form state stays here (current `formData`, validation, mutation)
   - On mobile (`useIsMobile`): render as `Sheet` (full-screen slide-up). On desktop: render as `Dialog`
   - Sticky footer with Back / Next / Submit buttons
   - `ReferralWizardStepper` at top of content area
   - Each step component rendered conditionally based on `currentStep`
   - Form state preserved across steps (no reset on Back)
   - Step-level validation: `validateStep(step)` returns boolean; Next button disabled if invalid
   - Final submit on Step 4 uses existing `addReferralMutation`

### Key Implementation Details

- **State preservation**: Single `formData` object lives in parent -- stepping back/forward never resets it
- **Step validation**: Only Step 1 (patient_name required) and Step 3 (close reason if status=closed) block progression. Other steps are all-optional.
- **Mobile**: Uses `Sheet` component (already exists) with `side="bottom"` and full height for mobile. Desktop keeps centered `Dialog`.
- **Progress indicator**: 4 circles connected by lines. Completed = green fill, current = blue ring + pulse, future = gray outline.
- **Review step "Edit" buttons**: Call `setCurrentStep(n)` to jump directly to that section.

### No Database Changes Required

All fields already exist in the `referrals` table and `formData` object. This is purely a UI refactor.

