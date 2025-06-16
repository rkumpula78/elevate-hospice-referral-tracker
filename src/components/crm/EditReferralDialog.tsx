
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface EditReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralId: string;
}

type ReferralStatus = 'pending' | 'contacted' | 'scheduled' | 'admitted' | 'declined' | 'lost' | 'admitted_our_hospice' | 'admitted_other_hospice' | 'lost_death' | 'lost_move' | 'lost_other_hospice';

const EditReferralDialog = ({ open, onOpenChange, referralId }: EditReferralDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch referral data
  const { data: referral, isLoading } = useQuery({
    queryKey: ['referral', referralId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('*, organizations(name)')
        .eq('id', referralId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!referralId
  });

  // Fetch organizations for dropdown
  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Update referral mutation
  const updateReferralMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('referrals')
        .update(data)
        .eq('id', referralId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['referral', referralId] });
      toast({ title: 'Referral updated successfully' });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ title: 'Error updating referral', description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const updateData = {
      patient_name: formData.get('patient_name'),
      patient_phone: formData.get('patient_phone'),
      diagnosis: formData.get('diagnosis'),
      insurance: formData.get('insurance'),
      referring_physician: formData.get('referring_physician'),
      assigned_marketer: formData.get('assigned_marketer'),
      priority: formData.get('priority'),
      status: formData.get('status') as ReferralStatus,
      organization_id: formData.get('organization_id') === 'none' ? null : formData.get('organization_id'),
      notes: formData.get('notes'),
      referral_contact_person: formData.get('referral_contact_person'),
      referral_contact_phone: formData.get('referral_contact_phone'),
      referral_contact_email: formData.get('referral_contact_email'),
      insurance_verification: formData.get('insurance_verification') === 'on',
      medical_records_received: formData.get('medical_records_received') === 'on'
    };

    updateReferralMutation.mutate(updateData);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div>Loading referral information...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!referral) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Referral: {referral.patient_name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="patient-info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="patient-info">Patient Info</TabsTrigger>
            <TabsTrigger value="referral-source">Referral Source</TabsTrigger>
            <TabsTrigger value="status-notes">Status & Notes</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6">
            <TabsContent value="patient-info" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient_name">Patient Name</Label>
                  <Input
                    id="patient_name"
                    name="patient_name"
                    defaultValue={referral.patient_name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="patient_phone">Patient Phone</Label>
                  <Input
                    id="patient_phone"
                    name="patient_phone"
                    defaultValue={referral.patient_phone || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="diagnosis">Diagnosis</Label>
                  <Input
                    id="diagnosis"
                    name="diagnosis"
                    defaultValue={referral.diagnosis || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="insurance">Insurance</Label>
                  <Input
                    id="insurance"
                    name="insurance"
                    defaultValue={referral.insurance || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="referring_physician">Referring Physician</Label>
                  <Input
                    id="referring_physician"
                    name="referring_physician"
                    defaultValue={referral.referring_physician || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="assigned_marketer">Assigned Marketer</Label>
                  <Input
                    id="assigned_marketer"
                    name="assigned_marketer"
                    defaultValue={referral.assigned_marketer || ''}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="referral-source" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organization_id">Organization</Label>
                  <Select name="organization_id" defaultValue={referral.organization_id || 'none'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No organization</SelectItem>
                      {organizations?.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="referral_contact_person">Referral Contact Person</Label>
                  <Input
                    id="referral_contact_person"
                    name="referral_contact_person"
                    defaultValue={referral.referral_contact_person || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="referral_contact_phone">Referral Contact Phone</Label>
                  <Input
                    id="referral_contact_phone"
                    name="referral_contact_phone"
                    defaultValue={referral.referral_contact_phone || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="referral_contact_email">Referral Contact Email</Label>
                  <Input
                    id="referral_contact_email"
                    name="referral_contact_email"
                    type="email"
                    defaultValue={referral.referral_contact_email || ''}
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="insurance_verification"
                      name="insurance_verification"
                      defaultChecked={referral.insurance_verification}
                    />
                    <Label htmlFor="insurance_verification">Insurance Verified</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="medical_records_received"
                      name="medical_records_received"
                      defaultChecked={referral.medical_records_received}
                    />
                    <Label htmlFor="medical_records_received">Medical Records Received</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="status-notes" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" defaultValue={referral.priority || 'routine'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={referral.status || 'pending'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="admitted">Admitted</SelectItem>
                      <SelectItem value="admitted_our_hospice">Admitted Our Hospice</SelectItem>
                      <SelectItem value="admitted_other_hospice">Admitted Other Hospice</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="lost_death">Lost - Death</SelectItem>
                      <SelectItem value="lost_move">Lost - Move</SelectItem>
                      <SelectItem value="lost_other_hospice">Lost - Other Hospice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    defaultValue={referral.notes || ''}
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateReferralMutation.isPending}>
                {updateReferralMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EditReferralDialog;
