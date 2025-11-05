import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
const MESSAGE_TEMPLATES = {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { context, situation, notes, contactName, organizationName } = await req.json();

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
        throw new Error("Invalid situation or context");
      }
    }

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

${context === 'family' ? 
  'Remember: Families are in emotional distress. Be deeply empathetic while remaining professional.' :
  'Remember: Referral sources value efficiency, outcomes, and professionalism. Show how we make their job easier.'
}`;

    // Build the user prompt
    let userPrompt;
    
    if (situation === 'freeform') {
      userPrompt = `Request: ${notes}\n`;
      
      if (context === 'family' && contactName) {
        userPrompt += `Family member: ${contactName}\n`;
      } else if (context === 'referral' && organizationName) {
        userPrompt += `Organization: ${organizationName}\n`;
      }
      
      userPrompt += `\nGenerate an appropriate message based on the request above. Keep it professional, brief (2-3 paragraphs max), and specific.`;
    } else {
      userPrompt = `Situation: ${situation}\n`;
      
      if (context === 'family' && contactName) {
        userPrompt += `Family member: ${contactName}\n`;
      } else if (context === 'referral' && organizationName) {
        userPrompt += `Organization: ${organizationName}\n`;
      }
      
      if (notes) {
        userPrompt += `Additional context: ${notes}\n`;
      }
      
      userPrompt += `\nGenerate a brief, appropriate message (2-3 paragraphs max). Be specific and actionable.`;
    }

    // Call OpenAI (you'll need to add your API key to environment variables)
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const aiData = await openAIResponse.json();
    
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
    console.error("Error in ai-assist function:", error);
    
    // Fallback message if AI fails
    const fallbackMessage = "I apologize, but I'm having trouble generating a message right now. Please try again in a moment, or feel free to write your own message.";
    
    return new Response(
      JSON.stringify({ 
        message: fallbackMessage,
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Return 200 even on error so the UI can handle it gracefully
      }
    );
  }
}); 