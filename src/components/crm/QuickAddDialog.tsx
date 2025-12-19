
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, UserPlus, Calendar, FileText } from "lucide-react";
import { useState } from 'react';
import AddOrganizationDialog from './AddOrganizationDialog';
import AddReferralDialog from './AddReferralDialog';
import ScheduleVisitDialog from './ScheduleVisitDialog';

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickAddDialog = ({ open, onOpenChange }: QuickAddDialogProps) => {
  const [showAddOrganization, setShowAddOrganization] = useState(false);
  const [showAddReferral, setShowAddReferral] = useState(false);
  const [showScheduleVisit, setShowScheduleVisit] = useState(false);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleAddOrganization = () => {
    setShowAddOrganization(true);
    handleClose();
  };

  const handleAddReferral = () => {
    setShowAddReferral(true);
    handleClose();
  };

  const handleScheduleVisit = () => {
    setShowScheduleVisit(true);
    handleClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Add</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2"
              onClick={handleAddReferral}
            >
              <FileText className="w-6 h-6" />
              <span>Add Referral</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2"
              onClick={handleAddOrganization}
            >
              <Building2 className="w-6 h-6" />
              <span>Add Referral Source</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2"
              onClick={handleScheduleVisit}
            >
              <Calendar className="w-6 h-6" />
              <span>Schedule Visit</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AddOrganizationDialog 
        open={showAddOrganization} 
        onOpenChange={setShowAddOrganization} 
      />
      <AddReferralDialog 
        open={showAddReferral} 
        onOpenChange={setShowAddReferral} 
      />
      <ScheduleVisitDialog 
        open={showScheduleVisit} 
        onOpenChange={setShowScheduleVisit} 
      />
    </>
  );
};

export default QuickAddDialog;
