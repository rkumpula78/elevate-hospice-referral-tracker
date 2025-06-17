
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, searchType } = await req.json();
    console.log('Search request:', { query, searchType });
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
        const actionMessages = {
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

      // Gather relevant data based on the query for informational requests
      let contextData = '';
      let navigationAction = null;

      // Check if query is about referrals
      if (query.toLowerCase().includes('referral')) {
        const { data: referrals, error } = await supabase
          .from('referrals')
          .select('id, patient_name, status, referral_date, organizations(name)');
        
        if (!error && referrals) {
          const totalReferrals = referrals.length;
          const statusCounts = referrals.reduce((acc, ref) => {
            acc[ref.status] = (acc[ref.status] || 0) + 1;
            return acc;
          }, {});
          
          contextData = `Current referral data: Total referrals: ${totalReferrals}. Status breakdown: ${JSON.stringify(statusCounts)}. Recent referrals include: ${referrals.slice(0, 5).map(r => `${r.patient_name} (${r.status})`).join(', ')}.`;
          navigationAction = { type: 'navigate', path: '/referrals', label: 'View All Referrals' };
        }
      }

      // Check if query is about patients
      if (query.toLowerCase().includes('patient')) {
        const { data: patients, error } = await supabase
          .from('patients')
          .select('id, first_name, last_name, status, diagnosis');
        
        if (!error && patients) {
          const totalPatients = patients.length;
          const statusCounts = patients.reduce((acc, patient) => {
            acc[patient.status] = (acc[patient.status] || 0) + 1;
            return acc;
          }, {});
          
          contextData += ` Current patient data: Total patients: ${totalPatients}. Status breakdown: ${JSON.stringify(statusCounts)}.`;
          if (!navigationAction) {
            navigationAction = { type: 'navigate', path: '/patients', label: 'View All Patients' };
          }
        }
      }

      // Check if query is about organizations
      if (query.toLowerCase().includes('organization') || query.toLowerCase().includes('facility')) {
        const { data: organizations, error } = await supabase
          .from('organizations')
          .select('id, name, type, assigned_marketer')
          .eq('is_active', true);
        
        if (!error && organizations) {
          const totalOrgs = organizations.length;
          const typeBreakdown = organizations.reduce((acc, org) => {
            acc[org.type] = (acc[org.type] || 0) + 1;
            return acc;
          }, {});
          
          contextData += ` Current organization data: Total active organizations: ${totalOrgs}. Type breakdown: ${JSON.stringify(typeBreakdown)}.`;
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

${contextData}

When answering questions:
1. Use the specific numbers and data provided in the context
2. Be direct and factual
3. Provide actionable insights when relevant
4. If suggesting navigation, mention that the user can click the suggested action

Available navigation paths:
- /referrals - for referral-related queries
- /patients - for patient-related queries  
- /organizations - for organization/facility queries
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
      // Handle regular search
      const searchResults = await Promise.all([
        // Search referrals
        supabase
          .from('referrals')
          .select(`
            id,
            patient_name,
            status,
            referral_date,
            organizations(name)
          `)
          .or(`patient_name.ilike.%${query}%,notes.ilike.%${query}%`)
          .limit(5),
        
        // Search patients
        supabase
          .from('patients')
          .select('id, first_name, last_name, status, diagnosis')
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,diagnosis.ilike.%${query}%`)
          .limit(5),
        
        // Search organizations
        supabase
          .from('organizations')
          .select('id, name, type, contact_person, assigned_marketer')
          .or(`name.ilike.%${query}%,contact_person.ilike.%${query}%,assigned_marketer.ilike.%${query}%`)
          .limit(5)
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
