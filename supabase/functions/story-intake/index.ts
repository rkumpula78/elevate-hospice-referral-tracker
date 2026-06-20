import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Inbound endpoint for a Microsoft Teams "Share a Story" form.
// A Power Automate flow posts the form answers here; we write them into
// story_submissions so they show up in the CRM's Stories review queue.
//
// Auth: this runs with verify_jwt = false (Power Automate has no Supabase JWT),
// so we require a shared secret header instead. Set STORY_INTAKE_SECRET in the
// edge function secrets and send it as `x-intake-secret`.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-intake-secret',
};

const VALID_TYPES = ['patient_story', 'family_feedback', 'content_idea'] as const;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Shared-secret auth
    const expectedSecret = Deno.env.get('STORY_INTAKE_SECRET');
    const providedSecret = req.headers.get('x-intake-secret');
    if (!expectedSecret || providedSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const submittedBy = (body.submitted_by || body.submittedBy || '').toString().trim();
    if (!submittedBy) {
      return new Response(
        JSON.stringify({ error: 'submitted_by is required (the name or email of the person sharing the story)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const submissionType = VALID_TYPES.includes(body.submission_type)
      ? body.submission_type
      : 'patient_story';

    const clamp = (v: any, max: number) =>
      v == null ? null : v.toString().slice(0, max);

    const row = {
      submitted_by: clamp(submittedBy, 200),
      submitted_by_role: clamp(body.submitted_by_role || body.role, 100),
      submission_type: submissionType,
      patient_alias: clamp(body.patient_alias, 200),
      story_notes: clamp(body.story_notes || body.notes, 5000),
      suggested_quote: clamp(body.suggested_quote || body.quote, 2000),
      consent_obtained: body.consent_obtained === true || body.consent_obtained === 'true',
      status: 'new' as const,
    };

    // Service-role client: no authenticated user, so we bypass RLS to insert.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error } = await supabaseAdmin.from('story_submissions').insert(row);
    if (error) {
      console.error('story-intake insert error:', error.message);
      return new Response(
        JSON.stringify({ error: 'Failed to save submission' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Story submitted for review. Thank you!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('story-intake error');
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
