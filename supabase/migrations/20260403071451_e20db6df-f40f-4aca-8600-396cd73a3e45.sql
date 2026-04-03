
-- Create enums for stories
CREATE TYPE public.story_source AS ENUM ('google_review', 'bereavement_call', 'family_submission', 'staff_observed', 'other');
CREATE TYPE public.story_consent_status AS ENUM ('public_source', 'consent_on_file', 'pending_consent', 'anonymous_approved');
CREATE TYPE public.story_status AS ENUM ('draft', 'in_review', 'approved', 'archived');
CREATE TYPE public.submission_type AS ENUM ('patient_story', 'family_feedback', 'content_idea');
CREATE TYPE public.submission_status AS ENUM ('new', 'in_review', 'approved', 'declined');

-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_alias TEXT,
  story_date DATE,
  source story_source NOT NULL DEFAULT 'other',
  consent_status story_consent_status NOT NULL DEFAULT 'pending_consent',
  consent_form_url TEXT,
  quote_short TEXT,
  quote_full TEXT,
  staff_mentioned TEXT[] DEFAULT ARRAY[]::TEXT[],
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  assets JSONB DEFAULT '{}'::JSONB,
  status story_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  submitted_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create story_submissions table
CREATE TABLE public.story_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submitted_by TEXT NOT NULL,
  submitted_by_role TEXT,
  submission_type submission_type NOT NULL DEFAULT 'patient_story',
  patient_alias TEXT,
  story_notes TEXT,
  suggested_quote TEXT,
  consent_obtained BOOLEAN DEFAULT false,
  status submission_status NOT NULL DEFAULT 'new',
  reviewer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_submissions ENABLE ROW LEVEL SECURITY;

-- Stories: all authenticated can view approved
CREATE POLICY "Authenticated users can view approved stories"
  ON public.stories FOR SELECT TO authenticated
  USING (status = 'approved' OR is_admin(auth.uid()));

-- Stories: admins can manage all
CREATE POLICY "Admins can manage stories"
  ON public.stories FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Submissions: all authenticated can insert
CREATE POLICY "Authenticated users can submit stories"
  ON public.story_submissions FOR INSERT TO authenticated
  WITH CHECK (true);

-- Submissions: all authenticated can view own
CREATE POLICY "Users can view own submissions"
  ON public.story_submissions FOR SELECT TO authenticated
  USING (true);

-- Submissions: admins can manage all
CREATE POLICY "Admins can manage submissions"
  ON public.story_submissions FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
