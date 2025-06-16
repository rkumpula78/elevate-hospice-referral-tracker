
import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface LegalMedicalSectionProps {
  patient: any;
  isOpen: boolean;
  onToggle: () => void;
}

const LegalMedicalSection = ({ patient, isOpen, onToggle }: LegalMedicalSectionProps) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
        <h3 className="text-lg font-medium">3. Legal and Medical Preferences</h3>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="advanced_directive"
              name="advanced_directive"
              defaultChecked={patient.advanced_directive || false}
            />
            <Label htmlFor="advanced_directive">Advanced Directive (Y/N)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dnr_status"
              name="dnr_status"
              defaultChecked={patient.dnr_status || false}
            />
            <Label htmlFor="dnr_status">Do Not Resuscitate (DNR) Status</Label>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="funeral_arrangements">Funeral Arrangements/Mortuary</Label>
            <Textarea
              id="funeral_arrangements"
              name="funeral_arrangements"
              defaultValue={patient.funeral_arrangements || ''}
              rows={3}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="msw_notes">Medical Social Worker (MSW) Notes</Label>
            <Textarea
              id="msw_notes"
              name="msw_notes"
              defaultValue={patient.msw_notes || ''}
              rows={3}
              placeholder="Additional comments by the medical social worker"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default LegalMedicalSection;
