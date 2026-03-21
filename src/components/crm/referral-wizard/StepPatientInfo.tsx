import { Label } from "@/components/ui/label";
import { EnhancedInput } from "@/components/ui/enhanced-input";
import { User, Phone, MapPin } from "lucide-react";
import { AlertCircle } from "lucide-react";

interface StepPatientInfoProps {
  formData: {
    patient_name: string;
    patient_phone: string;
    patient_address: string;
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
            Patient Phone <span className="text-destructive">*</span>
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
            placeholder="(555) 123-4567"
            required
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
            Address <span className="text-destructive">*</span>
          </Label>
          <EnhancedInput
            id="patient_address"
            icon={<MapPin className="w-4 h-4" />}
            value={formData.patient_address}
            onChange={(e) => onFieldChange('patient_address', e.target.value)}
            onBlur={() => onFieldBlur('patient_address')}
            placeholder="e.g., 123 Main St, Phoenix, AZ 85001"
            required
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
    </div>
  );
}
