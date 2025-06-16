
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
import { format } from 'date-fns';

// Import patient edit sections
import PatientOverviewSection from './patient-edit/PatientOverviewSection';
import ResponsiblePartySection from './patient-edit/ResponsiblePartySection';
import LegalMedicalSection from './patient-edit/LegalMedicalSection';
import MedicalHistorySection from './patient-edit/MedicalHistorySection';
import AppointmentSection from './patient-edit/AppointmentSection';
import NextStepsSection from './patient-edit/NextStepsSection';
import DocumentsSection from './patient-edit/DocumentsSection';

interface EditReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralId: string;
}

type ReferralStatus = 'pending' | 'contacted' | 'scheduled' | 'admitted' | 'declined' | 'lost' | 'admitted_our_hospice' | 'admitted_other_hospice' | 'lost_death' | 'lost_move' | 'lost_other_hospice';

const EditReferralDialog = ({ open, onOpenChange, referralId }: EditReferralDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [openSections, setOpenSections] = useState({
    overview: true,
    responsibleParty: false,
    legalMedical: false,
    medicalHistory: false,
    appointments: false,
    nextSteps: false,
    documents: false
  });

  // Fetch referral data and find linked patient separately
  const { data: referralData, isLoading } = useQuery({
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

  // Fetch patient data separately if a patient is linked to this referral
  const { data: patientData } = useQuery({
    queryKey: ['referral-patient', referralId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('referral_id', referralId)
        .maybeSingle(); // Use maybeSingle to handle case where no patient exists
      
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

  // Fetch patient documents (relevant if patient data is available)
  const { data: documents } = useQuery({
    queryKey: ['patient-documents', patientData?.id],
    queryFn: async () => {
      if (!patientData?.id) return [];
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!patientData?.id
  });

  // Mutation for updating referral data
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
    },
    onError: (error) => {
      toast({ title: 'Error updating referral', description: error.message, variant: 'destructive' });
    }
  });

  // Mutation for updating patient data
  const updatePatientMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!patientData?.id) {
        // If no patient is linked, CREATE a new patient
        const { data: newPatient, error: insertError } = await supabase
          .from('patients')
          .insert([{ ...data, referral_id: referralId }])
          .select()
          .single();
        if (insertError) throw insertError;
        
        return newPatient;
      } else {
        // If patient is linked, UPDATE existing patient
        const { data: updatedPatient, error: updateError } = await supabase
          .from('patients')
          .update(data)
          .eq('id', patientData.id)
          .select()
          .single();
        if (updateError) throw updateError;
        return updatedPatient;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['referral-patient', referralId] });
      toast({ title: 'Patient details saved successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error saving patient details', description: error.message, variant: 'destructive' });
    }
  });

  // Upload document mutation (for patient documents)
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: string }) => {
      // Must have a patient ID to upload documents
      if (!patientData?.id) {
        throw new Error("Cannot upload document: Patient record must be created first.");
      }
      
      setUploading(true);
      const patientIdForDoc = patientData.id;
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientIdForDoc}/${Date.now()}-${file.name}`;
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;

      // Create document record
      const { data: docData, error: dbError } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: patientIdForDoc,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          content_type: file.type,
          document_type: documentType
        })
        .select()
        .single();
      
      if (dbError) throw dbError;
      return docData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-documents', patientData?.id] });
      toast({ title: 'Document uploaded successfully' });
      setUploading(false);
    },
    onError: (error) => {
      toast({ title: 'Error uploading document', description: error.message, variant: 'destructive' });
      setUploading(false);
    }
  });

  // Delete document mutation (for patient documents)
  const deleteDocumentMutation = useMutation({
    mutationFn: async (document: any) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('patient-documents')
        .remove([document.file_path]);
      
      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('patient_documents')
        .delete()
        .eq('id', document.id);
      
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-documents', patientData?.id] });
      toast({ title: 'Document deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting document', description: error.message, variant: 'destructive' });
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadDocumentMutation.mutate({ file, documentType });
    }
  };

  const downloadFile = async (document: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('patient-documents')
        .download(document.file_path);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: 'Error downloading file', variant: 'destructive' });
    }
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const referralUpdateData: { [key: string]: any } = {};
    const patientUpdateData: { [key: string]: any } = {};

    // Define fields for the 'referrals' table
    const referralFields = [
      'patient_name', 'patient_phone', 'diagnosis', 'insurance', 'referring_physician',
      'assigned_marketer', 'priority', 'status', 'organization_id', 'notes',
      'referral_contact_person', 'referral_contact_phone', 'referral_contact_email',
      'insurance_verification', 'medical_records_received'
    ];

    // Define fields for the 'patients' table
    const patientFields = [
      'first_name', 'last_name', 'date_of_birth', 'ssn', 'primary_insurance',
      'secondary_insurance', 'medicare_number', 'medicaid_number', 'phone', 'address',
      'responsible_party_name', 'responsible_party_contact', 'responsible_party_relationship',
      'emergency_contact', 'emergency_phone', 'advanced_directive', 'dnr_status',
      'funeral_arrangements', 'msw_notes', 'diagnosis', 'caregiver_name',
      'caregiver_contact', 'spiritual_preferences', 'height', 'weight', 'dme_needs',
      'transport_needs', 'special_medical_needs', 'physician', 'attending_physician',
      'upcoming_appointments', 'prior_hospice_info', 'next_steps', 'notes', 'insurance'
    ];

    for (const [key, value] of formData.entries()) {
      if (referralFields.includes(key)) {
        if (key === 'organization_id' && value === 'none') {
          referralUpdateData[key] = null;
        } else if (key === 'insurance_verification' || key === 'medical_records_received') {
          referralUpdateData[key] = value === 'on';
        } else {
          referralUpdateData[key] = value;
        }
      }

      if (patientFields.includes(key)) {
        if (key === 'date_of_birth' && value === '') {
          patientUpdateData[key] = null;
        } else if (key === 'height' || key === 'weight') {
          patientUpdateData[key] = value ? parseInt(value as string) : null;
        } else if (key === 'advanced_directive' || key === 'dnr_status') {
          patientUpdateData[key] = value === 'on';
        }
        else {
          patientUpdateData[key] = value;
        }
      }
    }

    try {
      // Execute referral update first
      await updateReferralMutation.mutateAsync(referralUpdateData);
      
      // Execute patient update/creation
      await updatePatientMutation.mutateAsync(patientUpdateData);
      
      // Close dialog on success
      onOpenChange(false);

    } catch (error: any) {
      console.error('Submission error:', error);
      toast({ title: 'Error saving changes', description: error.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-lg">Loading referral information...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Provide an empty object if no patient data is linked, so sub-components don't crash
  const currentPatientData = patientData || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Edit Referral: {referralData?.patient_name || 'N/A'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="patient-info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="patient-info">Patient Info</TabsTrigger>
            <TabsTrigger value="referral-source">Referral Source</TabsTrigger>
            <TabsTrigger value="status-notes">Status & Notes</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6">
            <TabsContent value="patient-info" className="space-y-4">
              {/* Always render patient sections, passing empty object if no patient linked */}
              <PatientOverviewSection 
                patient={currentPatientData}
                isOpen={openSections.overview}
                onToggle={() => toggleSection('overview')}
              />

              <ResponsiblePartySection 
                patient={currentPatientData}
                isOpen={openSections.responsibleParty}
                onToggle={() => toggleSection('responsibleParty')}
              />

              <LegalMedicalSection 
                patient={currentPatientData}
                isOpen={openSections.legalMedical}
                onToggle={() => toggleSection('legalMedical')}
              />

              <MedicalHistorySection 
                patient={currentPatientData}
                isOpen={openSections.medicalHistory}
                onToggle={() => toggleSection('medicalHistory')}
              />

              <AppointmentSection 
                patient={currentPatientData}
                isOpen={openSections.appointments}
                onToggle={() => toggleSection('appointments')}
              />

              <NextStepsSection 
                patient={currentPatientData}
                isOpen={openSections.nextSteps}
                onToggle={() => toggleSection('nextSteps')}
              />

              <DocumentsSection 
                patient={currentPatientData}
                documents={documents || []}
                isOpen={openSections.documents}
                onToggle={() => toggleSection('documents')}
                uploading={uploading}
                onFileUpload={handleFileUpload}
                // Only allow download/delete if patient ID exists
                onDownloadFile={patientData?.id ? downloadFile : () => toast({ title: 'Patient record not saved yet', description: 'Save patient info before managing documents.', variant: 'destructive' })}
                onDeleteDocument={patientData?.id ? (doc) => deleteDocumentMutation.mutate(doc) : () => toast({ title: 'Patient record not saved yet', description: 'Save patient info before managing documents.', variant: 'destructive' })}
              />
            </TabsContent>

            <TabsContent value="referral-source" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organization_id">Referring Organization</Label>
                  <Select name="organization_id" defaultValue={referralData?.organization_id || 'none'}>
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
                    defaultValue={referralData?.referral_contact_person || ''}
                    placeholder="Contact name at facility"
                  />
                </div>
                <div>
                  <Label htmlFor="referral_contact_phone">Referral Contact Phone</Label>
                  <Input
                    id="referral_contact_phone"
                    name="referral_contact_phone"
                    defaultValue={referralData?.referral_contact_phone || ''}
                    placeholder="XXX-XXX-XXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="referral_contact_email">Referral Contact Email</Label>
                  <Input
                    id="referral_contact_email"
                    name="referral_contact_email"
                    type="email"
                    defaultValue={referralData?.referral_contact_email || ''}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="flex flex-col space-y-4 md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="insurance_verification"
                      name="insurance_verification"
                      defaultChecked={referralData?.insurance_verification}
                    />
                    <Label htmlFor="insurance_verification">Insurance Verified</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="medical_records_received"
                      name="medical_records_received"
                      defaultChecked={referralData?.medical_records_received}
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
                  <Select name="priority" defaultValue={referralData?.priority || 'routine'}>
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
                  <Select name="status" defaultValue={referralData?.status || 'pending'}>
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
                    defaultValue={referralData?.notes || ''}
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateReferralMutation.isPending || updatePatientMutation.isPending}>
                {(updateReferralMutation.isPending || updatePatientMutation.isPending) ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EditReferralDialog;
