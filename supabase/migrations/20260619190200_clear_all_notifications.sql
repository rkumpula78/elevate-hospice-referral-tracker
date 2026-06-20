-- One-time reset: everyone had too many stacked in-app notifications.
-- Clear the inbox so all users start from scratch. Migrations run with
-- elevated privileges, so this bypasses the per-user RLS that blocks bulk deletes.
-- (Safe to keep in history; it only runs once on apply.)

DELETE FROM public.notifications;
