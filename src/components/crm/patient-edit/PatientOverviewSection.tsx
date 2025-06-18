
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              name="first_name"
              defaultValue={patient?.first_name || ''}
            />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              name="last_name"
              defaultValue={patient?.last_name || ''}
            />
          </div>
          <div>
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              defaultValue={patient?.date_of_birth || ''}
            />
          </div>
          <div>
            <Label htmlFor="ssn">Social Security Number</Label>
            <Input
              id="ssn"
              name="ssn"
              defaultValue={patient?.ssn || ''}
              placeholder="XXX-XX-XXXX"
            />
          </div>
          <div>
            <Label htmlFor="primary_insurance">Primary Insurance Provider</Label>
            <Select name="primary_insurance" defaultValue={patient?.primary_insurance || 'none'}>
              <SelectTrigger>
                <SelectValue placeholder="Select insurance provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select insurance provider</SelectItem>
                <SelectItem value="medicare">Medicare</SelectItem>
                <SelectItem value="medicaid">Medicaid</SelectItem>
                <SelectItem value="private">Private Insurance</SelectItem>
                <SelectItem value="tricare">Tricare</SelectItem>
                <SelectItem value="va">VA Benefits</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="medicare_number">Policy Number</Label>
            <Input
              id="medicare_number"
              name="medicare_number"
              defaultValue={patient?.medicare_number || ''}
              placeholder="Policy/Medicare number"
            />
          </div>
          <div>
            <Label htmlFor="insurance">Referral Source</Label>
            <Select name="insurance" defaultValue={patient?.insurance || 'none'}>
              <SelectTrigger>
                <SelectValue placeholder="Select referral source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select referral source</SelectItem>
                <SelectItem value="physician">Physician</SelectItem>
                <SelectItem value="hospital">Hospital</SelectItem>
                <SelectItem value="snf">Skilled Nursing Facility (SNF)</SelectItem>
                <SelectItem value="family">Family/Self</SelectItem>
                <SelectItem value="other_hospice">Other Hospice</SelectItem>
                <SelectItem value="home_health">Home Health Agency</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="referral_contact_person">Referral Contact Person</Label>
            <Input
              id="referral_contact_person"
              name="referral_contact_person"
              defaultValue={patient?.referral_contact_person || ''}
              placeholder="Contact person at referral source"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="address">Patient Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={patient?.address || ''}
              placeholder="Full address including city, state, zip"
            />
          </div>
          <div>
            <Label htmlFor="phone">Patient Phone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={patient?.phone || ''}
              placeholder="XXX-XXX-XXXX"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default PatientOverviewSection;
