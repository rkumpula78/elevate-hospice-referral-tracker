
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileText, Download } from 'lucide-react';

interface EditOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

const EditOrganizationDialog = ({ open, onOpenChange, organizationId }: EditOrganizationDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

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

  // Fetch organization documents
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
      const { error } = await supabase
        .from('organizations')
        .update(data)
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
      name: formData.get('name'),
      type: formData.get('type'),
      address: formData.get('address'),
      phone: formData.get('phone'),
      contact_person: formData.get('contact_person'),
      contact_email: formData.get('contact_email'),
      assigned_marketer: formData.get('assigned_marketer'),
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Organization: {organization.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="basic-info" className="h-full flex flex-col">
            <TabsList className="flex-shrink-0 grid w-full grid-cols-2">
              <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="h-full">
                <TabsContent value="basic-info" className="mt-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Organization Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={organization.name}
                        required
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="type">Type *</Label>
                      <Select name="type" defaultValue={organization.type}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hospital">Hospital</SelectItem>
                          <SelectItem value="clinic">Cancer Center/Clinic</SelectItem>
                          <SelectItem value="physician_office">Physician Office</SelectItem>
                          <SelectItem value="nursing_home">Skilled Nursing</SelectItem>
                          <SelectItem value="home_health">Home Health</SelectItem>
                          <SelectItem value="assisted_living">Assisted Living</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      defaultValue={organization.address || ''}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        defaultValue={organization.phone || ''}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contact_person">Contact Person</Label>
                      <Input
                        id="contact_person"
                        name="contact_person"
                        defaultValue={organization.contact_person || ''}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Contact Email</Label>
                      <Input
                        id="contact_email"
                        name="contact_email"
                        type="email"
                        defaultValue={organization.contact_email || ''}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="assigned_marketer">Assigned Marketer</Label>
                      <Input
                        id="assigned_marketer"
                        name="assigned_marketer"
                        defaultValue={organization.assigned_marketer || ''}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="is_active">Status</Label>
                    <Select name="is_active" defaultValue={organization.is_active ? 'true' : 'false'}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
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
  );
};

export default EditOrganizationDialog;
