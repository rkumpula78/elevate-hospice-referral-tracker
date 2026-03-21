import { Label } from "@/components/ui/label";
import { EnhancedInput } from "@/components/ui/enhanced-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Briefcase, AlertCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ReferralStatus = Database['public']['Enums']['referral_status'];

interface StepClinicalDetailsProps {
  formData: {
    diagnosis: string;
    insurance: string;
    priority: 'low' | 'routine' | 'urgent';
    benefit_period_number: number;
    status: ReferralStatus;
    reason_for_non_admittance: string;
  };
  onFieldChange: (field: string, value: string) => void;
  fieldErrors: Record<string, string>;
  touchedFields: Record<string, boolean>;
  onFieldBlur: (field: string) => void;
  disabled: boolean;
}

export function StepClinicalDetails({ formData, onFieldChange, fieldErrors, touchedFields, onFieldBlur, disabled }: StepClinicalDetailsProps) {
  const showReasonField = formData.status === 'closed';

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Clinical Details</h3>
      <div className="space-y-4">
        <div>
          <Label>Diagnosis <span className="text-destructive">*</span></Label>
          <EnhancedInput
            icon={<FileText className="w-4 h-4" />}
            value={formData.diagnosis}
            onChange={(e) => onFieldChange('diagnosis', e.target.value)}
            onBlur={() => onFieldBlur('diagnosis')}
            placeholder="e.g., End-stage CHF"
            disabled={disabled}
            required
            isValid={touchedFields.diagnosis && !fieldErrors.diagnosis && !!formData.diagnosis}
            isInvalid={touchedFields.diagnosis && !!fieldErrors.diagnosis}
          />
          {touchedFields.diagnosis && fieldErrors.diagnosis && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{fieldErrors.diagnosis}
            </p>
          )}
        </div>
        <div>
          <Label>Insurance <span className="text-destructive">*</span></Label>
          <EnhancedInput
            icon={<Briefcase className="w-4 h-4" />}
            value={formData.insurance}
            onChange={(e) => onFieldChange('insurance', e.target.value)}
            onBlur={() => onFieldBlur('insurance')}
            placeholder="e.g., Medicare Part A"
            disabled={disabled}
            required
            isValid={touchedFields.insurance && !fieldErrors.insurance && !!formData.insurance}
            isInvalid={touchedFields.insurance && !!fieldErrors.insurance}
          />
          {touchedFields.insurance && fieldErrors.insurance && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{fieldErrors.insurance}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Priority</Label>
            <Select value={formData.priority} onValueChange={(v: 'low' | 'routine' | 'urgent') => onFieldChange('priority', v)} disabled={disabled}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Benefit Period</Label>
            <Select value={formData.benefit_period_number.toString()} onValueChange={(v) => onFieldChange('benefit_period_number', v)} disabled={disabled}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1st (60 days)</SelectItem>
                <SelectItem value="2">2nd (90 days)</SelectItem>
                <SelectItem value="3">3rd (60 days)</SelectItem>
                <SelectItem value="4">4th (60 days)</SelectItem>
                <SelectItem value="5">5th+ (60 days)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(v: ReferralStatus) => onFieldChange('status', v)} disabled={disabled}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new_referral">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="assessment">Assessment</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="admitted">Admitted</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {showReasonField && (
          <div>
            <Label>Close Reason <span className="text-destructive">*</span></Label>
            <Select
              value={formData.reason_for_non_admittance}
              onValueChange={(v) => { onFieldChange('reason_for_non_admittance', v); onFieldBlur('reason_for_non_admittance'); }}
              disabled={disabled}
            >
              <SelectTrigger className={touchedFields.reason_for_non_admittance && fieldErrors.reason_for_non_admittance ? "border-destructive" : ""}>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patient_choice">Patient Choice</SelectItem>
                <SelectItem value="not_appropriate">Not Appropriate</SelectItem>
                <SelectItem value="lost_contact">Lost Contact</SelectItem>
                <SelectItem value="deceased">Deceased</SelectItem>
              </SelectContent>
            </Select>
            {touchedFields.reason_for_non_admittance && fieldErrors.reason_for_non_admittance && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{fieldErrors.reason_for_non_admittance}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
