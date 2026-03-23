import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AdminRequest {
  action: "list" | "delete" | "resend-invite" | "set-password" | "update-user";
  userId?: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: { message: "Server configuration error" } }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    // Verify caller is admin
    const authHeader = req.headers.get("authorization") ?? "";
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: { message: "Unauthorized" } }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role
    const { data: rolesData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);

    const isAdmin = (rolesData ?? []).some((r) => r.role === "admin");
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: { message: "Forbidden - Admin access required" } }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let requestBody: any;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: { message: "Invalid JSON body" } }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { action, userId, email, password, first_name, last_name }: AdminRequest = requestBody;

    // Validate action
    const validActions = ["list", "delete", "resend-invite", "set-password", "update-user"];
    if (!action || !validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: { message: "Invalid action" } }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate UUID format for userId when required
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (userId && !UUID_REGEX.test(userId)) {
      return new Response(
        JSON.stringify({ error: { message: "Invalid userId format" } }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format when provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: { message: "Invalid email format" } }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate string lengths
    if (first_name && first_name.length > 100) {
      return new Response(
        JSON.stringify({ error: { message: "First name too long (max 100 chars)" } }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    if (last_name && last_name.length > 100) {
      return new Response(
        JSON.stringify({ error: { message: "Last name too long (max 100 chars)" } }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // LIST: Get all auth users with status
    if (action === "list") {
      const { data: authUsers, error: listError } = await adminClient.auth.admin.listUsers();

      if (listError) {
        console.error("List users error:", listError);
        return new Response(
          JSON.stringify({ error: { message: "Failed to list users" } }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Map to simpler format with status
      const users = authUsers.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        email_confirmed_at: u.email_confirmed_at,
        last_sign_in_at: u.last_sign_in_at,
        status: !u.email_confirmed_at
          ? "pending"
          : u.banned_until
          ? "disabled"
          : "active",
        first_name: u.user_metadata?.first_name || "",
        last_name: u.user_metadata?.last_name || "",
      }));

      return new Response(
        JSON.stringify({ users }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // DELETE: Remove user from auth.users
    if (action === "delete") {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: { message: "userId is required" } }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Prevent self-deletion
      if (userId === userData.user.id) {
        return new Response(
          JSON.stringify({ error: { message: "Cannot delete your own account" } }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Delete related user_roles first (FK constraint blocks deletion)
      // Note: admin_audit_log has ON DELETE SET NULL so it's handled by the DB
      const { error: rolesDeleteError } = await adminClient
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (rolesDeleteError) {
        console.error("Error deleting user roles:", rolesDeleteError);
        // Continue anyway - the role might not exist
      }

      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.error("Delete user error:", deleteError);
        return new Response(
          JSON.stringify({ error: { message: "Failed to delete user" } }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Log the action (with new user id since old one is deleted)
      await adminClient.from("admin_audit_log").insert({
        admin_user_id: userData.user.id,
        action: "delete_user",
        target_user_id: null,
        details: { deleted_user_id: userId },
      });

      return new Response(
        JSON.stringify({ message: "User deleted successfully" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // RESEND-INVITE: Send a new invite/password reset email
    if (action === "resend-invite") {
      if (!email) {
        return new Response(
          JSON.stringify({ error: { message: "email is required" } }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const redirectTo = "https://elevate-hospice-referral-tracker.lovable.app/auth";

      // Try to invite first; if user exists, send password reset
      const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo,
      });

      if (inviteError) {
        // User likely exists, send password reset instead
        const resetClient = createClient(supabaseUrl, anonKey);
        const { error: resetErr } = await resetClient.auth.resetPasswordForEmail(email, {
          redirectTo,
        });

        if (resetErr) {
          console.error("Resend error:", resetErr);
          return new Response(
            JSON.stringify({ error: { message: "Failed to resend invitation" } }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        return new Response(
          JSON.stringify({ message: "Password reset email sent (user already exists)" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ message: "Invitation email sent" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // SET-PASSWORD: Admin directly sets a user's password
    if (action === "set-password") {
      if (!userId || !password) {
        return new Response(
          JSON.stringify({ error: { message: "userId and password are required" } }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (password.length < 8) {
        return new Response(
          JSON.stringify({ error: { message: "Password must be at least 8 characters" } }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
        password,
      });

      if (updateError) {
        console.error("Set password error:", updateError);
        const isWeakPassword = (updateError as any).code === "weak_password" || 
          (updateError as any).__isAuthError && (updateError as any).name === "AuthWeakPasswordError";
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: {
              code: isWeakPassword ? "weak_password" : "update_failed",
              message: isWeakPassword ? "Password does not meet strength requirements" : "Failed to set password",
            }
          }),
          { status: isWeakPassword ? 200 : 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Log the action
      await adminClient.from("admin_audit_log").insert({
        admin_user_id: userData.user.id,
        action: "set_password",
        target_user_id: userId,
        details: { note: "Password reset by admin" },
      });

      return new Response(
        JSON.stringify({ message: "Password updated successfully" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // UPDATE-USER: Update user metadata (name, email)
    if (action === "update-user") {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: { message: "userId is required" } }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const updatePayload: any = {};
      if (first_name !== undefined || last_name !== undefined) {
        updatePayload.user_metadata = {};
        if (first_name !== undefined) updatePayload.user_metadata.first_name = first_name;
        if (last_name !== undefined) updatePayload.user_metadata.last_name = last_name;
      }
      if (email) {
        updatePayload.email = email;
      }

      const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, updatePayload);

      if (updateError) {
        console.error("Update user error:", updateError);
        return new Response(
          JSON.stringify({ error: { message: "Failed to update user" } }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Also update profiles table
      const profileUpdate: any = {};
      if (first_name !== undefined) profileUpdate.first_name = first_name;
      if (last_name !== undefined) profileUpdate.last_name = last_name;
      if (email) profileUpdate.email = email;

      if (Object.keys(profileUpdate).length > 0) {
        await adminClient.from("profiles").update(profileUpdate).eq("id", userId);
      }

      // Log the action
      await adminClient.from("admin_audit_log").insert({
        admin_user_id: userData.user.id,
        action: "update_user",
        target_user_id: userId,
        details: { first_name, last_name, email },
      });

      return new Response(
        JSON.stringify({ message: "User updated successfully" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: { message: "Invalid action" } }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Admin users error");
    return new Response(
      JSON.stringify({ error: { message: "An internal error occurred" } }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
