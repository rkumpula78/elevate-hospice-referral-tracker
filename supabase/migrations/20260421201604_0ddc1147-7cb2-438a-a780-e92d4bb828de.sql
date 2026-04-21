CREATE OR REPLACE FUNCTION public.notify_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  wh_url text;
  is_enabled boolean;
  event_key text;
  org_name text;
  status_label text;
  msg text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  IF NEW.status::text IN ('admitted', 'discharged', 'deceased', 'revoked') THEN event_key := 'status_admitted';
  ELSIF NEW.status::text = 'palliative_outreach' THEN event_key := 'status_palliative';
  ELSE event_key := 'status_referral'; END IF;

  SELECT w.webhook_url, w.enabled INTO wh_url, is_enabled FROM webhook_config w WHERE w.event_type = event_key;
  IF NOT FOUND OR NOT is_enabled THEN RETURN NEW; END IF;

  org_name := COALESCE(get_org_name(NEW.organization_id), NEW.referral_source, 'Unknown');
  status_label := CASE NEW.status::text
    WHEN 'admitted' THEN 'ADMITTED' WHEN 'discharged' THEN 'DISCHARGED' WHEN 'deceased' THEN 'DECEASED'
    WHEN 'revoked' THEN 'REVOKED' WHEN 'palliative_outreach' THEN 'PALLIATIVE OUTREACH'
    WHEN 'contacted' THEN 'CONTACTED' WHEN 'assessment_scheduled' THEN 'ASSESSMENT SCHEDULED'
    WHEN 'new_referral' THEN 'NEW REFERRAL' WHEN 'not_appropriate' THEN 'NOT APPROPRIATE'
    WHEN 'declined' THEN 'DECLINED' WHEN 'lost_to_followup' THEN 'LOST TO FOLLOW-UP'
    WHEN 'closed' THEN 'CLOSED' ELSE UPPER(NEW.status::text) END;

  msg := 'STATUS: ' || status_label || E'\n\n'
    || 'Patient: ' || COALESCE(NEW.patient_name, 'Unknown') || E'\n'
    || 'Source: ' || org_name || E'\n'
    || 'Changed: ' || COALESCE(OLD.status::text, 'unknown') || ' -> ' || NEW.status::text || E'\n'
    || CASE WHEN NEW.notes IS NOT NULL AND NEW.notes != '' THEN 'Notes: ' || NEW.notes || E'\n' ELSE '' END
    || E'\nhttps://referrals.elevatehospiceaz.com/referral/' || NEW.id;

  PERFORM net.http_post(url := wh_url, headers := '{"Content-Type": "application/json"}'::jsonb, body := jsonb_build_object('text', msg));
  UPDATE webhook_config SET last_triggered_at = now(), last_status = 'sent' WHERE event_type = event_key;
  RETURN NEW;
END;
$function$;