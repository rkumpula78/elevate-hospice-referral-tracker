
import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface NextStepsSectionProps {
  patient: any;
  isOpen: boolean;
  onToggle: () => void;
}

const NextStepsSection = ({ patient, isOpen, onToggle }: NextStepsSectionProps) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
        <h3 className="text-lg font-medium">6. Next Steps/Follow-Up Actions</h3>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="next_steps">Next Steps/Follow-Up Actions</Label>
            <Textarea
              id="next_steps"
              name="next_steps"
              defaultValue={patient.next_steps || ''}
              rows={4}
              placeholder="e.g., Contact family for further discussion, Schedule initial care meeting, etc."
            />
          </div>
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={patient.notes || ''}
              rows={4}
              placeholder="Any additional notes or comments"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default NextStepsSection;
