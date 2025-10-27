import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileText, Download, Plus, Edit, Trash, Settings } from 'lucide-react';
import OrganizationContactsTab from './OrganizationContactsTab';
import MarketerSettingsDialog from './MarketerSettingsDialog';

interface EditOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

const EditOrganizationDialog = ({ open, onOpenChange, organizationId }: EditOrganizationDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [licenseInput, setLicenseInput] = useState('');
  const [hospiceInput, setHospiceInput] = useState('');
  const [showMarketerSettings, setShowMarketerSettings] = useState(false);

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

  // Fetch organization data
  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!organizationId
  });

  const { data: documents } = useQuery({
    queryKey: ['organization-documents', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_documents')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!organizationId
  });

  // Update organization mutation
  const updateOrganizationMutation = useMutation({
    mutationFn: async (data: any) => {
      // Clean the data to remove undefined values and ensure proper types
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined && value !== '')
      );
      
      // Ensure numeric fields are properly converted
      if (cleanData.bed_count) {
        cleanData.bed_count = parseInt(cleanData.bed_count as string);
      }
      if (cleanData.service_radius) {
        cleanData.service_radius = parseInt(cleanData.service_radius as string);
      }
      if (cleanData.referral_potential) {
        cleanData.referral_potential = parseInt(cleanData.referral_potential as string);
      }

      const { error } = await supabase
        .from('organizations')
        .update(cleanData)
        .eq('id', organizationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });
      toast({ title: 'Organization updated successfully' });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Organization update error:', error);
      toast({ title: 'Error updating organization', description: error.message, variant: 'destructive' });
    }
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: string }) => {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${organizationId}/${Date.now()}.${fileExt}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('organization-documents')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;

      // Create document record
      const { error: dbError } = await supabase
        .from('organization_documents')
        .insert({
          organization_id: organizationId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          content_type: file.type,
          document_type: documentType
        });
      
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-documents', organizationId] });
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
        .from('organization-documents')
        .remove([document.file_path]);
      
      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('organization_documents')
        .delete()
        .eq('id', document.id);
      
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-documents', organizationId] });
      toast({ title: 'Document deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting document', description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const updateData = {
      // Basic Info
      name: formData.get('name') as string || organization?.name,
      dba_name: formData.get('dba_name') as string || null,
      type: formData.get('type') as string || organization?.type,
      sub_type: formData.get('sub_type') as string || null,
      medicare_id: formData.get('medicare_id') as string || null,
      bed_count: formData.get('bed_count') ? parseInt(formData.get('bed_count') as string) : null,
      ownership_type: formData.get('ownership_type') as string || null,
      
      // Contact Info
      address: formData.get('address') as string || null,
      phone: formData.get('phone') as string || null,
      website: formData.get('website') as string || null,
      after_hours_contact: formData.get('after_hours_contact') as string || null,
      service_radius: formData.get('service_radius') ? parseInt(formData.get('service_radius') as string) : null,
      contact_person: formData.get('contact_person') as string || null,
      contact_email: formData.get('contact_email') as string || null,
      
      // Strategy
      account_rating: formData.get('account_rating') as string || organization?.account_rating,
      partnership_stage: formData.get('partnership_stage') as string || organization?.partnership_stage,
      referral_potential: formData.get('referral_potential') ? parseInt(formData.get('referral_potential') as string) : organization?.referral_potential,
      assigned_marketer: (() => {
        const value = formData.get('assigned_marketer') as string;
        return value === 'unassigned' ? null : value || null;
      })(),
      contract_status: formData.get('contract_status') as string || organization?.contract_status,
      partnership_notes: formData.get('partnership_notes') as string || null,
      
      // Intelligence
      competitive_landscape: formData.get('competitive_landscape') as string || null,
      financial_health_notes: formData.get('financial_health_notes') as string || null,
      expansion_plans: formData.get('expansion_plans') as string || null,
      regulatory_notes: formData.get('regulatory_notes') as string || null,
      
      // Keep existing arrays
      license_numbers: organization?.license_numbers || [],
      current_hospice_providers: organization?.current_hospice_providers || [],
      
      is_active: formData.get('is_active') === 'true'
    };

    updateOrganizationMutation.mutate(updateData);
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
        .from('organization-documents')
        .download(document.file_path);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: 'Error downloading file', variant: 'destructive' });
    }
  };

  const addLicenseNumber = () => {
    if (licenseInput.trim() && organization) {
      const updatedLicenses = [...(organization.license_numbers || []), licenseInput.trim()];
      updateOrganizationMutation.mutate({ license_numbers: updatedLicenses });
      setLicenseInput('');
    }
  };

  const removeLicenseNumber = (index: number) => {
    if (organization) {
      const updatedLicenses = organization.license_numbers?.filter((_, i) => i !== index) || [];
      updateOrganizationMutation.mutate({ license_numbers: updatedLicenses });
    }
  };

  const addHospiceProvider = () => {
    if (hospiceInput.trim() && organization) {
      const updatedProviders = [...(organization.current_hospice_providers || []), hospiceInput.trim()];
      updateOrganizationMutation.mutate({ current_hospice_providers: updatedProviders });
      setHospiceInput('');
    }
  };

  const removeHospiceProvider = (index: number) => {
    if (organization) {
      const updatedProviders = organization.current_hospice_providers?.filter((_, i) => i !== index) || [];
      updateOrganizationMutation.mutate({ current_hospice_providers: updatedProviders });
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p>Loading organization information...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!organization) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Organization: {organization.name}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="basic-info" className="h-full flex flex-col">
              <TabsList className="flex-shrink-0 grid w-full grid-cols-6">
                <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="strategy">Strategy</TabsTrigger>
                <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSubmit} className="h-full">
                  <TabsContent value="basic-info" className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Organization Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          defaultValue={organization.name}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="dba_name">DBA Name</Label>
                        <Input
                          id="dba_name"
                          name="dba_name"
                          defaultValue={organization.dba_name || ''}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">Primary Type *</Label>
                        <Select name="type" defaultValue={organization.type}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="assisted_living">Assisted Living</SelectItem>
                            <SelectItem value="hospital">Hospital</SelectItem>
                            <SelectItem value="clinic">Cancer Center/Clinic</SelectItem>
                            <SelectItem value="physician_office">Physician Office</SelectItem>
                            <SelectItem value="nursing_home">Skilled Nursing</SelectItem>
                            <SelectItem value="home_health">Home Health</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="sub_type">Sub-Type</Label>
                        <Input
                          id="sub_type"
                          name="sub_type"
                          defaultValue={organization.sub_type || ''}
                          placeholder="e.g., Memory Care, Rehabilitation"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="medicare_id">Medicare ID</Label>
                        <Input
                          id="medicare_id"
                          name="medicare_id"
                          defaultValue={organization.medicare_id || ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bed_count">Bed Count</Label>
                        <Input
                          id="bed_count"
                          name="bed_count"
                          type="number"
                          defaultValue={organization.bed_count || ''}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="ownership_type">Ownership Type</Label>
                      <Select name="ownership_type" defaultValue={organization.ownership_type || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ownership type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="for_profit">For-Profit</SelectItem>
                          <SelectItem value="non_profit">Non-Profit</SelectItem>
                          <SelectItem value="chain">Chain</SelectItem>
                          <SelectItem value="independent">Independent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>License Numbers</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={licenseInput}
                          onChange={(e) => setLicenseInput(e.target.value)}
                          placeholder="Enter license number"
                        />
                        <Button type="button" onClick={addLicenseNumber}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {organization.license_numbers?.map((license, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {license}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => removeLicenseNumber(index)} />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="contact" className="mt-4 space-y-4">
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        name="address"
                        defaultValue={organization.address || ''}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Main Phone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          defaultValue={organization.phone || ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="after_hours_contact">After Hours Contact</Label>
                        <Input
                          id="after_hours_contact"
                          name="after_hours_contact"
                          defaultValue={organization.after_hours_contact || ''}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          name="website"
                          defaultValue={organization.website || ''}
                          placeholder="https://"
                        />
                      </div>
                      <div>
                        <Label htmlFor="service_radius">Service Radius (miles)</Label>
                        <Input
                          id="service_radius"
                          name="service_radius"
                          type="number"
                          defaultValue={organization.service_radius || ''}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact_person">Primary Contact</Label>
                        <Input
                          id="contact_person"
                          name="contact_person"
                          defaultValue={organization.contact_person || ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact_email">Contact Email</Label>
                        <Input
                          id="contact_email"
                          name="contact_email"
                          type="email"
                          defaultValue={organization.contact_email || ''}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="strategy" className="mt-4 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="account_rating">Account Rating</Label>
                        <Select name="account_rating" defaultValue={organization.account_rating || 'C'}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A - High Priority</SelectItem>
                            <SelectItem value="B">B - Medium-High</SelectItem>
                            <SelectItem value="C">C - Medium</SelectItem>
                            <SelectItem value="P">P - Prospect</SelectItem>
                            <SelectItem value="D">D - Low Priority</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="partnership_stage">Partnership Stage</Label>
                        <Select name="partnership_stage" defaultValue={organization.partnership_stage || 'prospect'}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="prospect">Prospect</SelectItem>
                            <SelectItem value="developing">Developing</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="strategic">Strategic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="referral_potential">Referral Potential (1-10)</Label>
                        <Select name="referral_potential" defaultValue={String(organization.referral_potential || 5)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[...Array(10)].map((_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="assigned_marketer">Assigned Marketer</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowMarketerSettings(true)}
                            className="h-8 px-2"
                          >
                            <Settings className="w-3 h-3" />
                          </Button>
                        </div>
                        <Select name="assigned_marketer" defaultValue={organization.assigned_marketer || ''}>
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
                        <Label htmlFor="contract_status">Contract Status</Label>
                        <Select name="contract_status" defaultValue={organization.contract_status || 'open'}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exclusive">Exclusive</SelectItem>
                            <SelectItem value="preferred">Preferred</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="competitive">Competitive</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="is_active">Status</Label>
                        <Select name="is_active" defaultValue={organization.is_active ? 'true' : 'false'}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="partnership_notes">Partnership Notes</Label>
                      <Textarea
                        id="partnership_notes"
                        name="partnership_notes"
                        defaultValue={organization.partnership_notes || ''}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="intelligence" className="mt-4 space-y-4">
                    <div>
                      <Label>Current Hospice Providers</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={hospiceInput}
                          onChange={(e) => setHospiceInput(e.target.value)}
                          placeholder="Enter hospice provider"
                        />
                        <Button type="button" onClick={addHospiceProvider}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {organization.current_hospice_providers?.map((hospice, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {hospice}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => removeHospiceProvider(index)} />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="competitive_landscape">Competitive Landscape</Label>
                      <Textarea
                        id="competitive_landscape"
                        name="competitive_landscape"
                        defaultValue={organization.competitive_landscape || ''}
                        placeholder="Overview of competitive situation..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="financial_health_notes">Financial Health Notes</Label>
                      <Textarea
                        id="financial_health_notes"
                        name="financial_health_notes"
                        defaultValue={organization.financial_health_notes || ''}
                      />
                    </div>

                    <div>
                      <Label htmlFor="expansion_plans">Expansion Plans</Label>
                      <Textarea
                        id="expansion_plans"
                        name="expansion_plans"
                        defaultValue={organization.expansion_plans || ''}
                      />
                    </div>

                    <div>
                      <Label htmlFor="regulatory_notes">Regulatory Notes</Label>
                      <Textarea
                        id="regulatory_notes"
                        name="regulatory_notes"
                        defaultValue={organization.regulatory_notes || ''}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="documents" className="mt-4 space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Organization Documents</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['contract', 'certification', 'contact_info', 'insurance', 'license', 'other'].map((docType) => (
                          <div key={docType} className="border rounded-lg p-4 space-y-3">
                            <h4 className="font-medium capitalize text-sm">
                              {docType.replace('_', ' ')}
                            </h4>
                            
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
                              className="w-full"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload {docType.replace('_', ' ')}
                            </Button>
                            
                            <div className="space-y-2">
                              {documents?.filter(doc => doc.document_type === docType).map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileText className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{doc.file_name}</span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => downloadFile(doc)}
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => deleteDocumentMutation.mutate(doc)}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="contacts" className="mt-4">
                    <OrganizationContactsTab 
                      organizationId={organizationId}
                      organizationName={organization.name}
                    />
                  </TabsContent>

                  <div className="flex justify-end gap-2 pt-4 border-t bg-white sticky bottom-0">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateOrganizationMutation.isPending}>
                      {updateOrganizationMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <MarketerSettingsDialog 
        open={showMarketerSettings} 
        onOpenChange={setShowMarketerSettings} 
      />
    </>
  );
};

export default EditOrganizationDialog;
