
-- Add new fields to the patients table
ALTER TABLE public.patients 
ADD COLUMN next_steps TEXT,
ADD COLUMN notes TEXT;

-- Create a storage bucket for patient attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-attachments', 'patient-attachments', false);

-- Create a table to track patient attachments
CREATE TABLE IF NOT EXISTS public.patient_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the attachments table
ALTER TABLE public.patient_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for patient attachments
CREATE POLICY "Authenticated users can manage patient attachments" 
ON public.patient_attachments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create storage policies for patient attachments bucket
CREATE POLICY "Authenticated users can upload patient attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'patient-attachments');

CREATE POLICY "Authenticated users can view patient attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'patient-attachments');

CREATE POLICY "Authenticated users can delete patient attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'patient-attachments');

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_attachments_patient_id ON public.patient_attachments(patient_id);
