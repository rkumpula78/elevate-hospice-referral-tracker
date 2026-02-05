import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Mode = "self" | "admin-invite";

interface SignupRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  mode?: Mode;
}

const allowedDomain = "@elevatehospiceaz.com";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      password,
      first_name,
      last_name,
      mode = "self",
    }: SignupRequest = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: { message: "Email and password are required." } }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Validate email domain
    if (!email.toLowerCase().endsWith(allowedDomain)) {
      return new Response(
        JSON.stringify({
          error: {
            message: `Only ${allowedDomain} email addresses are allowed to register.`,
          },
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !anonKey) {
      return new Response(
        JSON.stringify({
          error: { message: "Supabase configuration missing (URL/ANON_KEY)." },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Redirects
    const origin = req.headers.get("origin") || "https://elevate-hospice-referral-tracker.lovable.app";
    const emailRedirectTo = `${origin}/auth`;

    if (mode === "admin-invite") {
      if (!serviceRoleKey) {
        return new Response(
          JSON.stringify({
            error: { message: "Supabase service role key missing." },
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      // Verify caller is an admin (defense-in-depth)
      const authHeader = req.headers.get("authorization") ?? "";
      const callerClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userErr } = await callerClient.auth.getUser();
      if (userErr || !userData?.user) {
        return new Response(
          JSON.stringify({ error: { message: "Unauthorized." } }),
          {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const { data: rolesData, error: rolesErr } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);

      if (rolesErr) {
        console.error("Role check error:", rolesErr);
        return new Response(
          JSON.stringify({ error: { message: "Unable to verify permissions." } }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      const isAdmin = (rolesData ?? []).some((r) => r.role === "admin");
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: { message: "Forbidden." } }),
          {
            status: 403,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      // Invite email (single email)
      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: emailRedirectTo,
        data: {
          first_name,
          last_name,
        },
      });

      if (error) {
        // If the user already exists, fall back to password reset email instead of failing.
        // This avoids the "stuck" admin-invite flow when re-inviting an existing account.
        if ((error as any)?.code === "email_exists") {
          const resetClient = createClient(supabaseUrl, anonKey);
          const { error: resetErr } = await resetClient.auth.resetPasswordForEmail(email, {
            redirectTo: emailRedirectTo,
          });

          if (resetErr) {
            console.error("Password reset fallback error:", resetErr);
            return new Response(JSON.stringify({ error: resetErr }), {
              status: resetErr.status ?? 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }

          return new Response(
            JSON.stringify({
              message:
                "User already exists. Sent a password reset email instead of an invitation.",
              existing_user: true,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }

        console.error("Invite error:", error);
        return new Response(JSON.stringify({ error }), {
          status: error.status ?? 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      return new Response(
        JSON.stringify({
          message: "Invitation email sent. The user must accept the invite to finish setup.",
          user: data.user,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Self sign-up: let Supabase Auth send the confirmation email
    const signupClient = createClient(supabaseUrl, anonKey);
    const { data, error } = await signupClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          first_name,
          last_name,
        },
      },
    });

    if (error) {
      console.error("Signup error:", error);
      return new Response(JSON.stringify({ error }), {
        status: error.status ?? 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({
        message:
          "Account created. Please check your email for the confirmation link to finish signing up.",
        user: data.user,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    console.error("Error in validate-signup function:", error);
    return new Response(JSON.stringify({ error: { message: error.message } }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
