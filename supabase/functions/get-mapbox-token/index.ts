
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Getting Mapbox token from environment...');
    const mapboxToken = Deno.env.get('MAPBOX_PUBLIC_TOKEN')
    
    console.log('Token exists:', !!mapboxToken);
    console.log('Token length:', mapboxToken?.length || 0);
    
    if (!mapboxToken) {
      console.error('MAPBOX_PUBLIC_TOKEN environment variable not found');
      return new Response(
        JSON.stringify({ 
          error: 'Mapbox token not configured',
          details: 'MAPBOX_PUBLIC_TOKEN environment variable is missing'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!mapboxToken.startsWith('pk.')) {
      console.error('Invalid Mapbox token format');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Mapbox token format',
          details: 'Token should start with pk.'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Returning token successfully');
    return new Response(
      JSON.stringify({ token: mapboxToken }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Server error',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
