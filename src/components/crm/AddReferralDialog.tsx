import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from '@/lib/auditLog';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import AddContactDialog from "./AddContactDialog";
import { useTeamsIntegration } from "@/hooks/useTeamsIntegration";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Database } from "@/integrations/supabase/types";
import { formatPhoneNumber } from "@/lib/formatters";

import { ReferralWizardStepper } from "./referral-wizard/ReferralWizardStepper";
import { StepPatientInfo } from "./referral-wizard/StepPatientInfo";
import { StepSourceAssignment } from "./referral-wizard/StepSourceAssignment";
import { StepClinicalDetails } from "./referral-wizard/StepClinicalDetails";
import { StepReview } from "./referral-wizard/StepReview";

type ReferralStatus = Database['public']['Enums']['referral_status'];

interface AddReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INITIAL_FORM = {
  patient_name: '',
  patient_phone: '',
  diagnosis: '',
  insurance: '',
  priority: 'routine' as 'low' | 'routine' | 'urgent',
  organization_id: '',
  referring_contact_id: null as string | null,
  referral_method: 'general' as 'general' | 'specific_contact',
  referring_physician: '',
  assigned_marketer: '',
  referral_intake_coordinator: '',
  status: 'new_referral' as ReferralStatus,
  reason_for_non_admittance: '',
  notes: '',
  benefit_period_number: 1
};

