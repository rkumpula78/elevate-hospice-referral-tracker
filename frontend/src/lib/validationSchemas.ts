import { z } from "zod";

// Phone number validation - must be 10 digits when stripped of formatting
const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
const phoneValidation = z.string().optional().refine(
  (val) => !val || val === '' || phoneRegex.test(val),
  { message: "Phone number must be 10 digits in format (XXX) XXX-XXXX" }
);

// Email validation
const emailValidation = z.string().email({ message: "Email address is invalid" }).optional().or(z.literal(''));

// Date validation - MM/DD/YYYY format
const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
const dateValidation = z.string().optional().refine(
  (val) => !val || val === '' || dateRegex.test(val),
  { message: "Date must be in MM/DD/YYYY format" }
);

// Medical record number - uppercase alphanumeric
const mrnValidation = z.string().optional().transform((val) => val?.toUpperCase());

// Required string validation
const requiredString = (fieldName: string) => 
  z.string().min(1, { message: `${fieldName} is required` }).trim();

// Referral form validation schema
export const referralFormSchema = z.object({
  patient_name: requiredString("Patient name"),
  patient_phone: phoneValidation,
  diagnosis: z.string().optional(),
  insurance: z.string().optional(),
  priority: z.enum(['low', 'routine', 'urgent']),
  organization_id: z.string().optional(),
  referring_contact_id: z.string().nullable().optional(),
  referral_method: z.enum(['general', 'specific_contact']),
  referring_physician: z.string().optional(),
  assigned_marketer: z.string().optional(),
  referral_intake_coordinator: z.string().optional(),
  status: z.string(),
  reason_for_non_admittance: z.string().optional(),
  notes: z.string().max(500, { message: "Notes must be less than 500 characters" }).optional(),
  benefit_period_number: z.number().min(1).max(5),
  medical_record_number: mrnValidation,
  date_of_birth: dateValidation,
  email: emailValidation,
}).refine((data) => {
  // Require reason for non-admittance if status indicates not admitted
  const notAdmittedStatuses = ['not_admitted_patient_choice', 'not_admitted_not_appropriate', 'not_admitted_lost_contact'];
  if (notAdmittedStatuses.includes(data.status)) {
    return !!data.reason_for_non_admittance?.trim();
  }
  return true;
}, {
  message: "Reason for non-admittance is required for this status",
  path: ["reason_for_non_admittance"],
});

export type ReferralFormData = z.infer<typeof referralFormSchema>;
