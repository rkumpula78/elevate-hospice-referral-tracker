import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_TIMEOUT_MS = 25 * 60 * 1000; // 25 minutes

export const useSessionTimeout = () => {
  const navigate = useNavigate();
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningShownRef = useRef(false);

  const signOutAndRedirect = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
    toast({
      title: 'Session Expired',
      description: 'You have been signed out due to inactivity.',
      variant: 'destructive',
    });
  }, [navigate]);

  const resetTimers = useCallback(() => {
    warningShownRef.current = false;

    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    warningTimerRef.current = setTimeout(() => {
      warningShownRef.current = true;
      toast({
        title: 'Session Expiring Soon',
        description: 'Your session will expire in 5 minutes due to inactivity. Move your mouse or press a key to stay signed in.',
      });
    }, WARNING_TIMEOUT_MS);

    idleTimerRef.current = setTimeout(() => {
      signOutAndRedirect();
    }, IDLE_TIMEOUT_MS);
  }, [signOutAndRedirect]);

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const handleActivity = () => resetTimers();

    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));
    resetTimers();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetTimers]);
};
