
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ResponsiblePartySectionProps {
  patient: any;
  isOpen: boolean;
  onToggle: () => void;
}

const ResponsiblePartySection = ({ patient, isOpen, onToggle }: ResponsiblePartySectionProps) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
        <h3 className="text-lg font-medium">2. Responsible Party & Contact Information</h3>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="responsible_party_name">Responsible Party Name</Label>
            <Input
              id="responsible_party_name"
              name="responsible_party_name"
              defaultValue={patient.responsible_party_name || ''}
            />
          </div>
          <div>
            <Label htmlFor="responsible_party_contact">Phone Number</Label>
            <Input
              id="responsible_party_contact"
              name="responsible_party_contact"
              defaultValue={patient.responsible_party_contact || ''}
              placeholder="XXX-XXX-XXXX"
            />
          </div>
          <div>
            <Label htmlFor="responsible_party_relationship">Relationship to Patient</Label>
            <Select name="responsible_party_relationship" defaultValue={patient.responsible_party_relationship || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spouse">Spouse</SelectItem>
                <SelectItem value="son">Son</SelectItem>
                <SelectItem value="daughter">Daughter</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="sibling">Sibling</SelectItem>
                <SelectItem value="power_of_attorney">Power of Attorney</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="emergency_contact">Emergency Contact Name</Label>
            <Input
              id="emergency_contact"
              name="emergency_contact"
              defaultValue={patient.emergency_contact || ''}
            />
          </div>
          <div>
            <Label htmlFor="emergency_phone">Emergency Contact Phone</Label>
            <Input
              id="emergency_phone"
              name="emergency_phone"
              defaultValue={patient.emergency_phone || ''}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ResponsiblePartySection;
