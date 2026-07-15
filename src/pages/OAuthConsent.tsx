import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Beta OAuth 2.1 client namespace — typed minimally here so the page compiles
// without waiting for @supabase/supabase-js to publish it.
type OAuthClient = {
  getAuthorizationDetails: (id: string) => Promise<{
    data: {
      client?: { name?: string; client_uri?: string };
      redirect_url?: string;
      redirect_to?: string;
      scopes?: string[];
    } | null;
    error: { message: string } | null;
  }>;
  approveAuthorization: (
    id: string
  ) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string
  ) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
};

function isSameOriginPath(next: string | null): next is string {
  return !!next && next.startsWith("/") && !next.startsWith("//");
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";

  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }

      const oauth = (supabase.auth as unknown as { oauth?: OAuthClient }).oauth;
      if (!oauth?.getAuthorizationDetails) {
        setError(
          "OAuth 2.1 is not enabled on this Supabase project. Ask an admin to enable it in the Supabase dashboard."
        );
        return;
      }

      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const oauth = (supabase.auth as unknown as { oauth?: OAuthClient }).oauth;
    if (!oauth) {
      setBusy(false);
      setError("OAuth API not available.");
      return;
    }
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="max-w-md w-full bg-white/95 rounded-2xl shadow-2xl p-8 space-y-3">
          <h1 className="text-xl font-bold text-gray-900">Could not load this authorization request</h1>
          <p className="text-sm text-gray-700">{error}</p>
        </div>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      </main>
    );
  }

  const clientName = details.client?.name ?? "an external client";

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="max-w-md w-full bg-white/95 rounded-2xl shadow-2xl p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connect {clientName}?</h1>
          <p className="mt-2 text-sm text-gray-700">
            This will let <strong>{clientName}</strong> use the Elevate Hospice Referral Dashboard as{" "}
            <strong>you</strong>. It will only see data your account can already see, and every read is subject to the
            same HIPAA safeguards.
          </p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Only approve if you initiated this connection from a client you trust (e.g. ChatGPT, Claude, Cursor). Deny if
          you didn't.
        </div>
        <div className="flex gap-3">
          <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
          </Button>
          <Button className="flex-1" variant="outline" disabled={busy} onClick={() => decide(false)}>
            Deny
          </Button>
        </div>
      </div>
    </main>
  );
}

export { isSameOriginPath };
