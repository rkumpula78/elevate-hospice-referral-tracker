import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function clientFor(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_referrals",
  title: "List referrals",
  description:
    "List hospice referrals visible to the signed-in user, most recent first. Optionally filter by status, priority, or assigned marketer.",
  inputSchema: {
    status: z
      .string()
      .optional()
      .describe("Referral status (e.g. new_referral, contacted, assessment_scheduled, admitted, discharged)."),
    priority: z.enum(["routine", "urgent", "stat"]).optional(),
    assigned_marketer: z.string().optional().describe("Email or name of the assigned marketer."),
    limit: z.number().int().min(1).max(100).optional().describe("Max rows to return (default 25)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ status, priority, assigned_marketer, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = clientFor(ctx)
      .from("referrals")
      .select(
        "id, patient_name, status, priority, diagnosis, referral_source, organization_id, assigned_marketer, created_at, contact_date"
      )
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (status) q = q.eq("status", status);
    if (priority) q = q.eq("priority", priority);
    if (assigned_marketer) q = q.eq("assigned_marketer", assigned_marketer);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { referrals: data ?? [] },
    };
  },
});
