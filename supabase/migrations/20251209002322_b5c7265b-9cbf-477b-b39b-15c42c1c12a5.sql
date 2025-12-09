-- Fix security vulnerabilities: Remove overly permissive dreamlit policies

-- 1. Remove public access policy from profiles table
DROP POLICY IF EXISTS "dreamlit_dreamlit_app_select_policy" ON public.profiles;

-- 2. Remove public access policy from storage.objects
DROP POLICY IF EXISTS "dreamlit_dreamlit_app_select_policy" ON storage.objects;