
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import PasswordUpdateForm from '@/components/auth/PasswordUpdateForm';
import { useAuth } from '@/hooks/useAuth';

function parseAuthHash() {
  const raw = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const params = new URLSearchParams(raw);

  const type = params.get('type') || '';
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const error = params.get('error');
  const errorDescription = params.get('error_description');

  return { type, accessToken, refreshToken, error, errorDescription };
}

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();

  const authHash = useMemo(() => parseAuthHash(), []);
  const isRecoveryFlow = authHash.type === 'recovery' || authHash.type === 'invite';
  const isMagicLinkFlow = authHash.type === 'magiclink';
  const hasAuthTokens = !!authHash.accessToken || !!authHash.refreshToken;

  useEffect(() => {
    // If Supabase redirected back with tokens, give the client a moment to hydrate the session.
    // (Prevents confusing "check your email"/"verify" loops.)
    if (hasAuthTokens && !session && !loading) {
      const t = window.setTimeout(() => {
        // useAuth listens to auth changes; just re-check route a moment later
        // and keep the UI in the "Completing sign-in" state.
      }, 250);
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

  const showCompleting = (isMagicLinkFlow || hasAuthTokens) && !user;

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

          {authHash.error ? (
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
