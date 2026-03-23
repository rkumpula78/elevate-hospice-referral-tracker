import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const ALLOWED_EMAIL_DOMAIN = '@elevatehospiceaz.com';

// Whitelist of allowed template parameter keys
const ALLOWED_TEMPLATE_KEYS = [
  'patient_name', 'admission_date', 'diagnosis', 'physician',
  'referral_source', 'insurance', 'address', 'phone',
  'emergency_contact', 'emergency_phone', 'notes',
  'intake_specialist_email', 'intake_specialist_name',
  'referring_facility', 'priority', 'status',
  'assigned_marketer', 'contact_person',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json();
    const { emailData } = body;

    if (!emailData) {
      return new Response(
        JSON.stringify({ error: 'Missing email data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate recipient email domain
    const recipientEmail = emailData.intake_specialist_email;
    if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN)) {
      return new Response(
        JSON.stringify({ error: 'Invalid recipient email. Must be an @elevatehospiceaz.com address.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get EmailJS credentials from secrets
    const serviceId = Deno.env.get('EMAILJS_SERVICE_ID');
    const templateId = Deno.env.get('EMAILJS_TEMPLATE_ID');
    const publicKey = Deno.env.get('EMAILJS_PUBLIC_KEY');

    if (!serviceId || !templateId || !publicKey) {
      console.error('EmailJS credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build sanitized template params from whitelist only
    const sanitizedParams: Record<string, string> = {};
    for (const key of ALLOWED_TEMPLATE_KEYS) {
      if (emailData[key] !== undefined && emailData[key] !== null) {
        const value = String(emailData[key]).substring(0, 1000); // length limit
        sanitizedParams[key] = value;
      }
    }

    // HIPAA: ensure SSN is never included
    delete sanitizedParams['patient_ssn'];
    delete sanitizedParams['ssn'];

    // Override recipient and specialist name
    sanitizedParams['to_email'] = recipientEmail;
    sanitizedParams['intake_specialist_name'] = sanitizedParams['intake_specialist_name'] || 'Intake Specialist';

    // Call EmailJS REST API directly
    const emailjsResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: sanitizedParams,
      }),
    });

    if (!emailjsResponse.ok) {
      console.error('EmailJS API error:', emailjsResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
