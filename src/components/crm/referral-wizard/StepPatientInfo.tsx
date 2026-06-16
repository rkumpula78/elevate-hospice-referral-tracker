import { Label } from "@/components/ui/label";
import { EnhancedInput } from "@/components/ui/enhanced-input";
import { User, Phone, MapPin, Users, Heart } from "lucide-react";
import { AlertCircle } from "lucide-react";

interface StepPatientInfoProps {
  formData: {
    patient_name: string;
    patient_phone: string;
    patient_address: string;
    responsible_party_name: string;
    responsible_party_contact: string;
    responsible_party_relationship: string;
  };
  onFieldChange: (field: string, value: string) => void;
  fieldErrors: Record<string, string>;
  touchedFields: Record<string, boolean>;
  onFieldBlur: (field: string) => void;
  disabled: boolean;
}

export function StepPatientInfo({ formData, onFieldChange, fieldErrors, touchedFields, onFieldBlur, disabled }: StepPatientInfoProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Patient Information</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="patient_name" className="text-base">
            Patient Name <span className="text-destructive">*</span>
          </Label>
          <EnhancedInput
            id="patient_name"
            icon={<User className="w-4 h-4" />}
            value={formData.patient_name}
            onChange={(e) => onFieldChange('patient_name', e.target.value)}
            onBlur={() => onFieldBlur('patient_name')}
            placeholder="e.g., John Smith"
            required
            disabled={disabled}
            className="h-12 text-base"
            isValid={touchedFields.patient_name && !fieldErrors.patient_name && !!formData.patient_name}
            isInvalid={touchedFields.patient_name && !!fieldErrors.patient_name}
          />
          {touchedFields.patient_name && fieldErrors.patient_name && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {fieldErrors.patient_name}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="patient_phone" className="text-base">
            Patient Phone <span className="text-xs text-muted-foreground font-normal">(optional)</span>
          </Label>
          <EnhancedInput
            id="patient_phone"
            type="tel"
            inputMode="tel"
            icon={<Phone className="w-4 h-4" />}
            value={formData.patient_phone}
            onChange={(e) => onFieldChange('patient_phone', e.target.value)}
            onBlur={() => onFieldBlur('patient_phone')}
            disabled={disabled}
            className="h-12 text-base"
            placeholder="(555) 123-4567 — leave blank if unknown"
            isValid={touchedFields.patient_phone && !fieldErrors.patient_phone && !!formData.patient_phone}
            isInvalid={touchedFields.patient_phone && !!fieldErrors.patient_phone}
          />
          {touchedFields.patient_phone && fieldErrors.patient_phone && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {fieldErrors.patient_phone}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="patient_address" className="text-base">
            Address <span className="text-xs text-muted-foreground font-normal">(optional)</span>
          </Label>
          <EnhancedInput
            id="patient_address"
            icon={<MapPin className="w-4 h-4" />}
            value={formData.patient_address}
            onChange={(e) => onFieldChange('patient_address', e.target.value)}
            onBlur={() => onFieldBlur('patient_address')}
            placeholder="123 Main St, Phoenix, AZ 85001 — leave blank if unknown"
            disabled={disabled}
            className="h-12 text-base"
            isValid={touchedFields.patient_address && !fieldErrors.patient_address && !!formData.patient_address}
            isInvalid={touchedFields.patient_address && !!fieldErrors.patient_address}
          />
          {touchedFields.patient_address && fieldErrors.patient_address && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {fieldErrors.patient_address}
            </p>
          )}
        </div>
      </div>

      <div className="pt-2">
        <h3 className="text-base font-semibold">Responsible Party <span className="text-xs text-muted-foreground font-normal">(optional)</span></h3>
        <p className="text-sm text-muted-foreground">The main family contact or decision-maker. You can add more details later.</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="responsible_party_name" className="text-base">Name</Label>
          <EnhancedInput
            id="responsible_party_name"
            icon={<Users className="w-4 h-4" />}
            value={formData.responsible_party_name}
            onChange={(e) => onFieldChange('responsible_party_name', e.target.value)}
            placeholder="e.g., Jane Smith"
            disabled={disabled}
            className="h-12 text-base"
          />
        </div>
        <div>
          <Label htmlFor="responsible_party_contact" className="text-base">Phone / Contact</Label>
          <EnhancedInput
            id="responsible_party_contact"
            type="tel"
            inputMode="tel"
            icon={<Phone className="w-4 h-4" />}
            value={formData.responsible_party_contact}
            onChange={(e) => onFieldChange('responsible_party_contact', e.target.value)}
            placeholder="(555) 123-4567"
            disabled={disabled}
            className="h-12 text-base"
          />
        </div>
        <div>
          <Label htmlFor="responsible_party_relationship" className="text-base">Relationship</Label>
          <EnhancedInput
            id="responsible_party_relationship"
            icon={<Heart className="w-4 h-4" />}
            value={formData.responsible_party_relationship}
            onChange={(e) => onFieldChange('responsible_party_relationship', e.target.value)}
            placeholder="e.g., Daughter, POA"
            disabled={disabled}
            className="h-12 text-base"
          />
        </div>
      </div>
    </div>
  );
}
