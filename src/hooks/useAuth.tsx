import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { clearQueue } from '@/lib/offlineQueue';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  displayName: string;
  roles: string[];
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const getDisplayName = (user: User | null) => {
    if (!user) return '';
    return user.user_metadata?.display_name || 
           user.user_metadata?.full_name || 
           user.email?.split('@')[0] || 
           'User';
  };

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching roles:', error);
        return [];
      }
      
      return data?.map(r => r.role) || [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  };

  const refreshRoles = async () => {
    if (!user?.id) {
      setRoles([]);
      setIsAdmin(false);
      return;
    }

    const userRoles = await fetchUserRoles(user.id);
    setRoles(userRoles);
    setIsAdmin(userRoles.includes('admin'));
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Fetch roles after auth state changes
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user.id).then(userRoles => {
              setRoles(userRoles);
              setIsAdmin(userRoles.includes('admin'));
            });
          }, 0);
        } else {
          setRoles([]);
          setIsAdmin(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        fetchUserRoles(session.user.id).then(userRoles => {
          setRoles(userRoles);
          setIsAdmin(userRoles.includes('admin'));
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Validate email domain before attempting login
    const allowedDomain = '@elevatehospiceaz.com';
    if (!email.toLowerCase().endsWith(allowedDomain)) {
      return { 
        error: { 
          message: 'Only @elevatehospiceaz.com email addresses are allowed to sign in.' 
        } 
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    // Validate email domain before calling edge function
    const allowedDomain = '@elevatehospiceaz.com';
    if (!email.toLowerCase().endsWith(allowedDomain)) {
      return { 
        error: { 
          message: 'Only Elevate Hospice email addresses (@elevatehospiceaz.com) can be used to create accounts.' 
        } 
      };
    }

    try {
      // Use the edge function for validated signup
      const { data, error } = await supabase.functions.invoke('validate-signup', {
        body: { email, password }
      });

      if (error) {
        console.error('Edge function error:', error);
        return { error };
      }

      if (data.error) {
        return { error: data.error };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { error: { message: error.message } };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      displayName: getDisplayName(user),
      roles,
      isAdmin,
      signIn,
      signUp,
      signOut,
      refreshRoles
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
