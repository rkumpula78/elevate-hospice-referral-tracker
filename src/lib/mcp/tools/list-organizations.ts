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
  name: "list_organizations",
  title: "List partner organizations",
  description:
    "List referring/partner organizations (facilities, physician groups, SNFs). Optional text search on name and city.",
  inputSchema: {
    search: z.string().optional().describe("Case-insensitive substring match against name or city."),
    account_rating: z.enum(["A", "B", "C", "D"]).optional(),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ search, account_rating, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = clientFor(ctx)
      .from("organizations")
      .select(
        "id, name, organization_type, account_rating, partnership_stage, city, state, last_contact_date, next_followup_date, is_active"
      )
      .eq("is_active", true)
      .order("last_contact_date", { ascending: false, nullsFirst: false })
      .limit(limit ?? 50);
    if (account_rating) q = q.eq("account_rating", account_rating);
    if (search) q = q.or(`name.ilike.%${search}%,city.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { organizations: data ?? [] },
    };
  },
});
