import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Download, Trash2, UserPlus, CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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
  selectedNames: string[];
  onClearSelection: () => void;
  onBulkStatusUpdate: (status: string) => void;
  onBulkPriorityUpdate: (priority: string) => void;
  onBulkAssign: (marketer: string) => void;
  onBulkDelete: () => void;
  onBulkExport: () => void;
  onBulkFollowUpFrequency: (frequency: string) => void;
  onBulkFollowUpDate: (date: string) => void;
  marketers: string[];
}

const DESTRUCTIVE_STATUSES = ['discharged', 'deceased', 'revoked', 'closed'];

const ConfirmationPreview = ({ names, count }: { names: string[]; count: number }) => {
  const preview = names.slice(0, 5);
  const remaining = count - preview.length;
  return (
    <div className="mt-2 text-sm text-muted-foreground">
      <ul className="list-disc pl-5 space-y-0.5">
        {preview.map((name, i) => <li key={i}>{name}</li>)}
      </ul>
      {remaining > 0 && <p className="mt-1 italic">...and {remaining} more</p>}
    </div>
  );
};

export const BulkActionsToolbar = ({
  selectedCount,
  selectedNames,
  onClearSelection,
  onBulkStatusUpdate,
  onBulkPriorityUpdate,
  onBulkAssign,
  onBulkDelete,
  onBulkExport,
  onBulkFollowUpFrequency,
  onBulkFollowUpDate,
  marketers,
}: BulkActionsToolbarProps) => {
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showPriorityDialog, setShowPriorityDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFrequencyDialog, setShowFrequencyDialog] = useState(false);
  const [showDateDialog, setShowDateDialog] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedMarketer, setSelectedMarketer] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const isDestructiveStatus = DESTRUCTIVE_STATUSES.includes(selectedStatus);

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
              <span className="font-medium">referrals selected</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClearSelection} className="text-primary-foreground hover:bg-white/20">
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => setShowStatusDialog(true)}
              className="bg-white/10 hover:bg-white/20 text-primary-foreground border-white/20">
              Update Status
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowPriorityDialog(true)}
              className="bg-white/10 hover:bg-white/20 text-primary-foreground border-white/20">
              Change Priority
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowAssignDialog(true)}
              className="bg-white/10 hover:bg-white/20 text-primary-foreground border-white/20">
              <UserPlus className="w-4 h-4 mr-1" />
              Assign To
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowFrequencyDialog(true)}
              className="bg-white/10 hover:bg-white/20 text-primary-foreground border-white/20">
              <Clock className="w-4 h-4 mr-1" />
              Follow-up Freq
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowDateDialog(true)}
              className="bg-white/10 hover:bg-white/20 text-primary-foreground border-white/20">
              <CalendarIcon className="w-4 h-4 mr-1" />
              Follow-up Date
            </Button>
            <Button variant="secondary" size="sm" onClick={onBulkExport}
              className="bg-white/10 hover:bg-white/20 text-primary-foreground border-white/20">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}
              className="bg-destructive hover:bg-destructive/90">
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
              Select the new status. This cannot be undone after the undo window expires.
              <ConfirmationPreview names={selectedNames} count={selectedCount} />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select new status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new_referral">New Referral</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="assessment_scheduled">Assessment Scheduled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="admitted">Admitted</SelectItem>
                <SelectItem value="palliative_outreach">Palliative Outreach</SelectItem>
                <SelectItem value="not_appropriate">Not Appropriate</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="lost_to_followup">Lost to Follow-up</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="discharged">Discharged</SelectItem>
                <SelectItem value="deceased">Deceased</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
            {isDestructiveStatus && (
              <p className="mt-2 text-sm text-destructive font-medium">
                ⚠️ Are you sure? This will mark {selectedCount} referrals as "{selectedStatus}".
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => { onBulkStatusUpdate(selectedStatus); setShowStatusDialog(false); setSelectedStatus(''); }} 
              disabled={!selectedStatus}
              className={isDestructiveStatus ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              Update {selectedCount} Referrals
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
              Select the new priority.
              <ConfirmationPreview names={selectedNames} count={selectedCount} />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select new priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onBulkPriorityUpdate(selectedPriority); setShowPriorityDialog(false); setSelectedPriority(''); }} disabled={!selectedPriority}>
              Update {selectedCount} Referrals
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Dialog */}
      <AlertDialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reassign {selectedCount} Referrals</AlertDialogTitle>
            <AlertDialogDescription>
              Select a team member to assign all selected referrals to.
              <ConfirmationPreview names={selectedNames} count={selectedCount} />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={selectedMarketer} onValueChange={setSelectedMarketer}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select marketer" /></SelectTrigger>
              <SelectContent>
                {marketers.map((marketer) => (
                  <SelectItem key={marketer} value={marketer}>{marketer}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onBulkAssign(selectedMarketer); setShowAssignDialog(false); setSelectedMarketer(''); }} disabled={!selectedMarketer}>
              Reassign {selectedCount} Referrals
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Follow-up Frequency Dialog */}
      <AlertDialog open={showFrequencyDialog} onOpenChange={setShowFrequencyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set Follow-up Frequency for {selectedCount} Referrals</AlertDialogTitle>
            <AlertDialogDescription>
              Choose how often these referrals should be followed up.
              <ConfirmationPreview names={selectedNames} count={selectedCount} />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={selectedFrequency} onValueChange={setSelectedFrequency}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select frequency" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Biweekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="as_needed">As Needed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onBulkFollowUpFrequency(selectedFrequency); setShowFrequencyDialog(false); setSelectedFrequency(''); }} disabled={!selectedFrequency}>
              Update {selectedCount} Referrals
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Follow-up Date Dialog */}
      <AlertDialog open={showDateDialog} onOpenChange={setShowDateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set Next Follow-up Date for {selectedCount} Referrals</AlertDialogTitle>
            <AlertDialogDescription>
              Pick a date for the next follow-up on all selected referrals.
              <ConfirmationPreview names={selectedNames} count={selectedCount} />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className={cn("p-3 pointer-events-auto")}
              disabled={(date) => date < new Date()}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => { 
                if (selectedDate) {
                  onBulkFollowUpDate(format(selectedDate, 'yyyy-MM-dd')); 
                  setShowDateDialog(false); 
                  setSelectedDate(undefined); 
                }
              }} 
              disabled={!selectedDate}
            >
              Set Date for {selectedCount} Referrals
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
              This action cannot be undone after the undo window expires. This will permanently delete the selected referrals.
              <ConfirmationPreview names={selectedNames} count={selectedCount} />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onBulkDelete(); setShowDeleteDialog(false); }} className="bg-destructive hover:bg-destructive/90">
              Delete {selectedCount} Referrals
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
