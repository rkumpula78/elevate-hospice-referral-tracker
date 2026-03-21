
-- Fix visits: drop existing policy first then recreate
DROP POLICY IF EXISTS "Authenticated users can manage visits" ON public.visits;
DROP POLICY IF EXISTS "Allow all operations on visits" ON public.visits;
CREATE POLICY "Authenticated users can manage visits"
ON public.visits FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
