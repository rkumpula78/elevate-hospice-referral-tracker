CREATE OR REPLACE FUNCTION public.normalize_organization_contact_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role_in_referral IS NOT NULL THEN
    NEW.role_in_referral := NULLIF(btrim(NEW.role_in_referral), '');

    IF NEW.role_in_referral IS NOT NULL
      AND NEW.role_in_referral <> ALL (ARRAY[
        'decision_maker',
        'influencer',
        'gatekeeper',
        'user',
        'primary_contact',
        'secondary_contact',
        'administrator',
        'nurse',
        'social_worker',
        'physician',
        'manager',
        'director',
        'coordinator',
        'other'
      ])
    THEN
      NEW.role_in_referral := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_organization_contact_role_before_save ON public.organization_contacts;

CREATE TRIGGER normalize_organization_contact_role_before_save
BEFORE INSERT OR UPDATE ON public.organization_contacts
FOR EACH ROW
EXECUTE FUNCTION public.normalize_organization_contact_role();