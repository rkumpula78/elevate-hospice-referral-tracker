import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication - require JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized - No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with user's token to respect RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized - Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user:', user.id);

    const { query, searchType } = await req.json();
    console.log('Search request:', { query, searchType, userId: user.id });

    if (searchType === 'ai') {
      // Check if OpenAI API key is available
      if (!openAIApiKey) {
        console.error('OpenAI API key not found');
        return new Response(JSON.stringify({ 
          type: 'ai_response',
          response: 'AI search is currently unavailable. Please contact your administrator to configure the OpenAI API key.' 
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

      // If it's a creation request, provide immediate action
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

      // Gather comprehensive data based on the query for informational requests
      let contextData = '';
      let navigationAction = null;

      // Enhanced search for referrals - search ALL text fields (respects RLS)
      if (query.toLowerCase().includes('referral') || query.toLowerCase().includes('dnr') || query.toLowerCase().includes('patient')) {
        const { data: referrals, error } = await supabase
          .from('referrals')
          .select(`
            id, patient_name, status, referral_date, diagnosis, notes, insurance,
            patient_phone, assigned_marketer, priority, first_name, last_name,
            date_of_birth, address, phone, emergency_contact, emergency_phone,
            physician, primary_insurance, next_steps, patient_status,
            organizations(name)
          `);
        
        if (!error && referrals) {
          // Filter referrals that match the search term in ANY field
          const matchingReferrals = referrals.filter(ref => {
            const searchableText = [
              ref.patient_name, ref.diagnosis, ref.notes, ref.insurance,
              ref.first_name, ref.last_name, ref.address, ref.physician,
              ref.primary_insurance, ref.next_steps, ref.emergency_contact
            ].join(' ').toLowerCase();
            
            return searchableText.includes(query.toLowerCase());
          });

          const totalReferrals = referrals.length;
          const matchingCount = matchingReferrals.length;
          const statusCounts = referrals.reduce((acc: Record<string, number>, ref) => {
            acc[ref.status] = (acc[ref.status] || 0) + 1;
            return acc;
          }, {});
          
          if (matchingCount > 0) {
            contextData = `Found ${matchingCount} referral(s) matching "${query}": ${matchingReferrals.map(r => `${r.patient_name || `${r.first_name} ${r.last_name}`} (${r.status})`).join(', ')}. Total referrals in system: ${totalReferrals}. Status breakdown: ${JSON.stringify(statusCounts)}.`;
          } else {
            contextData = `No referrals found matching "${query}". Total referrals: ${totalReferrals}. Status breakdown: ${JSON.stringify(statusCounts)}.`;
          }
          navigationAction = { type: 'navigate', path: '/referrals', label: 'View All Referrals' };
        }
      }

      // Enhanced search for patients - search ALL text fields (respects RLS)
      if (query.toLowerCase().includes('patient') || query.toLowerCase().includes('dnr')) {
        const { data: patients, error } = await supabase
          .from('patients')
          .select(`
            id, first_name, last_name, status, diagnosis, notes, address, phone,
            emergency_contact, emergency_phone, physician, primary_insurance,
            next_steps, msw_notes, upcoming_appointments, advanced_directive,
            dnr_status, prior_hospice_info, caregiver_name, spiritual_preferences,
            dme_needs, special_medical_needs, attending_physician, funeral_arrangements
          `);
        
        if (!error && patients) {
          // Filter patients that match the search term in ANY field
          const matchingPatients = patients.filter(patient => {
            const searchableText = [
              patient.first_name, patient.last_name, patient.diagnosis, patient.notes,
              patient.address, patient.physician, patient.primary_insurance,
              patient.next_steps, patient.msw_notes, patient.upcoming_appointments,
              patient.prior_hospice_info, patient.caregiver_name, patient.spiritual_preferences,
              patient.dme_needs, patient.special_medical_needs, patient.attending_physician,
              patient.funeral_arrangements, patient.emergency_contact
            ].join(' ').toLowerCase();
            
            // Special handling for DNR - check both text fields and boolean status
            const isDnrQuery = query.toLowerCase().includes('dnr');
            const hasDnrInText = searchableText.includes('dnr');
            const hasDnrStatus = patient.dnr_status === true;
            
            if (isDnrQuery) {
              return hasDnrInText || hasDnrStatus;
            }
            
            return searchableText.includes(query.toLowerCase());
          });

          const totalPatients = patients.length;
          const matchingCount = matchingPatients.length;
          const statusCounts = patients.reduce((acc: Record<string, number>, patient) => {
            acc[patient.status] = (acc[patient.status] || 0) + 1;
            return acc;
          }, {});
          
          if (matchingCount > 0) {
            contextData += ` Found ${matchingCount} patient(s) matching "${query}": ${matchingPatients.map(p => `${p.first_name} ${p.last_name} (${p.status})`).join(', ')}. Total patients: ${totalPatients}. Status breakdown: ${JSON.stringify(statusCounts)}.`;
            
            // Special DNR information
            if (query.toLowerCase().includes('dnr')) {
              const dnrPatients = matchingPatients.filter(p => p.dnr_status || 
                [p.notes, p.msw_notes, p.next_steps, p.special_medical_needs].some(field => 
                  field && field.toLowerCase().includes('dnr')
                )
              );
              if (dnrPatients.length > 0) {
                contextData += ` DNR-related patients: ${dnrPatients.map(p => `${p.first_name} ${p.last_name}`).join(', ')}.`;
              }
            }
          } else {
            contextData += ` No patients found matching "${query}". Total patients: ${totalPatients}.`;
          }
          
          if (!navigationAction) {
            navigationAction = { type: 'navigate', path: '/patients', label: 'View All Patients' };
          }
        }
      }

      // Check if query is about organizations/referral sources (respects RLS)
      if (query.toLowerCase().includes('organization') || query.toLowerCase().includes('facility') || query.toLowerCase().includes('referral source')) {
        const { data: organizations, error } = await supabase
          .from('organizations')
          .select('id, name, type, assigned_marketer, contact_person, contact_email, address, phone')
          .eq('is_active', true);
        
        if (!error && organizations) {
          const totalOrgs = organizations.length;
          const typeBreakdown = organizations.reduce((acc: Record<string, number>, org) => {
            acc[org.type] = (acc[org.type] || 0) + 1;
            return acc;
          }, {});
          
          contextData += ` Current referral source data: Total active referral sources (organizations): ${totalOrgs}. Type breakdown: ${JSON.stringify(typeBreakdown)}. Examples include: ${organizations.slice(0, 5).map(o => `${o.name} (${o.type})`).join(', ')}.`;
          if (!navigationAction) {
            navigationAction = { type: 'navigate', path: '/organizations', label: 'View All Organizations' };
          }
        }
      }

      // Handle AI queries with real data
      console.log('Making OpenAI API request...');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: `You are a helpful assistant for a hospice CRM system. You have access to real-time data from the system. Use the provided context data to answer questions with specific numbers and facts.

IMPORTANT: Organizations in this system are the referral sources. When users ask about "referral sources" they are referring to organizations. Make sure to use organization data when answering questions about referral sources.

MEDICAL TERMINOLOGY UNDERSTANDING:
- DNR = Do Not Resuscitate - a medical order indicating no CPR should be performed
- DNR information can be found in patient notes, medical records, or as a specific DNR status flag
- When users ask about DNR, they want to know which patients have DNR orders or DNR-related information
- Other common medical abbreviations: POA (Power of Attorney), AD (Advance Directives), etc.

SEARCH CONTEXT DATA:
${contextData}

When answering questions:
1. Use the specific numbers and data provided in the context
2. Be direct and factual - don't make up information not in the context
3. If no matches are found, clearly state this and suggest alternative searches
4. For medical queries like DNR, be specific about what was found and where
5. Provide actionable insights when relevant
6. If suggesting navigation, mention that the user can click the suggested action
7. Remember that organizations ARE referral sources - use this terminology appropriately
8. If the search didn't find what the user was looking for, suggest they try different search terms or check specific patient records manually

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

      console.log('OpenAI API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        return new Response(JSON.stringify({ 
          type: 'ai_response',
          response: 'I apologize, but I\'m experiencing technical difficulties. Please try your search again or contact support if the issue persists.' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      console.log('OpenAI API response:', data);
      
      // Check if the response has the expected structure
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Unexpected OpenAI API response structure:', data);
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
      // Handle regular search with enhanced field coverage (respects RLS)
      const searchResults = await Promise.all([
        // Enhanced search referrals - search ALL text fields
        supabase
          .from('referrals')
          .select(`
            id, patient_name, status, referral_date, diagnosis, notes, insurance,
            first_name, last_name, date_of_birth, address, phone, emergency_contact,
            physician, primary_insurance, next_steps, assigned_marketer,
            organizations(name)
          `)
          .or(`patient_name.ilike.%${query}%,notes.ilike.%${query}%,diagnosis.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,address.ilike.%${query}%,physician.ilike.%${query}%,primary_insurance.ilike.%${query}%,next_steps.ilike.%${query}%,emergency_contact.ilike.%${query}%`)
          .limit(10),
        
        // Enhanced search patients - search ALL text fields
        supabase
          .from('patients')
          .select(`
            id, first_name, last_name, status, diagnosis, notes, address, phone,
            physician, primary_insurance, next_steps, msw_notes, dnr_status,
            emergency_contact, special_medical_needs, dme_needs
          `)
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,diagnosis.ilike.%${query}%,notes.ilike.%${query}%,address.ilike.%${query}%,physician.ilike.%${query}%,primary_insurance.ilike.%${query}%,next_steps.ilike.%${query}%,msw_notes.ilike.%${query}%,emergency_contact.ilike.%${query}%,special_medical_needs.ilike.%${query}%,dme_needs.ilike.%${query}%`)
          .limit(10),
        
        // Search organizations
        supabase
          .from('organizations')
          .select('id, name, type, contact_person, assigned_marketer, contact_email, address, phone')
          .or(`name.ilike.%${query}%,contact_person.ilike.%${query}%,assigned_marketer.ilike.%${query}%,address.ilike.%${query}%`)
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
    console.error('Error in ai-search function:', error);
    return new Response(JSON.stringify({ 
      type: 'ai_response',
      response: 'I encountered an unexpected error. Please try your search again.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
