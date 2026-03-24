import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Elevate Hospice core values for context
const ELEVATE_VALUES = {
  dignity: "We see the person, not the chart",
  truth: "Kind, clear, and honest",
  presence: "People before paperwork",
  ownership: "This is our moment",
  hope: "Real hope grows in honesty"
};

// Message templates for different situations
const MESSAGE_TEMPLATES: Record<string, Record<string, { tone: string; structure: string }>> = {
  family: {
    initial_outreach: {
      tone: "Warm, empathetic, non-pushy",
      structure: "1) Acknowledge referral 2) Express empathy 3) Offer support 4) Easy next step"
    },
    follow_up_resistant: {
      tone: "Patient, understanding, reframing",
      structure: "1) Acknowledge their feelings 2) Reframe hospice positively 3) Address misconceptions 4) Leave door open"
    },
    urgent_admission: {
      tone: "Calm urgency, competent, reassuring",
      structure: "1) Acknowledge urgency 2) Immediate action plan 3) Comfort assurance 4) Clear timeline"
    },
    check_in: {
      tone: "Caring, supportive, not intrusive",
      structure: "1) Warm greeting 2) Specific check-in question 3) Offer support 4) Open-ended close"
    },
    difficult_news: {
      tone: "Direct but compassionate, supportive",
      structure: "1) Prepare them gently 2) Clear information 3) Acknowledge emotions 4) Immediate support"
    }
  },
  referral: {
    introduce_services: {
      tone: "Professional, informative, collaborative",
      structure: "1) Introduction 2) Value proposition 3) Specific benefits 4) Partnership invitation"
    },
    thank_referral: {
      tone: "Grateful, professional, outcome-focused",
      structure: "1) Express gratitude 2) Patient update 3) Positive outcome 4) Reinforce partnership"
    },
    partnership_proposal: {
      tone: "Professional, mutual benefit, specific",
      structure: "1) Reference connection 2) Mutual benefits 3) Specific proposal 4) Easy next step"
    },
    follow_up_meeting: {
      tone: "Appreciative, action-oriented, professional",
      structure: "1) Thank for time 2) Key takeaways 3) Next steps 4) Contact info"
    },
    share_outcomes: {
      tone: "Data-driven, grateful, reinforcing",
      structure: "1) Positive metrics 2) Specific examples 3) Thank partnership 4) Future collaboration"
    },
    schedule_inservice: {
      tone: "Educational, flexible, value-adding",
      structure: "1) Value of education 2) Topic options 3) Flexible scheduling 4) Clear CTA"
    },
    physician_outreach: {
      tone: "Professional, educational, partnership-focused, evidence-based",
      structure: "1) Professional greeting 2) Reference shared patient care goals 3) Educational value proposition 4) Clear call-to-action 5) Professional close"
    }
  }
};

/**
 * Strip any PHI that staff may have pasted into the notes field.
 * Removes patterns that look like SSNs, phone numbers, dates of birth, addresses.
 * This is a best-effort sanitization layer.
 */
