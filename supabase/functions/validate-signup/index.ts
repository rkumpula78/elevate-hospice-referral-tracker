
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignupRequest {
  email: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password }: SignupRequest = await req.json();
    
    // Validate email domain
    const allowedDomain = '@elevatehospiceaz.com';
    if (!email.toLowerCase().endsWith(allowedDomain)) {
      return new Response(
        JSON.stringify({ 
          error: { 
            message: 'Only @elevatehospiceaz.com email addresses are allowed to register.' 
          } 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Use inviteUserByEmail which creates the user AND sends an invitation email
    const redirectUrl = `${req.headers.get('origin') || 'https://elevate-hospice-referral-tracker.lovable.app'}/auth`;
    
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
      data: {
        temp_password: password // Store temporarily so user can set it after accepting invite
      }
    });

    if (error) {
      console.error('Signup error:', error);
      return new Response(
        JSON.stringify({ error }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: 'Registration successful. Please check your email to verify your account.',
        user: data.user 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in validate-signup function:', error);
    return new Response(
      JSON.stringify({ error: { message: error.message } }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
