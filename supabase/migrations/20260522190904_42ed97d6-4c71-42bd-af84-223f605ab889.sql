UPDATE auth.users
SET email_confirmed_at = now()
WHERE id = '10268c8b-de33-4f0f-8ec7-0f078a2c3765'
  AND email_confirmed_at IS NULL;