
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import PasswordUpdateForm from '@/components/auth/PasswordUpdateForm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';

function parseAuthHash() {
  const raw = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const params = new URLSearchParams(raw);

  const type = params.get('type') || '';
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const error = params.get('error');
  const errorCode = params.get('error_code');
  const errorDescription = params.get('error_description');

  return { type, accessToken, refreshToken, error, errorCode, errorDescription };
}

const ExpiredLinkForm = ({ errorDescription }: { errorDescription: string }) => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Please enter your email', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: 'New link sent!',
        description: 'Check your inbox for a fresh password reset link.',
      });

      // Clear the error hash from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err: any) {
      toast({
        title: 'Failed to send link',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">Your link has expired</p>
        <p className="mt-1 text-amber-700">
          {errorDescription || 'The verification link is no longer valid.'}
        </p>
      </div>

      <form onSubmit={handleResend} className="space-y-4">
        <p className="text-gray-600 text-center">
          Enter your email below to receive a new link.
        </p>
        <div className="space-y-2">
          <Label htmlFor="resend-email">Email address</Label>
          <Input
            id="resend-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@elevatehospiceaz.com"
            required
            className="h-11"
          />
        </div>
        <Button type="submit" className="w-full" disabled={sending}>
          {sending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Send new link
        </Button>
      </form>

      <p className="text-xs text-muted-foreground text-center">
        Or contact an admin to resend your invitation.
      </p>
    </div>
  );
};

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();

  const authHash = useMemo(() => parseAuthHash(), []);
  const isRecoveryFlow = authHash.type === 'recovery' || authHash.type === 'invite';
  const isMagicLinkFlow = authHash.type === 'magiclink';
  const hasAuthTokens = !!authHash.accessToken || !!authHash.refreshToken;
  const isExpiredLink = authHash.errorCode === 'otp_expired' || authHash.error === 'access_denied';

  useEffect(() => {
    // If Supabase redirected back with tokens, give the client a moment to hydrate the session.
    if (hasAuthTokens && !session && !loading) {
      const t = window.setTimeout(() => {}, 250);
      return () => window.clearTimeout(t);
    }
  }, [hasAuthTokens, session, loading]);

  useEffect(() => {
    if (user && !loading) {
      // Clean up hash tokens from the URL once authenticated
      if (window.location.hash) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const showCompleting = (isMagicLinkFlow || hasAuthTokens) && !user && !isExpiredLink;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center shadow-lg">
              <img
                src="/lovable-uploads/0581d561-551f-491a-8b13-0be84633073f.png"
                alt="Elevate Hospice & Palliative Care"
                className="h-16 w-auto"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h1>
            <p className="text-gray-600 text-lg font-medium">Elevate Hospice & Palliative Care</p>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mt-4"></div>
          </div>

          {isExpiredLink ? (
            <ExpiredLinkForm errorDescription={authHash.errorDescription || ''} />
          ) : authHash.error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">Authentication error</p>
              <p className="mt-1 break-words">
                {authHash.errorDescription || authHash.error}
              </p>
            </div>
          ) : isRecoveryFlow ? (
            <PasswordUpdateForm />
          ) : showCompleting ? (
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-4 border-slate-300 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-900 font-semibold">Completing sign-in…</p>
              <p className="text-gray-600 text-sm">
                If nothing happens in 10 seconds, refresh this page once.
              </p>
            </div>
          ) : (
            <LoginForm onToggleMode={toggleMode} isSignUp={isSignUp} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
