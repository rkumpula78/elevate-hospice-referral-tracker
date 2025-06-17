
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

      // Handle AI queries
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
              content: `You are a helpful assistant for a hospice CRM system. Help users find information about referrals, patients, and organizations. When users ask natural language questions, provide helpful responses and suggest specific searches they can perform.

Available data includes:
- Referrals (with statuses: pending, contacted, scheduled, admitted, admitted_our_hospice)
- Patients (with various medical and contact information)
- Organizations (referral sources, with contact info and assigned marketers)

When users ask about counts or statistics, explain that you can provide general guidance but they should use the search function or reports for exact numbers. Respond conversationally and suggest actionable next steps.`
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
        response: aiResponse 
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
