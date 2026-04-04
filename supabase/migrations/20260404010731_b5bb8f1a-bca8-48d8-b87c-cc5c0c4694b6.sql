-- Fix storage policies: change from {public} to {authenticated} with has_healthcare_access()

-- Drop the 6 misconfigured {public} policies for patient-documents and organization-documents
DROP POLICY IF EXISTS "Authenticated users can view patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view organization documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload organization documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete organization documents" ON storage.objects;

-- Recreate with {authenticated} role and has_healthcare_access() check
CREATE POLICY "Authenticated users can view patient documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'patient-documents' AND public.has_healthcare_access());

CREATE POLICY "Authenticated users can upload patient documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'patient-documents' AND public.has_healthcare_access());

CREATE POLICY "Authenticated users can delete patient documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'patient-documents' AND public.has_healthcare_access());

CREATE POLICY "Authenticated users can view organization documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'organization-documents' AND public.has_healthcare_access());

CREATE POLICY "Authenticated users can upload organization documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'organization-documents' AND public.has_healthcare_access());

CREATE POLICY "Authenticated users can delete organization documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'organization-documents' AND public.has_healthcare_access());