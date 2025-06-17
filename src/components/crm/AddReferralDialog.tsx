
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PhoneInput } from "@/components/ui/phone-input";
import { Loader2 } from "lucide-react";

interface AddReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddReferralDialog = ({ open, onOpenChange }: AddReferralDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_phone: '',
    diagnosis: '',
    insurance: '',
    priority: 'routine',
    organization_id: '',
    referring_physician: '',
    assigned_marketer: '',
    notes: ''
  });

  // Fetch organizations for the dropdown
  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, type')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const addReferralMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('referrals')
        .insert([{
          ...data,
          organization_id: data.organization_id || null
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      toast({ title: "Referral added successfully" });
      onOpenChange(false);
      setFormData({
        patient_name: '',
        patient_phone: '',
        diagnosis: '',
        insurance: '',
        priority: 'routine',
        organization_id: '',
        referring_physician: '',
        assigned_marketer: '',
        notes: ''
      });
    },
    onError: () => {
      toast({ title: "Error adding referral", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_name.trim()) {
      toast({ title: "Patient name is required", variant: "destructive" });
      return;
    }
    
    addReferralMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isSubmitting = addReferralMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Referral</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patient_name">Patient Name *</Label>
              <Input
                id="patient_name"
                value={formData.patient_name}
                onChange={(e) => handleInputChange('patient_name', e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="patient_phone">Patient Phone</Label>
              <PhoneInput
                id="patient_phone"
                value={formData.patient_phone}
                onChange={(value) => handleInputChange('patient_phone', value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="organization_id">Referral Source</Label>
              <Select 
                value={formData.organization_id} 
                onValueChange={(value) => handleInputChange('organization_id', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assigned_marketer">Assigned Marketer</Label>
              <Input
                id="assigned_marketer"
                value={formData.assigned_marketer}
                onChange={(e) => handleInputChange('assigned_marketer', e.target.value)}
                placeholder="Elevate staff member"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="referring_physician">Referring Physician</Label>
              <Input
                id="referring_physician"
                value={formData.referring_physician}
                onChange={(e) => handleInputChange('referring_physician', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => handleInputChange('priority', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Input
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="insurance">Insurance</Label>
              <Input
                id="insurance"
                value={formData.insurance}
                onChange={(e) => handleInputChange('insurance', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Referral'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddReferralDialog;
