import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const VALID_EVENTS = ['new_referral', 'status_change'] as const;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { event, referral_id, old_status, new_status } = body;

    // Validate
    if (!event || !VALID_EVENTS.includes(event)) {
      return new Response(
        JSON.stringify({ error: 'Invalid event type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!referral_id || !UUID_REGEX.test(referral_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid referral_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for webhook config lookup and logging
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Look up webhook config
    const { data: config, error: configError } = await serviceClient
      .from('webhook_config')
      .select('webhook_url, enabled')
      .eq('event_type', event)
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: 'No config found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!config.enabled) {
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: 'Webhook disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build payload
    const payload: Record<string, any> = {
      referral_id,
      event,
      timestamp: new Date().toISOString(),
    };

    if (event === 'status_change') {
      payload.old_status = old_status || 'unknown';
      payload.new_status = new_status || 'unknown';
    }

    // Fire webhook
    let httpStatus = 0;
    let success = false;
    let errorMessage: string | null = null;

    try {
      const webhookResponse = await fetch(config.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      httpStatus = webhookResponse.status;
      success = webhookResponse.ok;
      if (!success) {
        errorMessage = `HTTP ${httpStatus}`;
      }
      // Consume body to prevent resource leak
      await webhookResponse.text();
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Unknown error';
    }

    // Log result
    await serviceClient.from('webhook_logs').insert({
      event_type: event,
      referral_id,
      http_status: httpStatus || null,
      success,
      error_message: errorMessage,
      payload,
    });

    // Update last_triggered_at on config
    await serviceClient.from('webhook_config').update({
      last_triggered_at: new Date().toISOString(),
      last_status: success ? 'success' : `failed: ${errorMessage}`,
    }).eq('event_type', event);

    return new Response(
      JSON.stringify({ ok: true, success }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('notify-webhook error');
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
