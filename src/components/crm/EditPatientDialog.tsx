
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';

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
      console.log('Fetching patient data for ID:', patientId);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
      
      if (error) {
        console.error('Error fetching patient:', error);
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
    
    const updateData = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      date_of_birth: formData.get('date_of_birth') || null,
      ssn: formData.get('ssn'),
      primary_insurance: formData.get('primary_insurance'),
      secondary_insurance: formData.get('secondary_insurance'),
      medicare_number: formData.get('medicare_number'),
      medicaid_number: formData.get('medicaid_number'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      responsible_party_name: formData.get('responsible_party_name'),
      responsible_party_contact: formData.get('responsible_party_contact'),
      responsible_party_relationship: formData.get('responsible_party_relationship'),
      emergency_contact: formData.get('emergency_contact'),
      emergency_phone: formData.get('emergency_phone'),
      advanced_directive: formData.get('advanced_directive') === 'on',
      dnr_status: formData.get('dnr_status') === 'on',
      funeral_arrangements: formData.get('funeral_arrangements'),
      msw_notes: formData.get('msw_notes'),
      diagnosis: formData.get('diagnosis'),
      caregiver_name: formData.get('caregiver_name'),
      caregiver_contact: formData.get('caregiver_contact'),
      spiritual_preferences: formData.get('spiritual_preferences'),
      height: formData.get('height') ? parseInt(formData.get('height') as string) : null,
      weight: formData.get('weight') ? parseInt(formData.get('weight') as string) : null,
      dme_needs: formData.get('dme_needs'),
      transport_needs: formData.get('transport_needs'),
      special_medical_needs: formData.get('special_medical_needs'),
      physician: formData.get('physician'),
      attending_physician: formData.get('attending_physician'),
      upcoming_appointments: formData.get('upcoming_appointments'),
      prior_hospice_info: formData.get('prior_hospice_info'),
      next_steps: formData.get('next_steps'),
      notes: formData.get('notes'),
      insurance: formData.get('insurance')
    };

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
          {/* 1. Patient Overview Section */}
          <Collapsible open={openSections.overview} onOpenChange={() => toggleSection('overview')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
              <h3 className="text-lg font-medium">1. Patient Overview</h3>
              {openSections.overview ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    defaultValue={patient.first_name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    defaultValue={patient.last_name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    defaultValue={patient.date_of_birth || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="ssn">Social Security Number</Label>
                  <Input
                    id="ssn"
                    name="ssn"
                    defaultValue={patient.ssn || ''}
                    placeholder="XXX-XX-XXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="primary_insurance">Primary Insurance Provider</Label>
                  <Input
                    id="primary_insurance"
                    name="primary_insurance"
                    defaultValue={patient.primary_insurance || ''}
                    placeholder="e.g., Medicare, Private Insurance"
                  />
                </div>
                <div>
                  <Label htmlFor="medicare_number">Medicare/Policy Number</Label>
                  <Input
                    id="medicare_number"
                    name="medicare_number"
                    defaultValue={patient.medicare_number || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="insurance">Referral Source</Label>
                  <Input
                    id="insurance"
                    name="insurance"
                    defaultValue={patient.insurance || ''}
                    placeholder="e.g., Physician, Hospital, SNF"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Patient Address</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={patient.address || ''}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 2. Responsible Party & Contact Information Section */}
          <Collapsible open={openSections.responsibleParty} onOpenChange={() => toggleSection('responsibleParty')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
              <h3 className="text-lg font-medium">2. Responsible Party & Contact Information</h3>
              {openSections.responsibleParty ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="responsible_party_name">Responsible Party Name</Label>
                  <Input
                    id="responsible_party_name"
                    name="responsible_party_name"
                    defaultValue={patient.responsible_party_name || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="responsible_party_contact">Phone Number</Label>
                  <Input
                    id="responsible_party_contact"
                    name="responsible_party_contact"
                    defaultValue={patient.responsible_party_contact || ''}
                    placeholder="XXX-XXX-XXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="responsible_party_relationship">Relationship to Patient</Label>
                  <Select name="responsible_party_relationship" defaultValue={patient.responsible_party_relationship || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="son">Son</SelectItem>
                      <SelectItem value="daughter">Daughter</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="power_of_attorney">Power of Attorney</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="emergency_contact">Emergency Contact Name</Label>
                  <Input
                    id="emergency_contact"
                    name="emergency_contact"
                    defaultValue={patient.emergency_contact || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_phone">Emergency Contact Phone</Label>
                  <Input
                    id="emergency_phone"
                    name="emergency_phone"
                    defaultValue={patient.emergency_phone || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Patient Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={patient.phone || ''}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 3. Legal and Medical Preferences Section */}
          <Collapsible open={openSections.legalMedical} onOpenChange={() => toggleSection('legalMedical')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
              <h3 className="text-lg font-medium">3. Legal and Medical Preferences</h3>
              {openSections.legalMedical ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="advanced_directive"
                    name="advanced_directive"
                    defaultChecked={patient.advanced_directive}
                  />
                  <Label htmlFor="advanced_directive">Advanced Directive (Y/N)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dnr_status"
                    name="dnr_status"
                    defaultChecked={patient.dnr_status}
                  />
                  <Label htmlFor="dnr_status">Do Not Resuscitate (DNR) Status</Label>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="funeral_arrangements">Funeral Arrangements/Mortuary</Label>
                  <Textarea
                    id="funeral_arrangements"
                    name="funeral_arrangements"
                    defaultValue={patient.funeral_arrangements || ''}
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="msw_notes">Medical Social Worker (MSW) Notes</Label>
                  <Textarea
                    id="msw_notes"
                    name="msw_notes"
                    defaultValue={patient.msw_notes || ''}
                    rows={3}
                    placeholder="Additional comments by the medical social worker"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 4. Medical History and Care Needs Section */}
          <Collapsible open={openSections.medicalHistory} onOpenChange={() => toggleSection('medicalHistory')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
              <h3 className="text-lg font-medium">4. Medical History and Care Needs</h3>
              {openSections.medicalHistory ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="diagnosis">Primary Diagnosis</Label>
                  <Input
                    id="diagnosis"
                    name="diagnosis"
                    defaultValue={patient.diagnosis || ''}
                    placeholder="e.g., Cancer, Heart Failure"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (inches)</Label>
                  <Input
                    id="height"
                    name="height"
                    type="number"
                    defaultValue={patient.height || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    defaultValue={patient.weight || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="caregiver_name">Caregiver Name</Label>
                  <Input
                    id="caregiver_name"
                    name="caregiver_name"
                    defaultValue={patient.caregiver_name || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="caregiver_contact">Caregiver Contact</Label>
                  <Input
                    id="caregiver_contact"
                    name="caregiver_contact"
                    defaultValue={patient.caregiver_contact || ''}
                    placeholder="Phone and/or email"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="spiritual_preferences">Spiritual/Religious Preferences</Label>
                  <Textarea
                    id="spiritual_preferences"
                    name="spiritual_preferences"
                    defaultValue={patient.spiritual_preferences || ''}
                    rows={2}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="dme_needs">Durable Medical Equipment (DME) Needs</Label>
                  <Textarea
                    id="dme_needs"
                    name="dme_needs"
                    defaultValue={patient.dme_needs || ''}
                    rows={2}
                    placeholder="e.g., Wheelchair, Oxygen, etc."
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="transport_needs">Transport Requirements</Label>
                  <Textarea
                    id="transport_needs"
                    name="transport_needs"
                    defaultValue={patient.transport_needs || ''}
                    rows={2}
                    placeholder="Special transport needs or timing"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="special_medical_needs">Other Medical Needs (IV, Nutritional Care)</Label>
                  <Textarea
                    id="special_medical_needs"
                    name="special_medical_needs"
                    defaultValue={patient.special_medical_needs || ''}
                    rows={2}
                    placeholder="Additional medical care or supplies required"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 5. Appointment and Care Coordination Section */}
          <Collapsible open={openSections.appointments} onOpenChange={() => toggleSection('appointments')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
              <h3 className="text-lg font-medium">5. Appointment and Care Coordination</h3>
              {openSections.appointments ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="physician">Primary Care Physician (PCP)</Label>
                  <Input
                    id="physician"
                    name="physician"
                    defaultValue={patient.physician || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="attending_physician">Attending Physician</Label>
                  <Input
                    id="attending_physician"
                    name="attending_physician"
                    defaultValue={patient.attending_physician || ''}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="upcoming_appointments">Upcoming Doctor's Appointments</Label>
                  <Textarea
                    id="upcoming_appointments"
                    name="upcoming_appointments"
                    defaultValue={patient.upcoming_appointments || ''}
                    rows={3}
                    placeholder="e.g., Cardiology - 06/10/2025 at 2:00 PM"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="prior_hospice_info">Prior Hospice or Home Health Info</Label>
                  <Textarea
                    id="prior_hospice_info"
                    name="prior_hospice_info"
                    defaultValue={patient.prior_hospice_info || ''}
                    rows={3}
                    placeholder="Previous hospice or home health details (if applicable)"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 6. Actionable Next Steps Section */}
          <Collapsible open={openSections.nextSteps} onOpenChange={() => toggleSection('nextSteps')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
              <h3 className="text-lg font-medium">6. Next Steps/Follow-Up Actions</h3>
              {openSections.nextSteps ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="next_steps">Next Steps/Follow-Up Actions</Label>
                  <Textarea
                    id="next_steps"
                    name="next_steps"
                    defaultValue={patient.next_steps || ''}
                    rows={4}
                    placeholder="e.g., Contact family for further discussion, Schedule initial care meeting, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    defaultValue={patient.notes || ''}
                    rows={4}
                    placeholder="Any additional notes or comments"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 7. Documents Section */}
          <Collapsible open={openSections.documents} onOpenChange={() => toggleSection('documents')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
              <h3 className="text-lg font-medium">7. Patient Documents</h3>
              {openSections.documents ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['insurance_card', 'id', 'advanced_directive', 'dnr', 'medical_records', 'other'].map((docType) => (
                  <div key={docType} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2 capitalize">{docType.replace('_', ' ')}</h4>
                    <input
                      type="file"
                      id={`file-upload-${docType}`}
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, docType)}
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`file-upload-${docType}`)?.click()}
                      disabled={uploading}
                      className="w-full mb-2"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : `Upload ${docType.replace('_', ' ')}`}
                    </Button>
                    
                    {/* Show documents of this type */}
                    {documents?.filter(doc => doc.document_type === docType).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded mt-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm truncate">{doc.file_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => downloadFile(doc)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => deleteDocumentMutation.mutate(doc)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

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
