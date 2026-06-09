import type { User } from "@supabase/supabase-js";

/**
 * Email allow-list for the Ask Elevate AI assistant.
 * Keep this list small while the feature is being tuned.
 */
const ASK_ELEVATE_AI_ALLOWLIST = new Set<string>([
  "rkumpula@elevatehospiceaz.com",
]);

export function canUseAskElevateAI(user: { email?: string | null } | null | undefined): boolean {
  const email = user?.email?.toLowerCase().trim();
  if (!email) return false;
  return ASK_ELEVATE_AI_ALLOWLIST.has(email);
}

// Convenience for callers that already have a Supabase User
export function userCanUseAskElevateAI(user: User | null | undefined): boolean {
  return canUseAskElevateAI(user ?? null);
}
