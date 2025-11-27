import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';

export const useRole = () => {
  const { roles, isAdmin, loading } = useAuth();

  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  const requireRole = (role: string, redirectTo: string = '/') => {
    const navigate = useNavigate();

    useEffect(() => {
      if (!loading && !hasRole(role)) {
        toast.error('You do not have permission to access this page');
        navigate(redirectTo);
      }
    }, [loading, role, redirectTo, navigate]);
  };

  const requireAdmin = (redirectTo: string = '/') => {
    const navigate = useNavigate();

    useEffect(() => {
      if (!loading && !isAdmin) {
        toast.error('Admin access required');
        navigate(redirectTo);
      }
    }, [loading, isAdmin, redirectTo, navigate]);
  };

  return {
    roles,
    isAdmin,
    hasRole,
    requireRole,
    requireAdmin,
    loading
  };
};
