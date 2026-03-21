// File: src/components/crm/EditPatientDialog.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import PatientOverviewSection from './patient-edit/PatientOverviewSection';
import ResponsiblePartySection from './patient-edit/ResponsiblePartySection';
import LegalMedicalSection from './patient-edit/LegalMedicalSection';
import MedicalHistorySection from './patient-edit/MedicalHistorySection';
import AppointmentSection from './patient-edit/AppointmentSection';
import NextStepsSection from './patient-edit/NextStepsSection';
import DocumentsSection from './patient-edit/DocumentsSection';

interface EditPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
}

const EditPatientDialog = ({ open, onOpenChange, patientId }: EditPatientDialogProps) => {
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

  // Fetch patient data
  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      // PHI-safe: only log record ID
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
      
      if (error) {
        console.error('Error fetching patient:', error.message);
        throw error;
      }
      console.log('Patient data fetched:', data);
      return data;
    },
    enabled: open && !!patientId
  });

  // Fetch patient documents
  const { data: documents } = useQuery({
    queryKey: ['patient-documents', patientId],
    queryFn: async () => {
      console.log('Fetching documents for patient ID:', patientId);
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }
      console.log('Documents fetched:', data);
      return data;
    },
    enabled: open && !!patientId
  });

  // Update patient mutation
  const updatePatientMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Updating patient with data:', data);
      const { error } = await supabase
        .from('patients')
        .update(data)
        .eq('id', patientId);
      
      if (error) {
        console.error('Error updating patient:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
      toast({ title: 'Patient updated successfully' });
      onOpenChange(false); // Close dialog on successful update
    },
    onError: (error) => {
      console.error('Update patient mutation error:', error);
      toast({ title: 'Error updating patient', description: error.message, variant: 'destructive' });
    }
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: string }) => {
      setUploading(true);
      console.log('Starting file upload:', file.name, 'Type:', documentType);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}/${Date.now()}-${file.name}`;
      
      console.log('Uploading to path:', fileName);
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(fileName, file);
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded successfully:', uploadData);

      // Create document record
      const { data: docData, error: dbError } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: patientId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          content_type: file.type,
          document_type: documentType
        })
        .select()
        .single();
      
      if (dbError) {
        console.error('Database insert error:', dbError);
        throw dbError;
      }

      console.log('Document record created:', docData);
      return docData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-documents', patientId] });
      toast({ title: 'Document uploaded successfully' });
      setUploading(false);
    },
    onError: (error) => {
      console.error('Upload document mutation error:', error);
      toast({ title: 'Error uploading document', description: error.message, variant: 'destructive' });
      setUploading(false);
    }
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (document: any) => {
      console.log('Deleting document:', document);
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('patient-documents')
        .remove([document.file_path]);
      
      if (storageError) {
        console.error('Storage delete error:', storageError);
        throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('patient_documents')
        .delete()
        .eq('id', document.id);
      
      if (dbError) {
        console.error('Database delete error:', dbError);
        throw dbError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-documents', patientId] });
      toast({ title: 'Document deleted successfully' });
    },
    onError: (error) => {
      console.error('Delete document mutation error:', error);
      toast({ title: 'Error deleting document', description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Collect all form data dynamically
    const updateData: { [key: string]: any } = {};
    for (const [key, value] of formData.entries()) {
      // Handle checkboxes specifically as they return 'on'/'off'
      if (key === 'advanced_directive' || key === 'dnr_status') {
        updateData[key] = value === 'on';
      } else if (key === 'height' || key === 'weight') {
        updateData[key] = value ? parseInt(value as string) : null;
      } else if (key === 'date_of_birth' && value === '') {
        updateData[key] = null; // Ensure empty date is stored as null
      }
      else {
        updateData[key] = value;
      }
    }

    console.log('Submitting patient update:', updateData);
    updatePatientMutation.mutate(updateData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected for upload:', file.name, 'Type:', documentType);
      uploadDocumentMutation.mutate({ file, documentType });
    }
  };

  const downloadFile = async (document: any) => {
    try {
      console.log('Downloading file:', document.file_path);
      const { data, error } = await supabase.storage
        .from('patient-documents')
        .download(document.file_path);
      
      if (error) {
        console.error('Download error:', error);
        throw error;
      }
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('File downloaded successfully');
    } catch (error) {
      console.error('Download file error:', error);
      toast({ title: 'Error downloading file', variant: 'destructive' });
    }
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-lg">Loading patient information...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Edit Patient: {patient.first_name} {patient.last_name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PatientOverviewSection 
            patient={patient}
            isOpen={openSections.overview}
            onToggle={() => toggleSection('overview')}
          />

          <ResponsiblePartySection 
            patient={patient}
            isOpen={openSections.responsibleParty}
            onToggle={() => toggleSection('responsibleParty')}
          />

          <LegalMedicalSection 
            patient={patient}
            isOpen={openSections.legalMedical}
            onToggle={() => toggleSection('legalMedical')}
          />

          <MedicalHistorySection 
            patient={patient}
            isOpen={openSections.medicalHistory}
            onToggle={() => toggleSection('medicalHistory')}
          />

          <AppointmentSection 
            patient={patient}
            isOpen={openSections.appointments}
            onToggle={() => toggleSection('appointments')}
          />

          <NextStepsSection 
            patient={patient}
            isOpen={openSections.nextSteps}
            onToggle={() => toggleSection('nextSteps')}
          />

          <DocumentsSection 
            patient={patient}
            documents={documents || []}
            isOpen={openSections.documents}
            onToggle={() => toggleSection('documents')}
            uploading={uploading}
            onFileUpload={handleFileUpload}
            onDownloadFile={downloadFile}
            onDeleteDocument={(doc) => deleteDocumentMutation.mutate(doc)}
          />

          {/* Submit Section */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updatePatientMutation.isPending}>
              {updatePatientMutation.isPending ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPatientDialog;
