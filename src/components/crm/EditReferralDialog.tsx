
import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logAuditEvent, computeChanges } from '@/lib/auditLog';
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
import { Plus, User, Phone, FileText, Briefcase, Building } from 'lucide-react';

// Import patient edit sections
import PatientOverviewSection from './patient-edit/PatientOverviewSection';
import ResponsiblePartySection from './patient-edit/ResponsiblePartySection';
import LegalMedicalSection from './patient-edit/LegalMedicalSection';
import MedicalHistorySection from './patient-edit/MedicalHistorySection';
import AppointmentSection from './patient-edit/AppointmentSection';
import NextStepsSection from './patient-edit/NextStepsSection';
import DocumentsSection from './patient-edit/DocumentsSection';
import { EnhancedInput } from '@/components/ui/enhanced-input';
import { CharacterCounterTextarea } from '@/components/ui/character-counter-textarea';
import { formatPhoneNumber } from '@/lib/formatters';
import { REFERRAL_STATUSES } from '@/lib/constants';

interface EditReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralId: string;
}

interface Comment {
  id: string;
  text: string;
  timestamp: string;
  author: string;
}

const EditReferralDialog = ({ open, onOpenChange, referralId }: EditReferralDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [phoneValue, setPhoneValue] = useState('');
  
  // Refs for smart field focus
  const patientNameRef = useRef<HTMLInputElement>(null);
  const diagnosisRef = useRef<HTMLInputElement>(null);
  
  const [openSections, setOpenSections] = useState({
    overview: true,
    responsibleParty: false,
    legalMedical: false,
    medicalHistory: false,
    appointments: false,
    nextSteps: false,
    documents: false
  });
  
  // Auto-focus first field when dialog opens
  useEffect(() => {
    if (open && patientNameRef.current) {
      setTimeout(() => {
        patientNameRef.current?.focus();
      }, 100);
    }
  }, [open]);
  
  // Handle phone formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneValue(formatted);
    e.target.value = formatted;
  };

  // Fetch referral data
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
    },
    enabled: open
  });

  // Sample intake coordinators
  const intakeCoordinators = [
    'Maria Rodriguez',
    'Jennifer Thompson',
    'Robert Chen',
    'Amanda Williams',
    'Michael Foster'
  ];

  // Fetch documents linked to this referral
  const { data: documents } = useQuery({
    queryKey: ['referral-documents', referralId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', referralId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!referralId
  });

  // Mutation for updating referral data
  const updateReferralMutation = useMutation({
    mutationFn: async (data: any) => {
      const oldData = referralData ? { ...referralData } : null;
      const { error } = await supabase
        .from('referrals')
        .update(data)
        .eq('id', referralId);
      
      if (error) throw error;

      const changes = computeChanges(oldData as any, data);
      await logAuditEvent({ action: 'update', tableName: 'referrals', recordId: referralId, changes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['referral', referralId] });
      toast({ title: 'Information updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating information', description: error.message, variant: 'destructive' });
    }
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: string }) => {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${referralId}/${Date.now()}-${file.name}`;
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;

      // Create document record
      const { data: docData, error: dbError } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: referralId,
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
      queryClient.invalidateQueries({ queryKey: ['referral-documents', referralId] });
      toast({ title: 'Document uploaded successfully' });
      setUploading(false);
    },
    onError: (error) => {
      toast({ title: 'Error uploading document', description: error.message, variant: 'destructive' });
      setUploading(false);
    }
  });

  // Delete document mutation
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
      queryClient.invalidateQueries({ queryKey: ['referral-documents', referralId] });
      toast({ title: 'Document deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting document', description: error.message, variant: 'destructive' });
    }
  });

  // Parse existing notes into comments when data loads
  React.useEffect(() => {
    if (referralData?.notes) {
      try {
        const parsedComments = JSON.parse(referralData.notes);
        if (Array.isArray(parsedComments)) {
          setComments(parsedComments);
        } else {
          setComments([{
            id: '1',
            text: referralData.notes,
            timestamp: referralData.created_at || new Date().toISOString(),
            author: 'System'
          }]);
        }
      } catch {
        if (referralData.notes.trim()) {
          setComments([{
            id: '1',
            text: referralData.notes,
            timestamp: referralData.created_at || new Date().toISOString(),
            author: 'System'
          }]);
        }
      }
    }
  }, [referralData]);

  const addComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment.trim(),
      timestamp: new Date().toISOString(),
      author: 'Current User'
    };
    
    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

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
    
    const updateData: { [key: string]: any } = {};

    // Process all form fields
    for (const [key, value] of formData.entries()) {
      if (key === 'organization_id' && value === 'none') {
        updateData[key] = null;
      } else if (key === 'insurance_verification' || key === 'medical_records_received') {
        updateData[key] = value === 'on';
      } else if (key === 'assigned_marketer' && value === 'none') {
        updateData[key] = null;
      } else if (key === 'referral_intake_coordinator' && value === 'none') {
        updateData[key] = null;
      } else if (key === 'date_of_birth' && value === '') {
        updateData[key] = null;
      } else if (key === 'height' || key === 'weight') {
        updateData[key] = value ? parseInt(value as string) : null;
      } else if (key === 'advanced_directive' || key === 'dnr_status') {
        updateData[key] = value === 'on';
      } else {
        updateData[key] = value;
      }
    }

    // Add comments to notes
    updateData.notes = JSON.stringify(comments);

    // Validate closed reason
    if (updateData.status === 'closed' && !updateData.closed_reason?.trim()) {
      toast({ title: 'Close reason is required for Closed status', variant: 'destructive' });
      return;
    }

    try {
      await updateReferralMutation.mutateAsync(updateData);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({ title: 'Error saving changes', description: error.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
          <div className="flex items-center justify-center p-8">
            <div className="text-lg text-gray-900">Loading information...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!referralData) {
    return null;
  }

  const displayName = (referralData as any).first_name && (referralData as any).last_name 
    ? `${(referralData as any).first_name} ${(referralData as any).last_name}` 
    : referralData?.patient_name || 'N/A';

  const showReasonField = referralData.status === 'closed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
        <DialogHeader className="bg-white">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Edit Patient/Referral: {displayName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="patient-info" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mx-4 sm:mx-6 mt-4 bg-gray-100">
            <TabsTrigger value="patient-info" className="text-sm sm:text-base text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">Patient Info</TabsTrigger>
            <TabsTrigger value="status-notes" className="text-sm sm:text-base text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">Status & Notes</TabsTrigger>
            <TabsTrigger value="referral-source" className="text-sm sm:text-base text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">Referral Source</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            <TabsContent value="patient-info" className="space-y-4 bg-white">
              {/* Basic patient information fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient_name" className="text-gray-700">Patient Name *</Label>
                  <EnhancedInput
                    id="patient_name"
                    name="patient_name"
                    ref={patientNameRef}
                    icon={<User className="w-4 h-4" />}
                    defaultValue={referralData?.patient_name || ''}
                    onEnterPress={() => diagnosisRef.current?.focus()}
                    placeholder="e.g., John Smith"
                    required
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="patient_phone" className="text-gray-700">Patient Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                    <Input
                      id="patient_phone"
                      name="patient_phone"
                      defaultValue={referralData?.patient_phone || ''}
                      onChange={handlePhoneChange}
                      placeholder="(555) 123-4567"
                      className="bg-white border-gray-300 text-gray-900 pl-10"
                      maxLength={14}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="diagnosis" className="text-gray-700">Diagnosis</Label>
                  <EnhancedInput
                    id="diagnosis"
                    name="diagnosis"
                    ref={diagnosisRef}
                    icon={<FileText className="w-4 h-4" />}
                    defaultValue={referralData?.diagnosis || ''}
                    placeholder="e.g., End-stage CHF"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="insurance" className="text-gray-700">Insurance</Label>
                  <EnhancedInput
                    id="insurance"
                    name="insurance"
                    icon={<Briefcase className="w-4 h-4" />}
                    defaultValue={referralData?.insurance || ''}
                    placeholder="e.g., Medicare Part A"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="referring_physician" className="text-gray-700">Referring Physician</Label>
                  <EnhancedInput
                    id="referring_physician"
                    name="referring_physician"
                    icon={<User className="w-4 h-4" />}
                    defaultValue={referralData?.referring_physician || ''}
                    placeholder="e.g., Dr. Smith"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="assigned_marketer" className="text-gray-700">Assigned Marketer</Label>
                  <Select name="assigned_marketer" defaultValue={referralData?.assigned_marketer || 'none'}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Select marketer" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300 z-[100]">
                      <SelectItem value="none">Unassigned</SelectItem>
                      {marketers.map((marketer) => (
                        <SelectItem key={marketer} value={marketer}>
                          {marketer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Patient sections */}
              <PatientOverviewSection 
                patient={referralData}
                isOpen={openSections.overview}
                onToggle={() => toggleSection('overview')}
              />

              <ResponsiblePartySection 
                patient={referralData}
                isOpen={openSections.responsibleParty}
                onToggle={() => toggleSection('responsibleParty')}
              />

              <LegalMedicalSection 
                patient={referralData}
                isOpen={openSections.legalMedical}
                onToggle={() => toggleSection('legalMedical')}
              />

              <MedicalHistorySection 
                patient={referralData}
                isOpen={openSections.medicalHistory}
                onToggle={() => toggleSection('medicalHistory')}
              />

              <AppointmentSection 
                patient={referralData}
                isOpen={openSections.appointments}
                onToggle={() => toggleSection('appointments')}
              />

              <NextStepsSection 
                patient={referralData}
                isOpen={openSections.nextSteps}
                onToggle={() => toggleSection('nextSteps')}
              />

              <DocumentsSection 
                patient={referralData}
                documents={documents || []}
                isOpen={openSections.documents}
                onToggle={() => toggleSection('documents')}
                uploading={uploading}
                onFileUpload={handleFileUpload}
                onDownloadFile={downloadFile}
                onDeleteDocument={(doc) => deleteDocumentMutation.mutate(doc)}
              />
            </TabsContent>

            <TabsContent value="status-notes" className="space-y-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="benefit-period">Benefit Period</Label>
                      <Select 
                        name="benefit_period" 
                        defaultValue="1"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select benefit period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Benefit Period 1 (0-60 days)</SelectItem>
                          <SelectItem value="2">Benefit Period 2 (61-150 days)</SelectItem>
                          <SelectItem value="3">Benefit Period 3 (151-210 days)</SelectItem>
                          <SelectItem value="4">Benefit Period 4+ (210+ days)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                <div>
                  <Label htmlFor="priority" className="text-gray-700">Priority</Label>
                  <Select name="priority" defaultValue={referralData.priority || 'routine'}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300 z-[100]">
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status" className="text-gray-700">Status</Label>
                  <Select name="status" defaultValue={referralData.status || 'new_referral'}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300 z-[100]">
                      {REFERRAL_STATUSES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="referral_intake_coordinator" className="text-gray-700">Referral Intake Coordinator</Label>
                  <Select name="referral_intake_coordinator" defaultValue={referralData?.referral_intake_coordinator || 'none'}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Select intake coordinator" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300 z-[100]">
                      <SelectItem value="none">Unassigned</SelectItem>
                      {intakeCoordinators.map((coordinator) => (
                        <SelectItem key={coordinator} value={coordinator}>{coordinator}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conditional Close Reason */}
              {showReasonField && (
                <div>
                  <Label htmlFor="closed_reason" className="text-gray-700">Close Reason *</Label>
                  <Select name="closed_reason" defaultValue={referralData?.closed_reason || ''}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300 z-[100]">
                      <SelectItem value="patient_choice">Patient Choice</SelectItem>
                      <SelectItem value="not_appropriate">Not Appropriate</SelectItem>
                      <SelectItem value="lost_contact">Lost Contact</SelectItem>
                      <SelectItem value="deceased">Deceased</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Running Comments Section */}
              <div className="space-y-4">
                <Label className="text-gray-700">Running Comments</Label>
                
                <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  {comments.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No comments yet</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="border-b pb-2 last:border-b-0">
                        <div className="flex justify-between items-start text-xs text-gray-500 mb-1">
                          <span className="font-medium">{comment.author}</span>
                          <span>{format(new Date(comment.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                        </div>
                        <p className="text-sm text-gray-900">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex space-x-2">
                  <CharacterCounterTextarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a new comment..."
                    rows={2}
                    maxLength={500}
                    className="flex-1 bg-white border-gray-300 text-gray-900"
                  />
                  <Button
                    type="button"
                    onClick={addComment}
                    disabled={!newComment.trim()}
                    size="sm"
                    className="self-end"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="referral-source" className="space-y-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organization_id" className="text-gray-700">Referring Organization</Label>
                  <Select name="organization_id" defaultValue={referralData.organization_id || 'none'}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300 z-[100]">
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
                  <Label htmlFor="referral_contact_person" className="text-gray-700">Referral Contact Person</Label>
                  <Input
                    id="referral_contact_person"
                    name="referral_contact_person"
                    defaultValue={referralData.referral_contact_person || ''}
                    placeholder="Contact name at facility"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="referral_contact_phone" className="text-gray-700">Referral Contact Phone</Label>
                  <Input
                    id="referral_contact_phone"
                    name="referral_contact_phone"
                    defaultValue={referralData.referral_contact_phone || ''}
                    placeholder="XXX-XXX-XXXX"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="referral_contact_email" className="text-gray-700">Referral Contact Email</Label>
                  <Input
                    id="referral_contact_email"
                    name="referral_contact_email"
                    type="email"
                    defaultValue={referralData.referral_contact_email || ''}
                    placeholder="email@example.com"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="flex flex-col space-y-4 md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="insurance_verification"
                      name="insurance_verification"
                      defaultChecked={referralData.insurance_verification}
                    />
                    <Label htmlFor="insurance_verification" className="text-gray-700">Insurance Verified</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="medical_records_received"
                      name="medical_records_received"
                      defaultChecked={referralData.medical_records_received}
                    />
                    <Label htmlFor="medical_records_received" className="text-gray-700">Medical Records Received</Label>
                  </div>
                </div>
              </div>
            </TabsContent>
            </div>

            {/* Sticky Footer with Action Buttons */}
            <div className="sticky bottom-0 bg-background border-t px-4 sm:px-6 py-4 shadow-lg sm:shadow-none mt-auto">
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateReferralMutation.isPending}
                  className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm order-1 sm:order-2"
                >
                  {updateReferralMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EditReferralDialog;