const AddReferralDialog = ({ open, onOpenChange }: AddReferralDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { autoNotifyNewReferral } = useTeamsIntegration();
  const isMobile = useIsMobile();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const [showNewOrgForm, setShowNewOrgForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState<'hospital' | 'physician_office' | 'snf' | 'home_health' | 'other'>('hospital');
  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  const [selectedOrgName, setSelectedOrgName] = useState('');

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setFormData({ ...INITIAL_FORM });
      setFieldErrors({});
      setTouchedFields({});
      setShowNewOrgForm(false);
      setNewOrgName('');
    }
  }, [open]);

  // Queries
  const { data: organizations, isLoading: organizationsLoading } = useQuery({
    queryKey: ['organizations', 'all', 'all', 'all', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('organizations').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: marketers = [] } = useQuery({
    queryKey: ['marketers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, email').not('first_name', 'is', null).not('last_name', 'is', null).order('first_name');
      if (error) throw error;
      return (data || []).map(m => `${m.first_name} ${m.last_name}`);
    }
  });

  const intakeCoordinators = ['Maria Rodriguez', 'Jennifer Thompson', 'Robert Chen', 'Amanda Williams', 'Michael Foster'];

  // Validation
  const validateField = (field: string, value: any): string | null => {
    if (field === 'patient_name' && (!value || !value.trim())) return "Patient name is required";
    if (field === 'patient_phone' && value?.trim()) {
      if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(value)) return "Phone must be (XXX) XXX-XXXX";
    }
    if (field === 'reason_for_non_admittance' && formData.status === 'closed' && (!value || !value.trim())) return "Close reason is required";
    return null;
  };

  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData]);
    setFieldErrors(prev => ({ ...prev, [field]: error || '' }));
  };

  const handleFieldChange = (field: string, value: string) => {
    const processed = field === 'patient_phone' ? formatPhoneNumber(value) : value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'benefit_period_number' ? parseInt(processed) || 1 : processed
    }));
    if (touchedFields[field] && fieldErrors[field]) {
      const error = validateField(field, processed);
      setFieldErrors(prev => ({ ...prev, [field]: error || '' }));
    }
  };

  const handleReferringContactChange = (contactId: string | null, method: 'general' | 'specific_contact') => {
    setFormData(prev => ({ ...prev, referring_contact_id: contactId, referral_method: method }));
  };

  const handleAddContactClick = () => {
    const org = organizations?.find(o => o.id === formData.organization_id);
    setSelectedOrgName(org?.name || '');
    setShowAddContactDialog(true);
  };

  const handleContactAdded = (newContactId: string) => {
    setFormData(prev => ({ ...prev, referring_contact_id: newContactId, referral_method: 'specific_contact' }));
  };

  // Step validation
  const validateStep = (step: number): boolean => {
    if (step === 1) return !!formData.patient_name.trim();
    if (step === 3 && formData.status === 'closed') return !!formData.reason_for_non_admittance.trim();
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      setTouchedFields(prev => ({ ...prev, patient_name: true }));
      if (!formData.patient_name.trim()) {
        setFieldErrors(prev => ({ ...prev, patient_name: 'Patient name is required' }));
        return;
      }
    }
    if (currentStep === 3 && formData.status === 'closed' && !formData.reason_for_non_admittance.trim()) {
      setTouchedFields(prev => ({ ...prev, reason_for_non_admittance: true }));
      setFieldErrors(prev => ({ ...prev, reason_for_non_admittance: 'Close reason is required' }));
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  // Mutation
  const addReferralMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      let organizationId = data.organization_id;
      if (showNewOrgForm && newOrgName.trim()) {
        const { data: newOrg, error: orgError } = await supabase.from('organizations').insert({ name: newOrgName.trim(), type: newOrgType, is_active: true }).select().single();
        if (orgError) throw orgError;
        organizationId = newOrg.id;
      }
      const { data: newReferral, error } = await supabase.from('referrals').insert({
        patient_name: data.patient_name,
        patient_phone: data.patient_phone || null,
        diagnosis: data.diagnosis || null,
        insurance: data.insurance || null,
        priority: data.priority,
        organization_id: organizationId || null,
        referring_physician: data.referring_physician || null,
        assigned_marketer: data.assigned_marketer === 'unassigned' ? null : data.assigned_marketer || null,
        referral_intake_coordinator: data.referral_intake_coordinator || null,
        status: data.status,
        reason_for_non_admittance: data.reason_for_non_admittance || null,
        notes: data.notes || null,
        benefit_period_number: data.benefit_period_number
      }).select().single();
      if (error) throw error;
      if (newReferral) await autoNotifyNewReferral(newReferral);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({ title: "Referral added successfully", description: "The referral has been created.", className: "border-green-500" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Error adding referral", variant: "destructive" });
    }
  });

  const handleSubmit = () => {
    addReferralMutation.mutate(formData);
  };

  const isSubmitting = addReferralMutation.isPending;

  const orgName = organizations?.find(o => o.id === formData.organization_id)?.name || (showNewOrgForm ? newOrgName : '');

  // Render step content
  const renderStep = () => {
    switch (currentStep) {
      case 1: return <StepPatientInfo formData={formData} onFieldChange={handleFieldChange} fieldErrors={fieldErrors} touchedFields={touchedFields} onFieldBlur={handleFieldBlur} disabled={isSubmitting} />;
      case 2: return <StepSourceAssignment formData={formData} onFieldChange={handleFieldChange} onReferringContactChange={handleReferringContactChange} onAddContactClick={handleAddContactClick} organizations={organizations} organizationsLoading={organizationsLoading} marketers={marketers} intakeCoordinators={intakeCoordinators} showNewOrgForm={showNewOrgForm} setShowNewOrgForm={setShowNewOrgForm} newOrgName={newOrgName} setNewOrgName={setNewOrgName} newOrgType={newOrgType} setNewOrgType={setNewOrgType} disabled={isSubmitting} />;
      case 3: return <StepClinicalDetails formData={formData} onFieldChange={handleFieldChange} fieldErrors={fieldErrors} touchedFields={touchedFields} onFieldBlur={handleFieldBlur} disabled={isSubmitting} />;
      case 4: return <StepReview formData={formData} organizationName={orgName} onFieldChange={handleFieldChange} onEditStep={setCurrentStep} disabled={isSubmitting} />;
    }
  };

  const footer = (
    <div className="sticky bottom-0 bg-background border-t px-4 sm:px-6 py-4">
      <div className="flex justify-between gap-3">
        <Button type="button" variant="outline" onClick={() => currentStep === 1 ? onOpenChange(false) : setCurrentStep(prev => prev - 1)} disabled={isSubmitting} className="h-12 sm:h-10">
          {currentStep === 1 ? 'Cancel' : <><ArrowLeft className="w-4 h-4 mr-1" />Back</>}
        </Button>
        {currentStep < 4 ? (
          <Button type="button" onClick={handleNext} disabled={!validateStep(currentStep)} className="h-12 sm:h-10">
            Next<ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !formData.patient_name.trim()} className="h-12 sm:h-10">
            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : 'Add Referral'}
          </Button>
        )}
      </div>
    </div>
  );

  const content = (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 border-b">
        <ReferralWizardStepper currentStep={currentStep} />
      </div>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {renderStep()}
      </div>
      {footer}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="h-[95vh] p-0 rounded-t-xl">
            <SheetHeader className="sticky top-0 z-10 bg-background border-b px-4 py-3">
              <SheetTitle className="text-lg">Add New Referral</SheetTitle>
              <SheetDescription className="sr-only">Fill out the form to create a new patient referral.</SheetDescription>
            </SheetHeader>
            {content}
          </SheetContent>
        </Sheet>
        {formData.organization_id && (
          <AddContactDialog open={showAddContactDialog} onOpenChange={setShowAddContactDialog} organizationId={formData.organization_id} organizationName={selectedOrgName} onContactAdded={handleContactAdded} autoSelectAsReferrer={true} />
        )}
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
            <DialogTitle className="text-xl">Add New Referral</DialogTitle>
            <DialogDescription className="sr-only">Fill out the form to create a new patient referral.</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
      {formData.organization_id && (
        <AddContactDialog open={showAddContactDialog} onOpenChange={setShowAddContactDialog} organizationId={formData.organization_id} organizationName={selectedOrgName} onContactAdded={handleContactAdded} autoSelectAsReferrer={true} />
      )}
    </>
  );
};

export default AddReferralDialog;
