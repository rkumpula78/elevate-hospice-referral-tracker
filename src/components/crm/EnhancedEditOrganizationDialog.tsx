
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnhancedOrganizationProfile from './EnhancedOrganizationProfile';
import OrganizationContactsTab from './OrganizationContactsTab';
import ActivityCommunicationsLog from './ActivityCommunicationsLog';
import { Building, Users, MessageSquare } from 'lucide-react';

interface EnhancedEditOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

const EnhancedEditOrganizationDialog = ({ open, onOpenChange, organizationId }: EnhancedEditOrganizationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Organization Management</DialogTitle>
          <DialogDescription>View and manage organization details, contacts, and communications.</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Activity Log
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            <TabsContent value="profile">
              <EnhancedOrganizationProfile organizationId={organizationId} />
            </TabsContent>
            
            <TabsContent value="contacts">
              <OrganizationContactsTab 
                organizationId={organizationId} 
                organizationName="" 
              />
            </TabsContent>
            
            <TabsContent value="activity">
              <ActivityCommunicationsLog 
                organizationId={organizationId} 
                title="Organization Activity & Communications"
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedEditOrganizationDialog;
