
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sanitizeSearchQuery(input: string): string {
  return input.replace(/[%_\\]/g, '').trim();
}

/**
 * De-identify PHI: strip names, addresses, phones, DOB, and other identifiers.
 * Only pass status, diagnosis category, and aggregate counts to the AI model.
 */
function deidentifyReferral(r: any, index: number) {
  return {
    ref: `Referral-${index + 1}`,
    status: r.status,
    diagnosis: r.diagnosis || 'Unknown',
    insurance_type: r.primary_insurance || r.insurance || 'Unknown',
    priority: r.priority || 'routine',
    org: r.organizations?.name || 'Unknown source',
  };
}

function deidentifyPatient(p: any, index: number) {
  return {
    ref: `Patient-${index + 1}`,
    status: p.status,
    diagnosis: p.diagnosis || 'Unknown',
    insurance_type: p.primary_insurance || 'Unknown',
    dnr_status: p.dnr_status ? 'Yes' : 'No',
    has_advanced_directive: p.advanced_directive ? 'Yes' : 'No',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === AUTHENTICATION ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === INPUT VALIDATION ===
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query: rawQuery, searchType } = body;

    if (!rawQuery || typeof rawQuery !== 'string') {
      return new Response(JSON.stringify({ error: 'query is required and must be a string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (rawQuery.length > 500) {
      return new Response(JSON.stringify({ error: 'query must be 500 characters or less' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (searchType && !['ai', 'regular'].includes(searchType)) {
      return new Response(JSON.stringify({ error: 'searchType must be "ai" or "regular"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const query = rawQuery.trim();
    const sanitizedQuery = sanitizeSearchQuery(query);
    const supabase = userClient;

    if (searchType === 'ai') {
      const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
      if (!lovableApiKey) {
        return new Response(JSON.stringify({ 
          type: 'ai_response',
          response: 'AI search is currently unavailable. Please contact your administrator.' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check for creation/action requests
      const creationPatterns = [
        { pattern: /add.*referral|create.*referral|new.*referral/i, action: { type: 'create', item: 'referral', label: 'Add New Referral' } },
        { pattern: /schedule.*visit|create.*visit|new.*visit|add.*visit/i, action: { type: 'create', item: 'visit', label: 'Schedule Visit' } },
        { pattern: /add.*organization|create.*organization|new.*organization|add.*facility/i, action: { type: 'create', item: 'organization', label: 'Add Organization' } },
        { pattern: /quick.*add|add.*new/i, action: { type: 'create', item: 'quick', label: 'Quick Add' } }
      ];

      let suggestedAction = null;
      for (const pattern of creationPatterns) {
        if (pattern.pattern.test(query)) {
          suggestedAction = pattern.action;
          break;
        }
      }

      if (suggestedAction) {
        const actionMessages: Record<string, string> = {
          referral: "I can help you add a new referral! Click the button below to open the referral form.",
          visit: "I can help you schedule a new visit! Click the button below to open the visit scheduling form.",
          organization: "I can help you add a new organization! Click the button below to open the organization form.",
          quick: "I can help you quickly add new items! Click the button below to see your options."
        };

        return new Response(JSON.stringify({ 
          type: 'ai_response',
          response: actionMessages[suggestedAction.item],
          suggestedAction: suggestedAction
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Gather context data — DE-IDENTIFIED, no PHI sent to AI
      let contextData = '';
      let navigationAction = null;

      if (query.toLowerCase().includes('referral') || query.toLowerCase().includes('dnr') || query.toLowerCase().includes('patient')) {
        const { data: referrals, error } = await supabase
          .from('referrals')
          .select('id, patient_name, status, diagnosis, insurance, primary_insurance, priority, first_name, last_name, organizations(name)')
          .is('deleted_at', null);
        
        if (!error && referrals) {
          const matchingReferrals = referrals.filter(ref => {
            const searchableText = [ref.patient_name, ref.diagnosis, ref.first_name, ref.last_name].join(' ').toLowerCase();
            return searchableText.includes(query.toLowerCase());
          });

          const totalReferrals = referrals.length;
          const matchingCount = matchingReferrals.length;
          const statusCounts = referrals.reduce((acc: Record<string, number>, ref) => {
            acc[ref.status] = (acc[ref.status] || 0) + 1;
            return acc;
          }, {});
          
          // De-identify before building context
          const deidentified = matchingReferrals.slice(0, 10).map(deidentifyReferral);
          
          if (matchingCount > 0) {
            contextData = `Found ${matchingCount} matching referral(s). Total referrals: ${totalReferrals}. Status breakdown: ${JSON.stringify(statusCounts)}. Matching records (de-identified): ${JSON.stringify(deidentified)}.`;
          } else {
            contextData = `No referrals found matching the query. Total referrals: ${totalReferrals}. Status breakdown: ${JSON.stringify(statusCounts)}.`;
          }
          navigationAction = { type: 'navigate', path: '/referrals', label: 'View All Referrals' };
        }
      }

      if (query.toLowerCase().includes('patient') || query.toLowerCase().includes('dnr')) {
        const { data: patients, error } = await supabase
          .from('patients')
          .select('id, first_name, last_name, status, diagnosis, primary_insurance, dnr_status, advanced_directive');
        
        if (!error && patients) {
          const matchingPatients = patients.filter(patient => {
            const searchableText = [patient.first_name, patient.last_name, patient.diagnosis].join(' ').toLowerCase();
            const isDnrQuery = query.toLowerCase().includes('dnr');
            if (isDnrQuery) return patient.dnr_status === true || searchableText.includes('dnr');
            return searchableText.includes(query.toLowerCase());
          });

          const totalPatients = patients.length;
          const matchingCount = matchingPatients.length;
          const statusCounts = patients.reduce((acc: Record<string, number>, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
          }, {});
          
          // De-identify before building context
          const deidentified = matchingPatients.slice(0, 10).map(deidentifyPatient);
          
          if (matchingCount > 0) {
            contextData += ` Found ${matchingCount} matching patient(s). Total patients: ${totalPatients}. Status breakdown: ${JSON.stringify(statusCounts)}. Matching records (de-identified): ${JSON.stringify(deidentified)}.`;
            
            if (query.toLowerCase().includes('dnr')) {
              const dnrCount = matchingPatients.filter(p => p.dnr_status).length;
              contextData += ` ${dnrCount} patient(s) have DNR status.`;
            }
          } else {
            contextData += ` No patients found matching the query. Total patients: ${totalPatients}.`;
          }
          
          if (!navigationAction) {
            navigationAction = { type: 'navigate', path: '/patients', label: 'View All Patients' };
          }
        }
      }

      if (query.toLowerCase().includes('organization') || query.toLowerCase().includes('facility') || query.toLowerCase().includes('referral source')) {
        const { data: organizations, error } = await supabase
          .from('organizations')
          .select('id, name, type')
          .eq('is_active', true);
        
        if (!error && organizations) {
          const totalOrgs = organizations.length;
          const typeBreakdown = organizations.reduce((acc: Record<string, number>, org) => {
            acc[org.type] = (acc[org.type] || 0) + 1;
            return acc;
          }, {});
          
          // Only send org names and types — no contact info
          contextData += ` Active referral sources: ${totalOrgs}. Type breakdown: ${JSON.stringify(typeBreakdown)}. Examples: ${organizations.slice(0, 5).map(o => `${o.name} (${o.type})`).join(', ')}.`;
          if (!navigationAction) {
            navigationAction = { type: 'navigate', path: '/organizations', label: 'View All Organizations' };
          }
        }
      }

      // Call Lovable AI Gateway instead of OpenAI directly
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { 
              role: 'system', 
              content: `You are a helpful assistant for a hospice CRM system. You have access to de-identified, aggregate data from the system. Use the provided context to answer questions with specific numbers and facts.

IMPORTANT: All patient/referral data has been de-identified. You will see references like "Referral-1", "Patient-1" instead of real names. This is intentional for HIPAA compliance. Never ask for or attempt to reference real patient names.

Organizations in this system are the referral sources. When users ask about "referral sources" they are referring to organizations.

SEARCH CONTEXT DATA:
${contextData}

When answering questions:
1. Use the specific numbers and data provided in the context
2. Be direct and factual - don't make up information not in the context
3. If no matches are found, clearly state this and suggest alternative searches
4. Provide actionable insights when relevant
5. Remember that organizations ARE referral sources
6. Refer to records by their de-identified labels (Referral-1, Patient-1, etc.)

Available navigation paths:
- /referrals - for referral-related queries
- /patients - for patient-related queries  
- /organizations - for organization/facility/referral source queries
- /dashboard - for general overview
- /schedule - for scheduling and visits`
            },
            { role: 'user', content: query }
          ],
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) {
          return new Response(JSON.stringify({ 
            type: 'ai_response',
            response: 'AI search is temporarily rate limited. Please try again in a moment.' 
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ 
            type: 'ai_response',
            response: 'AI credits exhausted. Please add funds in Lovable settings.' 
          }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.error('AI gateway error:', status);
        return new Response(JSON.stringify({ 
          type: 'ai_response',
          response: 'I apologize, but I\'m experiencing technical difficulties. Please try your search again.' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        return new Response(JSON.stringify({ 
          type: 'ai_response',
          response: 'I encountered an issue processing your request. Please try rephrasing your question.' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const aiResponse = data.choices[0].message.content;

      return new Response(JSON.stringify({ 
        type: 'ai_response',
        response: aiResponse,
        suggestedAction: navigationAction
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Regular search with sanitized input — returns data directly, no AI involved
      const searchResults = await Promise.all([
        supabase
          .from('referrals')
          .select(`
            id, patient_name, status, referral_date, diagnosis, notes, insurance,
            first_name, last_name, date_of_birth, address, phone, emergency_contact,
            physician, primary_insurance, next_steps, assigned_marketer,
            organizations(name)
          `)
          .or(`patient_name.ilike.%${sanitizedQuery}%,notes.ilike.%${sanitizedQuery}%,diagnosis.ilike.%${sanitizedQuery}%,first_name.ilike.%${sanitizedQuery}%,last_name.ilike.%${sanitizedQuery}%,address.ilike.%${sanitizedQuery}%,physician.ilike.%${sanitizedQuery}%,primary_insurance.ilike.%${sanitizedQuery}%,next_steps.ilike.%${sanitizedQuery}%,emergency_contact.ilike.%${sanitizedQuery}%`)
          .limit(10),
        
        supabase
          .from('patients')
          .select(`
            id, first_name, last_name, status, diagnosis, notes, address, phone,
            physician, primary_insurance, next_steps, msw_notes, dnr_status,
            emergency_contact, special_medical_needs, dme_needs
          `)
          .or(`first_name.ilike.%${sanitizedQuery}%,last_name.ilike.%${sanitizedQuery}%,diagnosis.ilike.%${sanitizedQuery}%,notes.ilike.%${sanitizedQuery}%,address.ilike.%${sanitizedQuery}%,physician.ilike.%${sanitizedQuery}%,primary_insurance.ilike.%${sanitizedQuery}%,next_steps.ilike.%${sanitizedQuery}%,msw_notes.ilike.%${sanitizedQuery}%,emergency_contact.ilike.%${sanitizedQuery}%,special_medical_needs.ilike.%${sanitizedQuery}%,dme_needs.ilike.%${sanitizedQuery}%`)
          .limit(10),
        
        supabase
          .from('organizations')
          .select('id, name, type, contact_person, assigned_marketer, contact_email, address, phone')
          .or(`name.ilike.%${sanitizedQuery}%,contact_person.ilike.%${sanitizedQuery}%,assigned_marketer.ilike.%${sanitizedQuery}%,address.ilike.%${sanitizedQuery}%`)
          .limit(10)
      ]);

      const [referrals, patients, organizations] = searchResults;

      return new Response(JSON.stringify({
        type: 'search_results',
        results: {
          referrals: referrals.data || [],
          patients: patients.data || [],
          organizations: organizations.data || []
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in ai-search function');
    return new Response(JSON.stringify({ 
      type: 'ai_response',
      response: 'I encountered an unexpected error. Please try your search again.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
