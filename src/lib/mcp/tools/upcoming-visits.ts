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
  name: "upcoming_visits",
  title: "Upcoming visits",
  description: "List scheduled visits in the next N days (default 7), soonest first.",
  inputSchema: {
    days: z.number().int().min(1).max(60).optional(),
    assigned_to: z.string().optional().describe("Filter by assigned staff email or name."),
    limit: z.number().int().min(1).max(100).optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ days, assigned_to, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const now = new Date();
    const end = new Date(now.getTime() + (days ?? 7) * 86400_000);
    let q = clientFor(ctx)
      .from("visits")
      .select("*")
      .gte("visit_date", now.toISOString())
      .lte("visit_date", end.toISOString())
      .order("visit_date", { ascending: true })
      .limit(limit ?? 50);
    if (assigned_to) q = q.eq("assigned_to", assigned_to);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { visits: data ?? [] },
    };
  },
});
