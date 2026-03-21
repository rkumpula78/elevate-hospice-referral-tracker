import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedInput } from "@/components/ui/enhanced-input";
import { Plus, User, AlertCircle } from "lucide-react";
import ReferringContactSelector from "../ReferringContactSelector";

interface StepSourceAssignmentProps {
  formData: {
    organization_id: string;
    referring_contact_id: string | null;
    referral_method: 'general' | 'specific_contact';
    referring_physician: string;
    assigned_marketer: string;
    referral_intake_coordinator: string;
  };
  onFieldChange: (field: string, value: string) => void;
  onReferringContactChange: (contactId: string | null, method: 'general' | 'specific_contact') => void;
  onAddContactClick: () => void;
  organizations: Array<{ id: string; name: string; is_active: boolean | null }> | undefined;
  organizationsLoading: boolean;
  marketers: string[];
  intakeCoordinators: string[];
  showNewOrgForm: boolean;
  setShowNewOrgForm: (v: boolean) => void;
  newOrgName: string;
  setNewOrgName: (v: string) => void;
  newOrgType: string;
  setNewOrgType: (v: any) => void;
  fieldErrors?: Record<string, string>;
  touchedFields?: Record<string, boolean>;
  onFieldBlur?: (field: string) => void;
  disabled: boolean;
}

export function StepSourceAssignment({
  formData, onFieldChange, onReferringContactChange, onAddContactClick,
  organizations, organizationsLoading, marketers, intakeCoordinators,
  showNewOrgForm, setShowNewOrgForm, newOrgName, setNewOrgName, newOrgType, setNewOrgType,
  disabled, fieldErrors = {}, touchedFields = {}, onFieldBlur
}: StepSourceAssignmentProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Source & Assignment</h3>

      {/* Organization */}
      <div>
        <Label>Referral Source</Label>
        {!showNewOrgForm ? (
          <Select
            value={formData.organization_id}
            onValueChange={(value) => {
              if (value === 'create-new') setShowNewOrgForm(true);
              else onFieldChange('organization_id', value);
            }}
            disabled={disabled || organizationsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={organizationsLoading ? "Loading..." : "Select organization"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="create-new" className="text-primary">
                <div className="flex items-center"><Plus className="w-4 h-4 mr-2" />Create New</div>
              </SelectItem>
              {organizations?.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}{!org.is_active && <span className="text-xs text-destructive ml-2">(Inactive)</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="space-y-2 border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">New Organization</h4>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowNewOrgForm(false); setNewOrgName(''); }}>Cancel</Button>
            </div>
            <Input placeholder="Organization Name" value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} disabled={disabled} />
            <Select value={newOrgType} onValueChange={setNewOrgType} disabled={disabled}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hospital">Hospital</SelectItem>
                <SelectItem value="physician_office">Physician Office</SelectItem>
                <SelectItem value="snf">Skilled Nursing Facility</SelectItem>
                <SelectItem value="home_health">Home Health</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Referring Contact */}
      {formData.organization_id && !showNewOrgForm && (
        <div className="border-t pt-4">
          <ReferringContactSelector
            organizationId={formData.organization_id}
            selectedContactId={formData.referring_contact_id}
            selectedMethod={formData.referral_method}
            onContactChange={onReferringContactChange}
            onAddContact={onAddContactClick}
            disabled={disabled}
          />
        </div>
      )}

      {/* Physician, Marketer, Coordinator */}
      <div className="space-y-4">
        <div>
          <Label>Referring Physician</Label>
          <EnhancedInput icon={<User className="w-4 h-4" />} value={formData.referring_physician} onChange={(e) => onFieldChange('referring_physician', e.target.value)} placeholder="e.g., Dr. Smith" disabled={disabled} />
        </div>
        <div>
          <Label>Assigned Marketer</Label>
          <Select value={formData.assigned_marketer} onValueChange={(v) => onFieldChange('assigned_marketer', v)} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="Select marketer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {marketers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Intake Coordinator</Label>
          <Select value={formData.referral_intake_coordinator} onValueChange={(v) => onFieldChange('referral_intake_coordinator', v)} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="Select coordinator" /></SelectTrigger>
            <SelectContent>
              {intakeCoordinators.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
