
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface MarketerSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MarketerSettingsDialog = ({ open, onOpenChange }: MarketerSettingsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marketer Management</DialogTitle>
          <DialogDescription>
            How marketers are managed in the system
          </DialogDescription>
        </DialogHeader>
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Automatic Marketer Management</strong>
            <p className="mt-2">
              All users with active accounts are automatically available for assignment as marketers. 
              To add or remove marketers, manage user accounts through the Admin Users page.
            </p>
            <p className="mt-2">
              Navigate to <strong>Settings → User Management</strong> to add new users who will automatically 
              appear in all marketer selection dropdowns.
            </p>
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  );
};

export default MarketerSettingsDialog;
