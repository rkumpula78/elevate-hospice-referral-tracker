// File: src/components/crm/patient-edit/AppointmentSection.tsx
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AppointmentSectionProps {
  patient: any;
  isOpen: boolean;
  onToggle: () => void;
}

const AppointmentSection = ({ patient, isOpen, onToggle }: AppointmentSectionProps) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
        <h3 className="text-lg font-medium">5. Appointment and Care Coordination</h3>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="physician">Primary Care Physician (PCP) Name & Contact</Label>
            <Input
              id="physician"
              name="physician"
              defaultValue={patient.physician || ''}
              placeholder="Dr. Jane Doe, (555) 111-2222"
            />
          </div>
          <div>
            <Label htmlFor="attending_physician">Attending Physician Name & Contact</Label>
            <Input
              id="attending_physician"
              name="attending_physician"
              defaultValue={patient.attending_physician || ''}
              placeholder="Dr. John Smith, (555) 333-4444"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="upcoming_appointments">Upcoming Doctor's Appointments</Label>
            <Textarea
              id="upcoming_appointments"
              name="upcoming_appointments"
              defaultValue={patient.upcoming_appointments || ''}
              rows={3}
              placeholder="e.g., Cardiology - 06/10/2025 at 2:00 PM"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="prior_hospice_info">Prior Hospice or Home Health Info</Label>
            <Textarea
              id="prior_hospice_info"
              name="prior_hospice_info"
              defaultValue={patient.prior_hospice_info || ''}
              rows={3}
              placeholder="Previous hospice or home health details (if applicable)"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AppointmentSection;