function sanitizeNotesForAI(notes: string): string {
  let sanitized = notes;
  // Remove SSN patterns
  sanitized = sanitized.replace(/\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, '[REDACTED-SSN]');
  // Remove phone patterns
  sanitized = sanitized.replace(/\b(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[REDACTED-PHONE]');
  // Remove email addresses
  sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED-EMAIL]');
  // Remove date of birth patterns (MM/DD/YYYY, MM-DD-YYYY)
  sanitized = sanitized.replace(/\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g, '[REDACTED-DOB]');
  return sanitized;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ message: 'Invalid request body', success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { context, situation, notes, contactName, organizationName } = body;

    // Validate required fields
    if (!context || !['family', 'referral'].includes(context)) {
      return new Response(
        JSON.stringify({ message: 'Invalid context. Must be "family" or "referral".', success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!situation || typeof situation !== 'string' || situation.length > 200) {
      return new Response(
        JSON.stringify({ message: 'Invalid situation.', success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (notes && (typeof notes !== 'string' || notes.length > 2000)) {
      return new Response(
        JSON.stringify({ message: 'Notes must be a string under 2000 characters.', success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (contactName && (typeof contactName !== 'string' || contactName.length > 200)) {
      return new Response(
        JSON.stringify({ message: 'Contact name too long.', success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (organizationName && (typeof organizationName !== 'string' || organizationName.length > 200)) {
      return new Response(
        JSON.stringify({ message: 'Organization name too long.', success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the appropriate template or use freeform
    let template;
    if (situation === 'freeform') {
      template = {
        tone: context === 'family' 
          ? "Warm, empathetic, professional, clear"
          : "Professional, helpful, collaborative, efficient",
        structure: "Natural flow based on the specific request"
      };
    } else {
      template = MESSAGE_TEMPLATES[context]?.[situation];
      if (!template) {
        return new Response(
          JSON.stringify({ message: 'Invalid situation for the given context.', success: false }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Sanitize notes to strip any accidentally-pasted PHI
    const sanitizedNotes = notes ? sanitizeNotesForAI(notes) : '';

    // Build the system prompt
    const systemPrompt = `You are an AI assistant for Elevate Hospice, helping craft compassionate and professional messages.

Core Values to embody:
- ${ELEVATE_VALUES.dignity}
- ${ELEVATE_VALUES.truth}
- ${ELEVATE_VALUES.presence}
- ${ELEVATE_VALUES.ownership}
- ${ELEVATE_VALUES.hope}

Context: Writing a message for ${context === 'family' ? 'family communication' : 'referral source outreach'}
Tone: ${template.tone}
Structure: ${template.structure}

IMPORTANT: Do not include any patient-specific health information, SSNs, dates of birth, or addresses in generated messages. Keep messages general and professional.

${context === 'family' ? 
  'Remember: Families are in emotional distress. Be deeply empathetic while remaining professional.' :
  'Remember: Referral sources value efficiency, outcomes, and professionalism. Show how we make their job easier.'
}`;

    // Build the user prompt — use sanitized notes only
    let userPrompt;
    
    if (situation === 'freeform') {
      userPrompt = `Request: ${sanitizedNotes}\n`;
      
      if (context === 'family' && contactName) {
        userPrompt += `Family member first name: ${contactName}\n`;
      } else if (context === 'referral' && organizationName) {
        userPrompt += `Organization: ${organizationName}\n`;
      }
      
      userPrompt += `\nGenerate an appropriate message based on the request above. Keep it professional, brief (2-3 paragraphs max), and specific. Do not include any PHI.`;
    } else {
      userPrompt = `Situation: ${situation}\n`;
      
      if (context === 'family' && contactName) {
        userPrompt += `Family member first name: ${contactName}\n`;
      } else if (context === 'referral' && organizationName) {
        userPrompt += `Organization: ${organizationName}\n`;
      }
      
      if (sanitizedNotes) {
        userPrompt += `Additional context: ${sanitizedNotes}\n`;
      }
      
      userPrompt += `\nGenerate a brief, appropriate message (2-3 paragraphs max). Be specific and actionable. Do not include any PHI.`;
    }

    // Use Lovable AI Gateway instead of OpenAI directly
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ message: 'AI service is not configured. Please contact your administrator.', success: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ message: 'AI service is temporarily rate limited. Please try again in a moment.', success: false }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ message: 'AI credits exhausted. Please add funds in Lovable settings.', success: false }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    
    if (!aiData.choices?.[0]?.message?.content) {
      throw new Error("Failed to generate message");
    }

    return new Response(
      JSON.stringify({ 
        message: aiData.choices[0].message.content.trim(),
        success: true 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in ai-assist function");
    
    const fallbackMessage = "I apologize, but I'm having trouble generating a message right now. Please try again in a moment, or feel free to write your own message.";
    
    return new Response(
      JSON.stringify({ 
        message: fallbackMessage,
        success: false 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
