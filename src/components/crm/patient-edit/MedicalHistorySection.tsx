// File: src/components/crm/patient-edit/MedicalHistorySection.tsx
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MedicalHistorySectionProps {
  patient: any;
  isOpen: boolean;
  onToggle: () => void;
}

const MedicalHistorySection = ({ patient, isOpen, onToggle }: MedicalHistorySectionProps) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
        <h3 className="text-lg font-medium">4. Medical History and Care Needs</h3>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="diagnosis">Primary Diagnosis</Label>
            <Input
              id="diagnosis"
              name="diagnosis"
              defaultValue={patient.diagnosis || ''}
              placeholder="e.g., Cancer, Heart Failure"
            />
          </div>
          <div>
            <Label htmlFor="height">Height (inches)</Label>
            <Input
              id="height"
              name="height"
              type="number"
              defaultValue={patient.height || ''}
            />
          </div>
          <div>
            <Label htmlFor="weight">Weight (lbs)</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              defaultValue={patient.weight || ''}
            />
          </div>
          <div>
            <Label htmlFor="caregiver_name">Caregiver Name</Label>
            <Input
              id="caregiver_name"
              name="caregiver_name"
              defaultValue={patient.caregiver_name || ''}
            />
          </div>
          <div>
            <Label htmlFor="caregiver_contact">Caregiver Contact</Label>
            <Input
              id="caregiver_contact"
              name="caregiver_contact"
              defaultValue={patient.caregiver_contact || ''}
              placeholder="Phone and/or email"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="spiritual_preferences">Spiritual/Religious Preferences</Label>
            <Textarea
              id="spiritual_preferences"
              name="spiritual_preferences"
              defaultValue={patient.spiritual_preferences || ''}
              rows={2}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="dme_needs">Durable Medical Equipment (DME) Needs</Label>
            <Textarea
              id="dme_needs"
              name="dme_needs"
              defaultValue={patient.dme_needs || ''}
              rows={2}
              placeholder="e.g., Wheelchair, Oxygen, etc."
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="transport_needs">Transport Requirements (Time or Description)</Label>
            <Textarea
              id="transport_needs"
              name="transport_needs"
              defaultValue={patient.transport_needs || ''}
              rows={2}
              placeholder="Special transport needs or timing"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="special_medical_needs">Other Medical Needs (IV, Nutritional Care)</Label>
            <Textarea
              id="special_medical_needs"
              name="special_medical_needs"
              defaultValue={patient.special_medical_needs || ''}
              rows={2}
              placeholder="Additional medical care or supplies required"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default MedicalHistorySection;
