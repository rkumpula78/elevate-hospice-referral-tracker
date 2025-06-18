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
import { Plus } from 'lucide-react';

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

interface Comment {
  id: string;
  text: string;
  timestamp: string;
  author: string;
}

type ReferralStatus = 'pending' | 'contacted' | 'scheduled' | 'admitted' | 'declined' | 'lost' | 'lost_death' | 'lost_move' | 'lost_other_hospice';

const EditReferralDialog = ({ open, onOpenChange, referralId }: EditReferralDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [openSections, setOpenSections] = useState({
    overview: true,
    responsibleParty: false,
    legalMedical: false,
    medicalHistory: false,
    appointments: false,
    nextSteps: false,
    documents: false
  });

  // Fetch referral data (now contains all patient info)
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

  // Fetch marketers from localStorage/settings
  const { data: marketers } = useQuery({
    queryKey: ['marketers-settings'],
    queryFn: () => {
      const stored = localStorage.getItem('hospice-marketers');
      if (stored) {
        return JSON.parse(stored);
      }
      return ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Wilson', 'David Brown'];
    },
    enabled: open
  });

  // Fetch documents linked to this referral
  const { data: documents } = useQuery({
    queryKey: ['referral-documents', referralId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', referralId) // Use referral ID as patient ID
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!referralId
  });

  // Mutation for updating referral data (now includes all patient fields)
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
          patient_id: referralId, // Use referral ID as patient ID
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

    // Process all form fields and put them in the referrals table
    for (const [key, value] of formData.entries()) {
      if (key === 'organization_id' && value === 'none') {
        updateData[key] = null;
      } else if (key === 'insurance_verification' || key === 'medical_records_received') {
        updateData[key] = value === 'on';
      } else if (key === 'assigned_marketer' && value === 'none') {
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

    console.log('Updating referral with all patient data:', updateData);

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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-lg">Loading information...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!referralData) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Edit Patient/Referral: {referralData?.patient_name || referralData?.first_name + ' ' + referralData?.last_name || 'N/A'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="patient-info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="patient-info">Patient Info</TabsTrigger>
            <TabsTrigger value="status-notes">Status & Notes</TabsTrigger>
            <TabsTrigger value="referral-source">Referral Source</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6">
            <TabsContent value="patient-info" className="space-y-4">
              {/* Basic patient information fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient_name">Patient Name *</Label>
                  <Input
                    id="patient_name"
                    name="patient_name"
                    defaultValue={referralData?.patient_name || ''}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="patient_phone">Patient Phone</Label>
                  <Input
                    id="patient_phone"
                    name="patient_phone"
                    defaultValue={referralData?.patient_phone || ''}
                    placeholder="XXX-XXX-XXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="diagnosis">Diagnosis</Label>
                  <Input
                    id="diagnosis"
                    name="diagnosis"
                    defaultValue={referralData?.diagnosis || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="insurance">Insurance</Label>
                  <Input
                    id="insurance"
                    name="insurance"
                    defaultValue={referralData?.insurance || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="referring_physician">Referring Physician</Label>
                  <Input
                    id="referring_physician"
                    name="referring_physician"
                    defaultValue={referralData?.referring_physician || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="assigned_marketer">Assigned Marketer</Label>
                  <Select name="assigned_marketer" defaultValue={referralData?.assigned_marketer || 'none'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select marketer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {marketers?.map((marketer: string) => (
                        <SelectItem key={marketer} value={marketer}>{marketer}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Patient sections - now working with referral data directly */}
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

            <TabsContent value="status-notes" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" defaultValue={referralData.priority || 'routine'}>
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
                  <Select name="status" defaultValue={referralData.status || 'pending'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="admitted">Admitted</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="lost_death">Lost - Death</SelectItem>
                      <SelectItem value="lost_move">Lost - Move</SelectItem>
                      <SelectItem value="lost_other_hospice">Lost - Other Hospice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Running Comments Section */}
              <div className="space-y-4">
                <Label>Running Comments</Label>
                
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
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex space-x-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a new comment..."
                    rows={2}
                    className="flex-1"
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

            <TabsContent value="referral-source" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organization_id">Referring Organization</Label>
                  <Select name="organization_id" defaultValue={referralData.organization_id || 'none'}>
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
                    defaultValue={referralData.referral_contact_person || ''}
                    placeholder="Contact name at facility"
                  />
                </div>
                <div>
                  <Label htmlFor="referral_contact_phone">Referral Contact Phone</Label>
                  <Input
                    id="referral_contact_phone"
                    name="referral_contact_phone"
                    defaultValue={referralData.referral_contact_phone || ''}
                    placeholder="XXX-XXX-XXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="referral_contact_email">Referral Contact Email</Label>
                  <Input
                    id="referral_contact_email"
                    name="referral_contact_email"
                    type="email"
                    defaultValue={referralData.referral_contact_email || ''}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="flex flex-col space-y-4 md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="insurance_verification"
                      name="insurance_verification"
                      defaultChecked={referralData.insurance_verification}
                    />
                    <Label htmlFor="insurance_verification">Insurance Verified</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="medical_records_received"
                      name="medical_records_received"
                      defaultChecked={referralData.medical_records_received}
                    />
                    <Label htmlFor="medical_records_received">Medical Records Received</Label>
                  </div>
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
