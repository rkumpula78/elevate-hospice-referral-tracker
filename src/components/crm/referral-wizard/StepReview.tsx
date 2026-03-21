import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CharacterCounterTextarea } from "@/components/ui/character-counter-textarea";
import { Pencil } from "lucide-react";

interface StepReviewProps {
  formData: {
    patient_name: string;
    patient_phone: string;
    patient_address: string;
    diagnosis: string;
    insurance: string;
    priority: string;
    organization_id: string;
    referring_physician: string;
    assigned_marketer: string;
    referral_intake_coordinator: string;
    status: string;
    reason_for_non_admittance: string;
    notes: string;
    benefit_period_number: number;
  };
  organizationName: string;
  onFieldChange: (field: string, value: string) => void;
  onEditStep: (step: number) => void;
  disabled: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  new_referral: 'New', in_progress: 'In Progress', assessment: 'Assessment',
  pending: 'Pending', admitted: 'Admitted', closed: 'Closed',
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value || 'Not provided'}</p>
    </div>
  );
}

export function StepReview({ formData, organizationName, onFieldChange, onEditStep, disabled }: StepReviewProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Review & Submit</h3>

      {/* Patient Info */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Patient Info</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => onEditStep(1)} className="h-7 text-xs"><Pencil className="w-3 h-3 mr-1" />Edit</Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name" value={formData.patient_name} />
            <Field label="Phone" value={formData.patient_phone} />
            <Field label="Address" value={formData.patient_address} />
          </div>
        </CardContent>
      </Card>

      {/* Source */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Source & Assignment</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => onEditStep(2)} className="h-7 text-xs"><Pencil className="w-3 h-3 mr-1" />Edit</Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Organization" value={organizationName} />
            <Field label="Physician" value={formData.referring_physician} />
            <Field label="Marketer" value={formData.assigned_marketer === 'unassigned' ? '' : formData.assigned_marketer} />
            <Field label="Coordinator" value={formData.referral_intake_coordinator} />
          </div>
        </CardContent>
      </Card>

      {/* Clinical */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Clinical Details</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => onEditStep(3)} className="h-7 text-xs"><Pencil className="w-3 h-3 mr-1" />Edit</Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Diagnosis" value={formData.diagnosis} />
            <Field label="Insurance" value={formData.insurance} />
            <Field label="Priority" value={formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)} />
            <Field label="Status" value={STATUS_LABELS[formData.status] || formData.status} />
            {formData.status === 'closed' && <Field label="Close Reason" value={formData.reason_for_non_admittance} />}
            <Field label="Benefit Period" value={`${formData.benefit_period_number}`} />
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <div>
        <Label className="text-base">Notes (optional)</Label>
        <CharacterCounterTextarea
          value={formData.notes}
          onChange={(e) => onFieldChange('notes', e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Add any additional notes..."
          disabled={disabled}
          className="text-base min-h-[80px]"
        />
      </div>
    </div>
  );
}
