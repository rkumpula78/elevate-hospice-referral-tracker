import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PhoneInput } from "@/components/ui/phone-input";
import { Loader2, Plus, User, Phone, FileText, Briefcase, Building, AlertCircle } from "lucide-react";
import ReferringContactSelector from "./ReferringContactSelector";
import AddContactDialog from "./AddContactDialog";
import { useTeamsIntegration } from "@/hooks/useTeamsIntegration";
import type { Database } from "@/integrations/supabase/types";
import { EnhancedInput } from "@/components/ui/enhanced-input";
import { CharacterCounterTextarea } from "@/components/ui/character-counter-textarea";
import { ValidationSummary } from "@/components/ui/validation-summary";
import { RequiredFieldsIndicator } from "@/components/ui/required-fields-indicator";
import { formatPhoneNumber } from "@/lib/formatters";

type ReferralStatus = Database['public']['Enums']['referral_status'];

interface AddReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddReferralDialog = ({ open, onOpenChange }: AddReferralDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { autoNotifyNewReferral } = useTeamsIntegration();
  const [showNewOrgForm, setShowNewOrgForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState<'hospital' | 'physician_office' | 'snf' | 'home_health' | 'other'>('hospital');
  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  const [selectedOrgName, setSelectedOrgName] = useState<string>('');
  
  // Refs for smart field focus
  const patientNameRef = useRef<HTMLInputElement>(null);
  const diagnosisRef = useRef<HTMLInputElement>(null);
  const insuranceRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
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
  });
  
  // Validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [validatedFields, setValidatedFields] = useState<Record<string, boolean>>({});
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  
  // Auto-focus first empty required field when dialog opens
  useEffect(() => {
    if (open && patientNameRef.current) {
      setTimeout(() => {
        patientNameRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Fetch organizations for the dropdown (include all organizations, active and inactive)
  const { data: organizations, isLoading: organizationsLoading } = useQuery({
    queryKey: ['organizations', 'all', 'all', 'all', 'all'], // Use same cache key pattern as OrganizationsList
    queryFn: async () => {
      // Use the exact same query pattern as OrganizationsList for consistency
      let query = supabase
        .from('organizations')
        .select('*') // Select all fields like OrganizationsList
        .order('name');

      // No filters applied - show all organizations (active and inactive)
      
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching organizations for referral dropdown:', error);
        throw error;
      }
      
      console.log('Organizations fetched for referral dropdown:', {
        count: data?.length || 0,
        organizations: data?.map(org => ({ id: org.id, name: org.name, is_active: org.is_active }))
      });
      
      return data;
    }
  });

  // Fetch marketers from profiles table
  const { data: marketers = [] } = useQuery({
    queryKey: ['marketers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .not('first_name', 'is', null)
        .not('last_name', 'is', null)
        .order('first_name');
      
      if (error) throw error;
      return (data || []).map(m => `${m.first_name} ${m.last_name}`);
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

      const { data: newReferral, error } = await supabase
        .from('referrals')
        .insert({
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
        })
        .select()
        .single();
      if (error) throw error;
      
      // Send Teams notification for new referral
      if (newReferral) {
        await autoNotifyNewReferral(newReferral);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({ 
        title: "Referral added successfully",
        description: "The referral has been created.",
        className: "border-green-500"
      });
      onOpenChange(false);
      setFormData({
        patient_name: '',
        patient_phone: '',
        diagnosis: '',
        insurance: '',
        priority: 'routine',
        organization_id: '',
        referring_contact_id: null,
        referral_method: 'general',
        referring_physician: '',
        assigned_marketer: '',
        referral_intake_coordinator: '',
        status: 'new_referral',
        reason_for_non_admittance: '',
        notes: '',
        benefit_period_number: 1
      });
      setFieldErrors({});
      setTouchedFields({});
      setValidatedFields({});
      setShowNewOrgForm(false);
      setNewOrgName('');
      setNewOrgType('hospital');
    },
    onError: () => {
      toast({ title: "Error adding referral", variant: "destructive" });
    }
  });

  // Validation logic
  const validateField = (field: string, value: any): string | null => {
    switch (field) {
      case 'patient_name':
        if (!value || !value.trim()) return "Patient name is required";
        return null;
      case 'patient_phone':
        if (value && value.trim()) {
          const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
          if (!phoneRegex.test(value)) return "Phone number must be 10 digits";
        }
        return null;
      case 'reason_for_non_admittance':
        if (formData.status === 'closed' && (!value || !value.trim())) {
          return "Close reason is required";
        }
        return null;
      case 'notes':
        if (value && value.length > 500) {
          return "Notes must be less than 500 characters";
        }
        return null;
      default:
        return null;
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData]);
    setFieldErrors(prev => ({ ...prev, [field]: error || '' }));
    setValidatedFields(prev => ({ ...prev, [field]: !error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const errors: Record<string, string> = {};
    const requiredFields = ['patient_name'];
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) errors[field] = error;
    });

    // Validate conditional fields
    ['patient_phone', 'reason_for_non_admittance', 'notes'].forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) errors[field] = error;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTouchedFields(
        requiredFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
      );
      
      // Scroll to error summary
      setTimeout(() => {
        errorSummaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
      return;
    }
    
    addReferralMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    let processedValue = value;
    
    // Auto-format phone numbers
    if (field === 'patient_phone') {
      processedValue = formatPhoneNumber(value);
    }
    
    setFormData(prev => ({ 
      ...prev, 
      [field]: field === 'benefit_period_number' ? parseInt(processedValue) || 1 : processedValue 
    }));
    
    // Clear error when user starts typing
    if (touchedFields[field] && fieldErrors[field]) {
      const error = validateField(field, processedValue);
      setFieldErrors(prev => ({ ...prev, [field]: error || '' }));
      setValidatedFields(prev => ({ ...prev, [field]: !error }));
    }
  };

  const handleReferringContactChange = (contactId: string | null, method: 'general' | 'specific_contact') => {
    setFormData(prev => ({
      ...prev,
      referring_contact_id: contactId,
      referral_method: method
    }));
  };

  const handleAddContactClick = () => {
    // Set the organization name for display in the dialog
    const selectedOrg = organizations?.find(org => org.id === formData.organization_id);
    setSelectedOrgName(selectedOrg?.name || '');
    setShowAddContactDialog(true);
  };

  const handleContactAdded = (newContactId: string) => {
    console.log('New contact added with ID:', newContactId);
    // Automatically select the newly added contact
    setFormData(prev => ({
      ...prev,
      referring_contact_id: newContactId,
      referral_method: 'specific_contact'
    }));
    console.log('Updated referral form to use new contact');
  };

  const isSubmitting = addReferralMutation.isPending;
  const showReasonField: boolean = formData.status === 'closed';
  
  // Calculate required fields completion
  const requiredFieldValues = {
    patient_name: formData.patient_name,
  };
  const completedRequired = Object.values(requiredFieldValues).filter(v => v && v.toString().trim()).length;
  const totalRequired = Object.keys(requiredFieldValues).length;
  
  // Get all error messages for summary
  const errorMessages = Object.entries(fieldErrors)
    .filter(([_, error]) => error && touchedFields[_])
    .map(([field, error]) => {
      const fieldLabels: Record<string, string> = {
        patient_name: 'Patient Name',
        patient_phone: 'Patient Phone',
        reason_for_non_admittance: 'Reason for Non-admittance',
        notes: 'Notes',
      };
      return `${fieldLabels[field] || field}: ${error}`;
    });

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] sm:max-h-[90vh] h-screen sm:h-auto w-full sm:w-auto overflow-y-auto p-0 animate-slide-up sm:animate-scale-in">
        <DialogHeader className="sticky top-0 z-10 bg-background border-b px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl">Add New Referral</DialogTitle>
            <RequiredFieldsIndicator total={totalRequired} completed={completedRequired} />
          </div>
          <DialogDescription className="sr-only">Fill out the form to create a new patient referral.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6">
          {/* Validation Summary */}
          {errorMessages.length > 0 && (
            <div ref={errorSummaryRef}>
              <ValidationSummary errors={errorMessages} />
            </div>
          )}
          
          {/* Patient Information */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Patient Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="patient_name" className="text-base">
                  Patient Name <span className="text-destructive">*</span>
                </Label>
                <EnhancedInput
                  id="patient_name"
                  ref={patientNameRef}
                  icon={<User className="w-4 h-4" />}
                  value={formData.patient_name}
                  onChange={(e) => handleInputChange('patient_name', e.target.value)}
                  onBlur={() => handleFieldBlur('patient_name')}
                  onEnterPress={() => diagnosisRef.current?.focus()}
                  placeholder="e.g., John Smith"
                  required
                  disabled={isSubmitting}
                  className="h-12 text-base"
                  isValid={touchedFields.patient_name && !fieldErrors.patient_name && !!formData.patient_name}
                  isInvalid={touchedFields.patient_name && !!fieldErrors.patient_name}
                />
                {touchedFields.patient_name && fieldErrors.patient_name && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.patient_name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="patient_phone" className="text-base">Patient Phone</Label>
                <EnhancedInput
                  id="patient_phone"
                  type="tel"
                  inputMode="tel"
                  icon={<Phone className="w-4 h-4" />}
                  value={formData.patient_phone}
                  onChange={(e) => handleInputChange('patient_phone', e.target.value)}
                  onBlur={() => handleFieldBlur('patient_phone')}
                  disabled={isSubmitting}
                  className="h-12 text-base"
                  placeholder="(555) 123-4567"
                  isValid={touchedFields.patient_phone && !fieldErrors.patient_phone && !!formData.patient_phone}
                  isInvalid={touchedFields.patient_phone && !!fieldErrors.patient_phone}
                />
                {touchedFields.patient_phone && fieldErrors.patient_phone && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.patient_phone}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="diagnosis" className="text-base">Diagnosis</Label>
                <EnhancedInput
                  id="diagnosis"
                  ref={diagnosisRef}
                  icon={<FileText className="w-4 h-4" />}
                  value={formData.diagnosis}
                  onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                  onEnterPress={() => insuranceRef.current?.focus()}
                  placeholder="e.g., End-stage CHF"
                  disabled={isSubmitting}
                  className="h-12 text-base"
                />
              </div>
              <div>
                <Label htmlFor="insurance" className="text-base">Insurance</Label>
                <EnhancedInput
                  id="insurance"
                  ref={insuranceRef}
                  icon={<Briefcase className="w-4 h-4" />}
                  value={formData.insurance}
                  onChange={(e) => handleInputChange('insurance', e.target.value)}
                  placeholder="e.g., Medicare Part A"
                  disabled={isSubmitting}
                  className="h-12 text-base"
                />
              </div>
              <div>
                <Label htmlFor="benefit_period_number">Benefit Period</Label>
                <Select 
                  value={formData.benefit_period_number.toString()} 
                  onValueChange={(value) => handleInputChange('benefit_period_number', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Benefit Period (60 days)</SelectItem>
                    <SelectItem value="2">2nd Benefit Period (90 days)</SelectItem>
                    <SelectItem value="3">3rd Benefit Period (60 days)</SelectItem>
                    <SelectItem value="4">4th Benefit Period (60 days)</SelectItem>
                    <SelectItem value="5">5th+ Benefit Period (60 days)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Medicare hospice benefit period for F2F tracking
                </p>
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
                      disabled={isSubmitting || organizationsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          organizationsLoading 
                            ? "Loading organizations..." 
                            : organizations?.length === 0 
                              ? "No organizations found"
                              : "Select organization"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="create-new" className="text-primary">
                          <div className="flex items-center">
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Organization
                          </div>
                        </SelectItem>
                        {organizationsLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading organizations...
                          </SelectItem>
                        ) : organizations?.length === 0 ? (
                          <SelectItem value="no-orgs" disabled>
                            No organizations found. Please create one.
                          </SelectItem>
                        ) : (
                          organizations?.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{org.name}</span>
                                {!org.is_active && (
                                  <span className="text-xs text-red-600 ml-2">(Inactive)</span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
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
            </div>
            
            {/* Referring Contact Selection */}
            {formData.organization_id && !showNewOrgForm && (
              <div className="border-t pt-4">
                <ReferringContactSelector
                  organizationId={formData.organization_id}
                  selectedContactId={formData.referring_contact_id}
                  selectedMethod={formData.referral_method}
                  onContactChange={handleReferringContactChange}
                  onAddContact={handleAddContactClick}
                  disabled={isSubmitting}
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="referring_physician">Referring Physician</Label>
                <EnhancedInput
                  id="referring_physician"
                  icon={<User className="w-4 h-4" />}
                  value={formData.referring_physician}
                  onChange={(e) => handleInputChange('referring_physician', e.target.value)}
                  placeholder="e.g., Dr. Smith"
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
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {marketers.map((marketer) => (
                      <SelectItem key={marketer} value={marketer}>
                        {marketer}
                      </SelectItem>
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
                    <SelectItem value="new_referral">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="admitted">Admitted</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
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

            {/* Conditional Close Reason */}
            {showReasonField && (
              <div>
                <Label htmlFor="reason_for_non_admittance">
                  Close Reason <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.reason_for_non_admittance} 
                  onValueChange={(value) => {
                    handleInputChange('reason_for_non_admittance', value);
                    handleFieldBlur('reason_for_non_admittance');
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className={touchedFields.reason_for_non_admittance && fieldErrors.reason_for_non_admittance ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient_choice">Patient Choice</SelectItem>
                    <SelectItem value="not_appropriate">Not Appropriate</SelectItem>
                    <SelectItem value="lost_contact">Lost Contact</SelectItem>
                    <SelectItem value="deceased">Deceased</SelectItem>
                  </SelectContent>
                </Select>
                {touchedFields.reason_for_non_admittance && fieldErrors.reason_for_non_admittance && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.reason_for_non_admittance}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-base">Notes</Label>
            <CharacterCounterTextarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              onBlur={() => handleFieldBlur('notes')}
              rows={3}
              maxLength={500}
              placeholder="Add any additional notes about this referral..."
              disabled={isSubmitting}
              className="text-base min-h-[100px]"
            />
            {touchedFields.notes && fieldErrors.notes && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.notes}
              </p>
            )}
          </div>
          </div>

          {/* Sticky Footer with Action Buttons */}
          <div className="sticky bottom-0 bg-background border-t px-4 sm:px-6 py-4 shadow-lg sm:shadow-none mt-auto">
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={isSubmitting}
                className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || completedRequired < totalRequired || Object.values(fieldErrors).some(e => e)}
                className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm order-1 sm:order-2"
              >
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
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Add Contact Dialog */}
    {formData.organization_id && (
      <AddContactDialog
        open={showAddContactDialog}
        onOpenChange={setShowAddContactDialog}
        organizationId={formData.organization_id}
        organizationName={selectedOrgName}
        onContactAdded={handleContactAdded}
        autoSelectAsReferrer={true}
      />
    )}
    </>
  );
};

export default AddReferralDialog;
