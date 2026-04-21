
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Upload, X, FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentsSectionProps {
  patient: any;
  documents: any[];
  isOpen: boolean;
  onToggle: () => void;
  uploading: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, docType: string) => void;
  onDownloadFile: (document: any) => void;
  onDeleteDocument: (document: any) => void;
}

const DocumentsSection = ({ 
  patient, 
  documents, 
  isOpen, 
  onToggle, 
  uploading, 
  onFileUpload, 
  onDownloadFile, 
  onDeleteDocument 
}: DocumentsSectionProps) => {
  const [dragOver, setDragOver] = useState<string | null>(null);

  const documentTypes = [
    { key: 'insurance_card', label: 'Insurance Card' },
    { key: 'id', label: 'ID' },
    { key: 'advanced_directive', label: 'Advanced Directive' },
    { key: 'dnr', label: 'DNR' },
    { key: 'medical_records', label: 'Medical Records' },
    { key: 'other', label: 'Other' }
  ];

  // Convert dropped files into a synthetic change event for the existing handler
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, docType: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
    if (uploading) return;
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const input = document.getElementById(`file-upload-${docType}`) as HTMLInputElement | null;
    if (input) {
      const dt = new DataTransfer();
      Array.from(files).forEach((f) => dt.items.add(f));
      input.files = dt.files;
      const event = new Event('change', { bubbles: true });
      input.dispatchEvent(event);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
        <h3 className="text-lg font-medium">7. Patient Documents</h3>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
        <p className="text-xs text-muted-foreground mb-3">
          Tip: drag &amp; drop a file onto any category below to upload it.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentTypes.map((docType) => (
            <div
              key={docType.key}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(docType.key); }}
              onDragEnter={(e) => { e.preventDefault(); setDragOver(docType.key); }}
              onDragLeave={(e) => { e.preventDefault(); setDragOver(null); }}
              onDrop={(e) => handleDrop(e, docType.key)}
              className={cn(
                'border-2 border-dashed rounded-lg p-4 transition-colors',
                dragOver === docType.key
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200'
              )}
            >
              <h4 className="font-medium mb-2">{docType.label}</h4>
              <input
                type="file"
                id={`file-upload-${docType.key}`}
                className="hidden"
                onChange={(e) => onFileUpload(e, docType.key)}
                disabled={uploading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(`file-upload-${docType.key}`)?.click()}
                disabled={uploading}
                className="w-full mb-2"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : `Upload or drop ${docType.label}`}
              </Button>
              
              {documents?.filter(doc => doc.document_type === docType.key).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded mt-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="text-sm truncate">{doc.file_name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onDownloadFile(doc)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteDocument(doc)}
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
  );
};

export default DocumentsSection;
