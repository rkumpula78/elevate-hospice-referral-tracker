import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "openclaw:elevate-bot";

// PHI sanitization: strip SSNs, phone numbers, emails, DOBs from any string
function sanitizeText(text: string): string {
  if (!text) return text;
  return text
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED-SSN]")
    .replace(/\b\d{9}\b/g, "[REDACTED-SSN]")
    .replace(/\b[\w.-]+@[\w.-]+\.\w{2,}\b/g, "[REDACTED-EMAIL]")
    .replace(/\b(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/g, "[REDACTED-PHONE]")
    .replace(/\b(0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g, "[REDACTED-DOB]");
}

// Recursively sanitize all string values in an object
function sanitizeContext(obj: unknown): unknown {
  if (typeof obj === "string") return sanitizeText(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeContext);
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // Skip known PHI fields entirely
      const phiFields = [
        "patient_name", "first_name", "last_name", "address", "phone",
        "ssn", "medicare_number", "medicaid_number", "date_of_birth",
        "emergency_contact", "emergency_phone", "email", "contact_phone",
        "contact_email", "responsible_party_name", "responsible_party_contact",
        "caregiver_name", "caregiver_contact"
      ];
      if (phiFields.includes(key)) continue;
      result[key] = sanitizeContext(value);
    }
    return result;
  }
  return obj;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // JWT verification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { messages, context } = body;

    // Input validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required and must not be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (messages.length > 50) {
      return new Response(
        JSON.stringify({ error: "Too many messages. Maximum 50 per request." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== "string") {
        return new Response(
          JSON.stringify({ error: "Each message must have role and content (string)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (msg.content.length > 4000) {
        return new Response(
          JSON.stringify({ error: "Message content exceeds 4000 character limit" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Sanitize context to remove any PHI
    const safeContext = context ? sanitizeContext(context) : null;

    // Sanitize user messages too
    const sanitizedMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: sanitizeText(m.content),
    }));

    const systemMessage = safeContext
      ? `You are Elevate Ops, the AI assistant for Elevate Hospice & Palliative Care. You have access to the following CRM context:\n\n${JSON.stringify(safeContext, null, 2)}\n\nUse this context to give specific, relevant answers about operations, referrals, and facilities when applicable. Never reveal patient names, SSNs, or other protected health information.`
      : "You are Elevate Ops, the AI assistant for Elevate Hospice & Palliative Care. Help the team with hospice operations, compliance questions, patient documentation, and referral management. Never reveal patient names, SSNs, or other protected health information.";

    const gatewayUrl = Deno.env.get("OPENCLAW_GATEWAY_URL");
    const apiToken = Deno.env.get("OPENCLAW_API_TOKEN");

    if (!gatewayUrl || !apiToken) {
      console.error("Missing OPENCLAW_GATEWAY_URL or OPENCLAW_API_TOKEN");
      return new Response(
        JSON.stringify({ error: "An error occurred processing your request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = {
      model: MODEL,
      messages: [
        { role: "system", content: systemMessage },
        ...sanitizedMessages,
      ],
      user: user.id,
    };

    const response = await fetch(`${gatewayUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenClaw gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "An error occurred processing your request" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
