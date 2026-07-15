import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listReferrals from "./tools/list-referrals";
import getReferral from "./tools/get-referral";
import listOrganizations from "./tools/list-organizations";
import upcomingVisits from "./tools/upcoming-visits";
import dashboardStats from "./tools/dashboard-stats";

// Direct Supabase host derived from the project ref — required by mcp-js OAuth
// verification (RFC 8414 §3.3). VITE_SUPABASE_PROJECT_ID is inlined by Vite at
// build time, so this stays import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "elevate-hospice-mcp",
  title: "Elevate Hospice Referral Dashboard",
  version: "0.1.0",
  instructions:
    "Read tools over the Elevate Hospice referral CRM. Each caller acts as their own signed-in user; Row Level Security applies. Use `list_referrals` and `get_referral` to look up hospice referrals, `list_organizations` for partner facilities, `upcoming_visits` for the schedule, and `dashboard_stats` for KPIs.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listReferrals, getReferral, listOrganizations, upcomingVisits, dashboardStats],
});
