
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Preserve the current URL so post-login redirects land back on the
    // originally requested page (e.g. /.lovable/oauth/consent?...).
    const next = location.pathname + location.search + location.hash;
    const suffix = next && next !== '/' ? `?next=${encodeURIComponent(next)}` : '';
    return <Navigate to={`/auth${suffix}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
