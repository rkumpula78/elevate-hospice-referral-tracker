
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
import { Plus, User, Phone, FileText, Briefcase, Building, AlertTriangle, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { calculateBenefitPeriod } from '@/lib/benefitPeriodLogic';
import { notifyStatusChange } from '@/lib/webhookNotifier';
import { useAuth } from '@/hooks/useAuth';

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
import { REFERRAL_STATUSES, FOLLOWUP_FREQUENCIES, LOCATION_TYPES } from '@/lib/constants';

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [phoneValue, setPhoneValue] = useState('');
  const [statusValue, setStatusValue] = useState<string>('new_referral');
  const newCommentRef = useRef<string>('');
  useEffect(() => { newCommentRef.current = newComment; }, [newComment]);
  
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

  // Intake coordinators come from the same profiles list (managed via User Management)
  const intakeCoordinators = marketers;

  // Resolve the patient record linked to this referral (created on admission)
  const { data: linkedPatient } = useQuery({
    queryKey: ['referral-linked-patient', referralId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id')
        .eq('referral_id', referralId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open && !!referralId,
  });
  const linkedPatientId = linkedPatient?.id ?? null;

  // Fetch documents linked to this referral's patient record
  const { data: documents } = useQuery({
    queryKey: ['referral-documents', linkedPatientId],
    queryFn: async () => {
      if (!linkedPatientId) return [];
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', linkedPatientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open && !!linkedPatientId,
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

      // Fire webhook if status changed
      if (oldData && data.status && oldData.status !== data.status) {
        notifyStatusChange(referralId, oldData.status, data.status);
      }

      // If status changed to 'admitted', geocode the patient address
      if (data.status === 'admitted' && oldData?.status !== 'admitted') {
        const address = data.address || oldData?.address;
        if (address) {
          // Fire and forget — don't block the mutation
          import('@/lib/geocode').then(({ geocodePatientAddress }) => {
            // Find the patient created by the trigger
            supabase
              .from('patients')
              .select('id')
              .eq('referral_id', referralId)
              .maybeSingle()
              .then(({ data: patient }) => {
                if (patient?.id) {
                  geocodePatientAddress(patient.id, address);
                }
              });
          });
        }
      }
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
  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: string }) => {
      if (!linkedPatientId) {
        throw new Error('Documents can only be uploaded after the referral has been admitted.');
      }
      setUploading(true);
      const fileName = `${linkedPatientId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: docData, error: dbError } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: linkedPatientId,
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
      queryClient.invalidateQueries({ queryKey: ['referral-documents', linkedPatientId] });
      toast({ title: 'Document uploaded successfully' });
      setUploading(false);
    },
    onError: (error) => {
      toast({ title: 'Error uploading document', description: error.message, variant: 'destructive' });
      setUploading(false);
    }
  });

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

  // Sync status value when referralData loads
  React.useEffect(() => {
    if (referralData?.status) setStatusValue(referralData.status);
  }, [referralData?.status]);

  const addComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment.trim(),
      timestamp: new Date().toISOString(),
      author: user?.email || 'Current User'
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
      } else if (key === 'insurance_verification' || key === 'medical_records_received' || key === 'md_notified') {
        updateData[key] = value === 'on';
      } else if (key === 'assigned_marketer' && value === 'none') {
        updateData[key] = null;
      } else if (key === 'referral_intake_coordinator' && value === 'none') {
        updateData[key] = null;
      } else if (key === 'date_of_birth' && value === '') {
        updateData[key] = null;
      } else if (key === 'height' || key === 'weight') {
        updateData[key] = value ? parseInt(value as string) : null;
      } else if (key === 'benefit_period_number') {
        updateData[key] = value ? parseInt(value as string) : null;
      } else if (key === 'advanced_directive' || key === 'dnr_status') {
        updateData[key] = value === 'on';
      } else {
        updateData[key] = value;
      }
    }

    // Flush any pending un-added comment so notes typed in the box but not
    // explicitly added with the "+" button are not lost on save.
    const pending = (newCommentRef.current || '').trim();
    const finalComments = pending
      ? [...comments, {
          id: Date.now().toString(),
          text: pending,
          timestamp: new Date().toISOString(),
          author: user?.email || 'Current User',
        }]
      : comments;

    // Add comments to notes
    updateData.notes = JSON.stringify(finalComments);

    // Strip fields that don't exist on the `referrals` table (patient-edit
    // sections include some patient-only fields like attending_physician_contact,
    // pcp_contact, responsible_party_email which would cause a schema-cache error).
    const REFERRALS_COLUMNS = new Set([
      'address','admission_date','admission_notes','advanced_directive','assessment_scheduled_date',
      'assigned_marketer','attending_physician','benefit_period_number','caregiver_contact','caregiver_name',
      'chaplain','closed_reason','cna','contact_date','date_of_birth','deleted_at','diagnosis','dme_needs',
      'dnr_status','emergency_contact','emergency_phone','first_name','followup_frequency','funeral_arrangements',
      'height','insurance','insurance_verification','last_name','location_city','location_type','marketer',
      'md_notified','medicaid_number','medical_records_received','medicare_number','middle_name','msw_notes',
      'next_followup_date','next_steps','notes','organization_id','patient_location','patient_name','patient_phone',
      'patient_status_note','pcp_company','pcp_provider','phone','physician','primary_insurance','primary_rn',
      'prior_hospice_info','priority','reason_for_non_admittance','referral_contact_email','referral_contact_person',
      'referral_contact_phone','referral_date','referral_intake_coordinator','referral_source','referring_contact_name',
      'referring_physician','responsible_party_contact','responsible_party_name','responsible_party_relationship',
      'secondary_insurance','social_worker','special_medical_needs','spiritual_preferences','ssn','status',
      'transport_needs','upcoming_appointments','weight',
    ]);
    Object.keys(updateData).forEach((k) => {
      if (!REFERRALS_COLUMNS.has(k)) delete updateData[k];
    });

    // Validate closed reason (db column is reason_for_non_admittance)
    if (updateData.status === 'closed' && !(updateData.reason_for_non_admittance && String(updateData.reason_for_non_admittance).trim())) {
      toast({ title: 'Close reason is required for Closed status', variant: 'destructive' });
      return;
    }

    // Admission gate-check: require key fields before admitting
    if (updateData.status === 'admitted' && referralData?.status !== 'admitted') {
      const admissionRequiredFields = [
        { key: 'patient_name', label: 'Patient Name' },
        { key: 'address', label: 'Address' },
        { key: 'date_of_birth', label: 'Date of Birth' },
        { key: 'diagnosis', label: 'Primary Diagnosis' },
        { key: 'insurance', label: 'Insurance', alt: 'primary_insurance' },
        { key: 'physician', label: 'Physician', alt: 'referring_physician' },
        { key: 'emergency_contact', label: 'Emergency Contact' },
        { key: 'emergency_phone', label: 'Emergency Phone' },
        { key: 'responsible_party_name', label: 'Responsible Party' },
      ];

      const missing = admissionRequiredFields.filter(f => {
        const val = updateData[f.key] || (f.alt ? updateData[f.alt] : null);
        return !val || (typeof val === 'string' && !val.trim());
      });

      if (missing.length > 0) {
        toast({
          title: 'Cannot admit: missing required fields',
          description: missing.map(f => f.label).join(', '),
          variant: 'destructive',
        });
        return;
      }
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

  const showReasonField = statusValue === 'closed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
        <DialogHeader className="bg-white">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Edit Patient/Referral: {displayName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="patient-info" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mx-4 sm:mx-6 mt-4 bg-gray-100">
            <TabsTrigger value="patient-info" className="text-sm sm:text-base text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">Patient Info</TabsTrigger>
            <TabsTrigger value="status-notes" className="text-sm sm:text-base text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">Status & Notes</TabsTrigger>
            <TabsTrigger value="followup" className="text-sm sm:text-base text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">Follow-up</TabsTrigger>
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
                      {(() => {
                        const admDate = referralData?.admission_date;
                        const calc = admDate ? calculateBenefitPeriod(admDate) : null;
                        const currentManual = referralData?.benefit_period_number?.toString() || '1';
                        const mismatch = calc && calc.period.toString() !== currentManual;
                        return (
                          <>
                            {calc && (
                              <div className="mb-2 p-2 rounded-md bg-muted text-sm space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Auto-calculated:</span>
                                  <Badge variant="outline">Period {calc.period}</Badge>
                                </div>
                                <Progress value={(calc.daysElapsed / calc.totalDays) * 100} className="h-2" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Day {calc.daysElapsed} of {calc.totalDays}</span>
                                  <span>{calc.daysRemaining} days remaining</span>
                                </div>
                              </div>
                            )}
                            <Select 
                              name="benefit_period_number" 
                              defaultValue={calc ? calc.period.toString() : currentManual}
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
                            {mismatch && (
                              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Manual selection differs from calculated period ({calc.period})
                              </p>
                            )}
                          </>
                        );
                      })()}
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
                  <Select name="status" value={statusValue} onValueChange={setStatusValue}>
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
                  <Label htmlFor="reason_for_non_admittance" className="text-gray-700">Close Reason *</Label>
                  <Select name="reason_for_non_admittance" defaultValue={(referralData as any)?.reason_for_non_admittance || ''}>
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

                <div className="space-y-2">
                  <CharacterCounterTextarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a new comment..."
                    rows={2}
                    maxLength={2000}
                    className="w-full bg-white border-gray-300 text-gray-900"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={addComment}
                      disabled={!newComment.trim()}
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Comment
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="followup" className="space-y-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pcp_provider" className="text-gray-700">PCP Provider</Label>
                  <Input
                    id="pcp_provider"
                    name="pcp_provider"
                    defaultValue={(referralData as any).pcp_provider || ''}
                    placeholder="e.g., Judith, Daniella, Kim"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                  <p className="text-xs text-muted-foreground mt-1">DoctorCare or external PCP following this patient</p>
                </div>
                <div>
                  <Label htmlFor="pcp_company" className="text-gray-700">Primary Care Company</Label>
                  <Input
                    id="pcp_company"
                    name="pcp_company"
                    defaultValue={(referralData as any).pcp_company || ''}
                    placeholder="e.g., DoctorCare, Optum, HonorHealth"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Practice or facility the PCP is affiliated with</p>
                </div>
                <div>
                  <Label htmlFor="next_followup_date" className="text-gray-700">Next Follow-up Date</Label>
                  <Input
                    id="next_followup_date"
                    name="next_followup_date"
                    type="date"
                    defaultValue={(referralData as any).next_followup_date || ''}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="followup_frequency" className="text-gray-700">Follow-up Frequency</Label>
                  <Select name="followup_frequency" defaultValue={(referralData as any).followup_frequency || 'monthly'}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300 z-[100]">
                      {FOLLOWUP_FREQUENCIES.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location_type" className="text-gray-700">Location Type</Label>
                  <Select name="location_type" defaultValue={(referralData as any).location_type || ''}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Select location type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300 z-[100]">
                      {LOCATION_TYPES.map(l => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location_city" className="text-gray-700">Location City</Label>
                  <Input
                    id="location_city"
                    name="location_city"
                    defaultValue={(referralData as any).location_city || ''}
                    placeholder="e.g., Scottsdale, Mesa, Goodyear"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="md_notified"
                    name="md_notified"
                    defaultChecked={(referralData as any).md_notified || false}
                  />
                  <Label htmlFor="md_notified" className="text-gray-700">MD Notified of Admission</Label>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="patient_status_note" className="text-gray-700">
                    Patient Status Note <span className="text-xs text-gray-500">(quick-glance summary)</span>
                  </Label>
                  <Textarea
                    id="patient_status_note"
                    name="patient_status_note"
                    defaultValue={(referralData as any).patient_status_note || ''}
                    placeholder="e.g., Declining, family considering hospice; PCP scheduling F2F next week"
                    rows={2}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="referral-source" className="space-y-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organization_id" className="text-gray-700">Referring Organization <span className="text-destructive">*</span></Label>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Referrals are attributed to organizations for compliance reporting.
                  </p>
                </div>
                <div>
                  <Label htmlFor="referring_contact_name" className="text-gray-700">Clinician/Contact Name at Referring Org</Label>
                  <Input
                    id="referring_contact_name"
                    name="referring_contact_name"
                    defaultValue={(referralData as any).referring_contact_name || referralData.referral_contact_person || ''}
                    placeholder="e.g., Dr. Smith, Donna (discharge planner)"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The clinician or staff member who identified the patient need. Internal context only — not shown in reports.
                  </p>
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
