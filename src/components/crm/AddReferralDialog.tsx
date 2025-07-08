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
import { Loader2, Plus } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ReferralStatus = Database['public']['Enums']['referral_status'];

interface AddReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddReferralDialog = ({ open, onOpenChange }: AddReferralDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewOrgForm, setShowNewOrgForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState<'hospital' | 'physician_office' | 'snf' | 'home_health' | 'other'>('hospital');
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_phone: '',
    diagnosis: '',
    insurance: '',
    priority: 'routine' as 'low' | 'routine' | 'urgent',
    organization_id: '',
    referring_physician: '',
    assigned_marketer: '',
    referral_intake_coordinator: '',
    status: 'new_referral' as ReferralStatus,
    reason_for_non_admittance: '',
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

  // Fetch marketers from localStorage/settings
  const { data: marketers } = useQuery({
    queryKey: ['marketers-settings'],
    queryFn: () => {
      const stored = localStorage.getItem('hospice-marketers');
      if (stored) {
        return JSON.parse(stored);
      }
      return ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Wilson', 'David Brown'];
    }
  });

  // Sample intake coordinators - in a real app, this would come from your staff database
  const intakeCoordinators = [
    'Maria Rodriguez',
    'Jennifer Thompson',
    'Robert Chen',
    'Amanda Williams',
    'Michael Foster'
  ];

  const addReferralMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // If creating a new organization, do that first
      let organizationId = data.organization_id;
      
      if (showNewOrgForm && newOrgName.trim()) {
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: newOrgName.trim(),
            type: newOrgType,
            is_active: true
          })
          .select()
          .single();
          
        if (orgError) throw orgError;
        organizationId = newOrg.id;
      }

      const { error } = await supabase
        .from('referrals')
        .insert({
          patient_name: data.patient_name,
          patient_phone: data.patient_phone || null,
          diagnosis: data.diagnosis || null,
          insurance: data.insurance || null,
          priority: data.priority,
          organization_id: organizationId || null,
          referring_physician: data.referring_physician || null,
          assigned_marketer: data.assigned_marketer || null,
          referral_intake_coordinator: data.referral_intake_coordinator || null,
          status: data.status,
          reason_for_non_admittance: data.reason_for_non_admittance || null,
          notes: data.notes || null
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
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
        referral_intake_coordinator: '',
        status: 'new_referral',
        reason_for_non_admittance: '',
        notes: ''
      });
      setShowNewOrgForm(false);
      setNewOrgName('');
      setNewOrgType('hospital');
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

    // Validate that reason for non-admittance is provided if status indicates not admitted
    const notAdmittedStatuses: ReferralStatus[] = ['not_admitted_patient_choice', 'not_admitted_not_appropriate', 'not_admitted_lost_contact'];
    if (notAdmittedStatuses.includes(formData.status) && !formData.reason_for_non_admittance.trim()) {
      toast({ title: "Reason for non-admittance is required for this status", variant: "destructive" });
      return;
    }
    
    addReferralMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isSubmitting = addReferralMutation.isPending;
  const showReasonField: boolean = ['not_admitted_patient_choice', 'not_admitted_not_appropriate', 'not_admitted_lost_contact'].includes(formData.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Referral</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Patient Information</h3>
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
          </div>

          {/* Referral Source & Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Referral Source & Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="organization_id">Referral Source</Label>
                {!showNewOrgForm ? (
                  <div className="space-y-2">
                    <Select 
                      value={formData.organization_id} 
                      onValueChange={(value) => {
                        if (value === 'create-new') {
                          setShowNewOrgForm(true);
                        } else {
                          handleInputChange('organization_id', value);
                        }
                      }}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="create-new" className="text-primary">
                          <div className="flex items-center">
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Organization
                          </div>
                        </SelectItem>
                        {organizations?.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2 border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">New Organization</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowNewOrgForm(false);
                          setNewOrgName('');
                          setNewOrgType('hospital');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Organization Name"
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        disabled={isSubmitting}
                      />
                      <Select 
                        value={newOrgType} 
                        onValueChange={(value: typeof newOrgType) => setNewOrgType(value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hospital">Hospital</SelectItem>
                          <SelectItem value="physician_office">Physician Office</SelectItem>
                          <SelectItem value="snf">Skilled Nursing Facility</SelectItem>
                          <SelectItem value="home_health">Home Health</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
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
                <Label htmlFor="assigned_marketer">Assigned Marketer</Label>
                <Select 
                  value={formData.assigned_marketer} 
                  onValueChange={(value) => handleInputChange('assigned_marketer', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select marketer" />
                  </SelectTrigger>
                  <SelectContent>
                    {marketers?.map((marketer: string) => (
                      <SelectItem key={marketer} value={marketer}>{marketer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="referral_intake_coordinator">Referral Intake Coordinator</Label>
                <Select 
                  value={formData.referral_intake_coordinator} 
                  onValueChange={(value) => handleInputChange('referral_intake_coordinator', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select intake coordinator" />
                  </SelectTrigger>
                  <SelectContent>
                    {intakeCoordinators.map((coordinator) => (
                      <SelectItem key={coordinator} value={coordinator}>{coordinator}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Status & Priority</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Referral Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: ReferralStatus) => handleInputChange('status', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_referral">New Referral</SelectItem>
                    <SelectItem value="contact_attempted">Contact Attempted</SelectItem>
                    <SelectItem value="information_gathering">Information Gathering</SelectItem>
                    <SelectItem value="assessment_scheduled">Assessment Scheduled</SelectItem>
                    <SelectItem value="pending_admission">Pending Admission</SelectItem>
                    <SelectItem value="admitted">Admitted</SelectItem>
                    <SelectItem value="not_admitted_patient_choice">Not Admitted - Patient Choice</SelectItem>
                    <SelectItem value="not_admitted_not_appropriate">Not Admitted - Not Yet Appropriate</SelectItem>
                    <SelectItem value="not_admitted_lost_contact">Not Admitted - Lost Contact</SelectItem>
                    <SelectItem value="deceased_prior_admission">Deceased Prior to Admission</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value: 'low' | 'routine' | 'urgent') => handleInputChange('priority', value)}
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

            {/* Conditional Reason for Non-Admittance */}
            {showReasonField && (
              <div>
                <Label htmlFor="reason_for_non_admittance">Reason for Non-Admittance *</Label>
                <Select 
                  value={formData.reason_for_non_admittance} 
                  onValueChange={(value) => handleInputChange('reason_for_non_admittance', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient_family_chose_competitor">Patient/Family chose competitor</SelectItem>
                    <SelectItem value="patient_stabilized_improved">Patient stabilized/improved</SelectItem>
                    <SelectItem value="family_not_ready">Family not ready</SelectItem>
                    <SelectItem value="financial_insurance_issues">Financial/Insurance issues</SelectItem>
                    <SelectItem value="unable_to_contact">Unable to contact</SelectItem>
                    <SelectItem value="chose_curative_care">Chose curative care</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Notes */}
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
