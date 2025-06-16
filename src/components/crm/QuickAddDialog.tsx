
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Building, Users } from "lucide-react";
import AddReferralDialog from './AddReferralDialog';
import ScheduleVisitDialog from './ScheduleVisitDialog';
import AddOrganizationDialog from './AddOrganizationDialog';

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickAddDialog = ({ open, onOpenChange }: QuickAddDialogProps) => {
  const [showAddReferral, setShowAddReferral] = useState(false);
  const [showScheduleVisit, setShowScheduleVisit] = useState(false);
  const [showAddMarketer, setShowAddMarketer] = useState(false);
  const [showAddReferralSource, setShowAddReferralSource] = useState(false);

  const quickAddOptions = [
    {
      title: "New Referral",
      description: "Add a new patient referral",
      icon: FileText,
      action: () => {
        onOpenChange(false);
        setShowAddReferral(true);
      }
    },
    {
      title: "Schedule Visit",
      description: "Schedule visit to patient, facility, or event",
      icon: Calendar,
      action: () => {
        onOpenChange(false);
        setShowScheduleVisit(true);
      }
    },
    {
      title: "Add Marketer",
      description: "Add a new marketer to track",
      icon: Users,
      action: () => {
        onOpenChange(false);
        setShowAddMarketer(true);
      }
    },
    {
      title: "Add Referral Source",
      description: "Add a new referring organization",
      icon: Building,
      action: () => {
        onOpenChange(false);
        setShowAddReferralSource(true);
      }
    }
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Quick Add</DialogTitle>
            <DialogDescription>
              Choose what you'd like to add to the system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-3 py-4">
            {quickAddOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.title}
                  variant="outline"
                  className="flex items-center justify-start gap-3 h-auto p-4"
                  onClick={option.action}
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">{option.title}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <AddReferralDialog 
        open={showAddReferral} 
        onOpenChange={setShowAddReferral} 
      />

      <ScheduleVisitDialog 
        open={showScheduleVisit} 
        onOpenChange={setShowScheduleVisit} 
      />

      <AddOrganizationDialog 
        open={showAddMarketer} 
        onOpenChange={setShowAddMarketer}
        organizationType="marketer"
      />

      <AddOrganizationDialog 
        open={showAddReferralSource} 
        onOpenChange={setShowAddReferralSource}
        organizationType="referral_source"
      />
    </>
  );
};

export default QuickAddDialog;
