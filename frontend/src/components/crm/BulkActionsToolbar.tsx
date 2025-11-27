import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Download, Trash2, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkStatusUpdate: (status: string) => void;
  onBulkPriorityUpdate: (priority: string) => void;
  onBulkAssign: (marketer: string) => void;
  onBulkDelete: () => void;
  onBulkExport: () => void;
  marketers: string[];
}

export const BulkActionsToolbar = ({
  selectedCount,
  onClearSelection,
  onBulkStatusUpdate,
  onBulkPriorityUpdate,
  onBulkAssign,
  onBulkDelete,
  onBulkExport,
  marketers,
}: BulkActionsToolbarProps) => {
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showPriorityDialog, setShowPriorityDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedMarketer, setSelectedMarketer] = useState('');

  const handleStatusUpdate = () => {
    if (selectedStatus) {
      onBulkStatusUpdate(selectedStatus);
      setShowStatusDialog(false);
      setSelectedStatus('');
    }
  };

  const handlePriorityUpdate = () => {
    if (selectedPriority) {
      onBulkPriorityUpdate(selectedPriority);
      setShowPriorityDialog(false);
      setSelectedPriority('');
    }
  };

  const handleAssign = () => {
    if (selectedMarketer) {
      onBulkAssign(selectedMarketer);
      setShowAssignDialog(false);
      setSelectedMarketer('');
    }
  };

  const handleDelete = () => {
    onBulkDelete();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className={cn(
        "sticky top-16 z-40 bg-primary text-primary-foreground shadow-lg rounded-lg mx-4 mt-4 p-4",
        "animate-fade-in"
      )}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                {selectedCount}
              </div>
              <span className="font-medium">selected</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-primary-foreground hover:bg-white/20"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowStatusDialog(true)}
              className="bg-white/10 hover:bg-white/20 text-primary-foreground border-white/20"
            >
              Update Status
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPriorityDialog(true)}
              className="bg-white/10 hover:bg-white/20 text-primary-foreground border-white/20"
            >
              Change Priority
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAssignDialog(true)}
              className="bg-white/10 hover:bg-white/20 text-primary-foreground border-white/20"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Assign To
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={onBulkExport}
              className="bg-white/10 hover:bg-white/20 text-primary-foreground border-white/20"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Status Update Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Status for {selectedCount} Referrals</AlertDialogTitle>
            <AlertDialogDescription>
              Select the new status to apply to all selected referrals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new_referral">New Referral</SelectItem>
                <SelectItem value="contact_attempted">Contact Attempted</SelectItem>
                <SelectItem value="information_gathering">Information Gathering</SelectItem>
                <SelectItem value="assessment_scheduled">Assessment Scheduled</SelectItem>
                <SelectItem value="pending_admission">Pending Admission</SelectItem>
                <SelectItem value="admitted">Admitted</SelectItem>
                <SelectItem value="not_admitted_patient_choice">Not Admitted - Patient Choice</SelectItem>
                <SelectItem value="not_admitted_not_appropriate">Not Admitted - Not Appropriate</SelectItem>
                <SelectItem value="not_admitted_lost_contact">Not Admitted - Lost Contact</SelectItem>
                <SelectItem value="deceased_prior_admission">Deceased Prior to Admission</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusUpdate} disabled={!selectedStatus}>
              Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Priority Update Dialog */}
      <AlertDialog open={showPriorityDialog} onOpenChange={setShowPriorityDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Priority for {selectedCount} Referrals</AlertDialogTitle>
            <AlertDialogDescription>
              Select the new priority to apply to all selected referrals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select new priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePriorityUpdate} disabled={!selectedPriority}>
              Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Dialog */}
      <AlertDialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign {selectedCount} Referrals</AlertDialogTitle>
            <AlertDialogDescription>
              Select a marketer to assign to all selected referrals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={selectedMarketer} onValueChange={setSelectedMarketer}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select marketer" />
              </SelectTrigger>
              <SelectContent>
                {marketers.map((marketer) => (
                  <SelectItem key={marketer} value={marketer}>
                    {marketer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAssign} disabled={!selectedMarketer}>
              Assign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} Referrals?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected referrals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
