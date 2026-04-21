-- Reload PostgREST schema cache to ensure all column references resolve
NOTIFY pgrst, 'reload schema';