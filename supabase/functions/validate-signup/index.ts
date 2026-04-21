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
  password?: string;
  first_name?: string;
  last_name?: string;
  mode?: Mode;
}

const allowedDomain = "@elevatehospiceaz.com";

// Generate a strong random password (16 chars, mixed)
function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
  let pw = pick(upper) + pick(lower) + pick(digits) + pick(symbols);
  for (let i = 0; i < 12; i++) pw += pick(all);
  return pw.split("").sort(() => Math.random() - 0.5).join("");
}

// Always return 200 with structured body so the client can read errors.
function respond(status: number, payload: Record<string, unknown>): Response {
  // Use 200 for client-readable errors; only 5xx for true server failures.
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

const handler = async (req: Request): Promise<Response> => {
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

    if (!email) {
      return respond(200, { error: { message: "Email is required." } });
    }

    if (mode === "self" && !password) {
      return respond(200, { error: { message: "Password is required for self sign-up." } });
    }

    if (!email.toLowerCase().endsWith(allowedDomain)) {
      return respond(200, {
        error: { message: `Only ${allowedDomain} email addresses are allowed to register.` },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !anonKey) {
      return respond(500, { error: { message: "Server configuration error." } });
    }

    const emailRedirectTo = `https://elevate-hospice-referral-tracker.lovable.app/auth`;

    if (mode === "admin-invite") {
      if (!serviceRoleKey) {
        return respond(500, { error: { message: "Server configuration error." } });
      }

      // Verify caller is an admin
      const authHeader = req.headers.get("authorization") ?? "";
      const callerClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userErr } = await callerClient.auth.getUser();
      if (userErr || !userData?.user) {
        return respond(200, { error: { message: "Unauthorized. Please sign in again." } });
      }

      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const { data: rolesData, error: rolesErr } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);

      if (rolesErr) {
        console.error("Role check error:", rolesErr);
        return respond(200, { error: { message: "Unable to verify permissions." } });
      }

      const isAdmin = (rolesData ?? []).some((r) => r.role === "admin");
      if (!isAdmin) {
        return respond(200, { error: { message: "Forbidden. Admin role required." } });
      }

      // ALWAYS use createUser (no email rate limits, no invite email needed).
      // If admin didn't supply a password, generate a temporary one and return it
      // so the admin can share it. The user can change it on first login.
      const wasPasswordProvided = !!(password && password.trim().length > 0);
      const finalPassword = wasPasswordProvided ? password! : generateTempPassword();

      const { data: createData, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true,
        user_metadata: { first_name, last_name },
      });

      if (createErr) {
        const errCode = (createErr as any)?.code;
        const errMsg = (createErr as any)?.message || "Failed to create user.";
        console.error("Admin createUser error:", { code: errCode, message: errMsg });

        // If the user already exists, try sending a password reset (no rate limit on reset for existing user)
        if (errCode === "email_exists" || /already.*registered|exists/i.test(errMsg)) {
          const resetClient = createClient(supabaseUrl, anonKey);
          const { error: resetErr } = await resetClient.auth.resetPasswordForEmail(email, {
            redirectTo: emailRedirectTo,
          });
          if (resetErr) {
            return respond(200, {
              error: {
                message: `User ${email} already exists. Could not send password reset: ${resetErr.message}`,
                code: "email_exists",
              },
            });
          }
          return respond(200, {
            message: `User ${email} already exists. A password reset email has been sent instead.`,
            existing_user: true,
          });
        }

        // Pass through the real auth error so the UI can show it
        return respond(200, {
          error: { message: errMsg, code: errCode || "create_user_failed" },
        });
      }

      return respond(200, {
        message: wasPasswordProvided
          ? "User created successfully. They can sign in immediately with the password you set."
          : `User created successfully. Temporary password: ${finalPassword} — share this securely. The user should change it on first login.`,
        user: createData.user,
        // Surface the temp password explicitly so the UI can copy/display it
        temp_password: wasPasswordProvided ? null : finalPassword,
      });
    }

    // Self sign-up
    const signupClient = createClient(supabaseUrl, anonKey);
    const { data, error } = await signupClient.auth.signUp({
      email,
      password: password!,
      options: {
        emailRedirectTo,
        data: { first_name, last_name },
      },
    });

    if (error) {
      console.error("Signup error:", error);
      return respond(200, {
        error: { message: error.message || "Sign up failed. Please try again." },
      });
    }

    return respond(200, {
      message: "Account created. Please check your email for the confirmation link to finish signing up.",
      user: data.user,
    });
  } catch (error: any) {
    console.error("Error in validate-signup function:", error);
    return respond(500, {
      error: { message: error?.message || "An internal error occurred." },
    });
  }
};

serve(handler);
