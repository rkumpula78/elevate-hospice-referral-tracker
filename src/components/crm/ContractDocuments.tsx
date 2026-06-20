import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Download, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

// Contract files are stored in the shared `organization-documents` bucket and
// `organization_documents` table with document_type='contract' — the same place
// the Documents tab uses — so uploads here and there stay in sync.
const BUCKET = 'organization-documents';

const ContractDocuments = ({ organizationId }: { organizationId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['contract-documents', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_documents')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('document_type', 'contract')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${organizationId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('organization_documents').insert({
        organization_id: organizationId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        content_type: file.type,
        document_type: 'contract',
      });
      if (dbError) throw dbError;

      // Keep the Contract Details card in sync: a contract clearly exists now.
      await supabase.from('organizations').update({ contract_on_file: true }).eq('id', organizationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-documents', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-documents', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });
      toast({ title: 'Contract uploaded' });
    },
    onError: (err: any) => {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    },
    onSettled: () => setUploading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: any) => {
      await supabase.storage.from(BUCKET).remove([doc.file_path]);
      const { error } = await supabase.from('organization_documents').delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-documents', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-documents', organizationId] });
      toast({ title: 'Contract removed' });
    },
    onError: (err: any) => {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    },
  });

  const handleDownload = async (doc: any) => {
    const { data, error } = await supabase.storage.from(BUCKET).download(doc.file_path);
    if (error || !data) {
      toast({ title: 'Download failed', description: error?.message, variant: 'destructive' });
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = '';
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-4 h-4" />
          Contract Documents
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
          Upload
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} />
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : documents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-3 text-center">
            <p className="text-sm text-muted-foreground">No contract files uploaded yet.</p>
          </div>
        ) : (
          documents.map((doc: any) => (
            <div key={doc.id} className="flex items-center justify-between rounded-lg border p-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{doc.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.created_at ? format(new Date(doc.created_at), 'MMM d, yyyy') : ''}
                  {doc.file_size ? ` · ${(doc.file_size / 1024).toFixed(0)} KB` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownload(doc)} aria-label="Download">
                  <Download className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-red-600 hover:text-red-700"
                  onClick={() => { if (window.confirm('Delete this contract file?')) deleteMutation.mutate(doc); }}
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ContractDocuments;
