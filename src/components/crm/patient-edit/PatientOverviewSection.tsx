
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PatientOverviewSectionProps {
  patient: any;
  isOpen: boolean;
  onToggle: () => void;
}

const PatientOverviewSection = ({ patient, isOpen, onToggle }: PatientOverviewSectionProps) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
        <h3 className="text-lg font-medium">1. Patient Overview</h3>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              name="first_name"
              defaultValue={patient.first_name || ''}
              required
            />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              name="last_name"
              defaultValue={patient.last_name || ''}
              required
            />
          </div>
          <div>
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              defaultValue={patient.date_of_birth || ''}
            />
          </div>
          <div>
            <Label htmlFor="ssn">Social Security Number</Label>
            <Input
              id="ssn"
              name="ssn"
              defaultValue={patient.ssn || ''}
              placeholder="XXX-XX-XXXX"
            />
          </div>
          <div>
            <Label htmlFor="primary_insurance">Primary Insurance Provider</Label>
            <Input
              id="primary_insurance"
              name="primary_insurance"
              defaultValue={patient.primary_insurance || ''}
              placeholder="e.g., Medicare, Private Insurance"
            />
          </div>
          <div>
            <Label htmlFor="medicare_number">Medicare/Policy Number</Label>
            <Input
              id="medicare_number"
              name="medicare_number"
              defaultValue={patient.medicare_number || ''}
            />
          </div>
          <div>
            <Label htmlFor="insurance">Referral Source</Label>
            <Input
              id="insurance"
              name="insurance"
              defaultValue={patient.insurance || ''}
              placeholder="e.g., Physician, Hospital, SNF"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="address">Patient Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={patient.address || ''}
            />
          </div>
          <div>
            <Label htmlFor="phone">Patient Phone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={patient.phone || ''}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default PatientOverviewSection;
