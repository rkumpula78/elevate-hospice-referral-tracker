import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTrainingReminders } from '@/hooks/useTrainingReminders';
import { Bell, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

interface FollowUpItem {
  id: string;
  follow_up_date: string;
  organization_id: string | null;
  discussion_points: string | null;
  interaction_type: string;
  org_name?: string;
}

interface StatusChangeItem {
  id: string;
  referral_id: string;
  old_status: string;
  new_status: string;
  changed_at: string;
  patient_name?: string;
}

interface MentionItem {
  id: string;
  referral_id: string | null;
  message: string;
  actor_email: string | null;
  created_at: string;
  patient_name?: string;
}

const NotificationCenter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const notifiedIds = useRef<Set<string>>(new Set());

  // Fetch unread @mention notifications for the current user
  const { data: mentions = [] } = useQuery({
    queryKey: ['notification-mentions', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('id, referral_id, message, actor_email, created_at')
        .eq('user_id', user?.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;

      const refIds = [...new Set((data || []).map((d: any) => d.referral_id).filter(Boolean))] as string[];
      let refMap: Record<string, string> = {};
      if (refIds.length > 0) {
        const { data: refs } = await supabase
          .from('referrals')
          .select('id, patient_name')
          .in('id', refIds);
        refMap = Object.fromEntries((refs || []).map(r => [r.id, r.patient_name]));
      }

      return (data || []).map((item: any) => ({
        ...item,
        patient_name: item.referral_id ? refMap[item.referral_id] : undefined,
      })) as MentionItem[];
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });

  const markMentionRead = async (id: string) => {
    await (supabase as any).from('notifications').update({ is_read: true }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['notification-mentions', user?.id] });
  };

  // Fetch follow-ups that are overdue, due today, or due tomorrow
  const { data: followUps = [] } = useQuery({
    queryKey: ['notification-followups'],
    queryFn: async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('activity_communications')
        .select('id, follow_up_date, organization_id, discussion_points, interaction_type')
        .eq('follow_up_completed', false)
        .eq('follow_up_required', true)
        .lte('follow_up_date', tomorrowStr)
        .order('follow_up_date', { ascending: true });

      if (error) throw error;

      // Fetch org names for items with organization_id
      const orgIds = [...new Set((data || []).map(d => d.organization_id).filter(Boolean))] as string[];
      let orgMap: Record<string, string> = {};
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', orgIds);
        orgMap = Object.fromEntries((orgs || []).map(o => [o.id, o.name]));
      }

      return (data || []).map(item => ({
        ...item,
        org_name: item.organization_id ? orgMap[item.organization_id] : undefined,
      })) as FollowUpItem[];
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });

  // Fetch recent referral status changes (last 7 days)
  const { data: statusChanges = [] } = useQuery({
    queryKey: ['notification-status-changes'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('referral_status_history')
        .select('id, referral_id, old_status, new_status, changed_at')
        .gte('changed_at', sevenDaysAgo.toISOString())
        .order('changed_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get patient names
      const refIds = [...new Set((data || []).map(d => d.referral_id))];
      let refMap: Record<string, string> = {};
      if (refIds.length > 0) {
        const { data: refs } = await supabase
          .from('referrals')
          .select('id, patient_name')
          .in('id', refIds);
        refMap = Object.fromEntries((refs || []).map(r => [r.id, r.patient_name]));
      }

      return (data || []).map(item => ({
        ...item,
        patient_name: refMap[item.referral_id],
      })) as StatusChangeItem[];
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });

  // Annual training reminders (contracted orgs not trained this calendar year)
  const { data: trainingDue = [] } = useTrainingReminders();

  // Categorize follow-ups
  const overdue = followUps.filter(f => {
    const d = parseISO(f.follow_up_date);
    return isPast(d) && !isToday(d);
  });
  const dueToday = followUps.filter(f => isToday(parseISO(f.follow_up_date)));
  const dueTomorrow = followUps.filter(f => isTomorrow(parseISO(f.follow_up_date)));

  const unreadCount = overdue.length + dueToday.length + mentions.length + trainingDue.length;

  // Browser notification polling
  const checkBrowserNotifications = useCallback(async () => {
    if (Notification.permission !== 'granted') return;

    // Check user preference
    const { data: pref } = await supabase
      .from('user_preferences')
      .select('preference_value')
      .eq('user_id', user?.id)
      .eq('preference_key', 'reminder_browser_push')
      .maybeSingle();

    if (pref?.preference_value !== 'true') return;

    overdue.forEach(item => {
      if (!notifiedIds.current.has(item.id)) {
        new Notification('Overdue Follow-Up', {
          body: `${item.org_name || 'Unknown org'} — follow-up was due ${format(parseISO(item.follow_up_date), 'MMM d')}`,
          icon: '/favicon.ico',
        });
        notifiedIds.current.add(item.id);
      }
    });

    dueToday.forEach(item => {
      if (!notifiedIds.current.has(item.id)) {
        new Notification('Follow-Up Due Today', {
          body: `${item.org_name || 'Unknown org'} — follow up today`,
          icon: '/favicon.ico',
        });
        notifiedIds.current.add(item.id);
      }
    });
  }, [overdue, dueToday, user?.id]);

  useEffect(() => {
    if (!user) return;
    checkBrowserNotifications();
    const interval = setInterval(checkBrowserNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkBrowserNotifications, user]);

  const formatStatus = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-6rem)] mt-4 pr-2">
          <div className="space-y-4">
            {/* Mentions */}
            {mentions.length > 0 && (
              <Section title="Mentions" color="text-blue-600" badgeVariant="default" count={mentions.length}>
                {mentions.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      markMentionRead(item.id);
                      if (item.referral_id) navigate(`/referral/${item.referral_id}`);
                      setOpen(false);
                    }}
                    className="w-full text-left p-3 rounded-lg border border-border border-l-4 border-l-blue-500 hover:bg-accent/50 transition-colors"
                  >
                    <p className="text-sm font-medium">
                      {item.actor_email || 'Someone'} mentioned you
                      {item.patient_name ? ` · ${item.patient_name}` : ''}
                    </p>
                    {item.message && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">{format(parseISO(item.created_at), 'MMM d, h:mm a')}</p>
                  </button>
                ))}
              </Section>
            )}

            {/* Overdue */}
            {overdue.length > 0 && (
              <Section title="Overdue" color="text-destructive" badgeVariant="destructive" count={overdue.length}>
                {overdue.map(item => (
                  <FollowUpRow key={item.id} item={item} variant="overdue" onClick={() => {
                    if (item.organization_id) {
                      navigate(`/organizations/${item.organization_id}`);
                      setOpen(false);
                    }
                  }} />
                ))}
              </Section>
            )}

            {/* Due Today */}
            {dueToday.length > 0 && (
              <Section title="Due Today" color="text-amber-600" badgeVariant="secondary" count={dueToday.length}>
                {dueToday.map(item => (
                  <FollowUpRow key={item.id} item={item} variant="today" onClick={() => {
                    if (item.organization_id) {
                      navigate(`/organizations/${item.organization_id}`);
                      setOpen(false);
                    }
                  }} />
                ))}
              </Section>
            )}

            {/* Due Tomorrow */}
            {dueTomorrow.length > 0 && (
              <Section title="Due Tomorrow" color="text-blue-600" badgeVariant="outline" count={dueTomorrow.length}>
                {dueTomorrow.map(item => (
                  <FollowUpRow key={item.id} item={item} variant="tomorrow" onClick={() => {
                    if (item.organization_id) {
                      navigate(`/organizations/${item.organization_id}`);
                      setOpen(false);
                    }
                  }} />
                ))}
              </Section>
            )}

            {/* Annual Training Due */}
            {trainingDue.length > 0 && (
              <Section title="Annual Training Due" color="text-amber-600" badgeVariant="secondary" count={trainingDue.length}>
                {trainingDue.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { navigate(`/organizations/${item.id}`); setOpen(false); }}
                    className="w-full text-left p-3 rounded-lg border border-border border-l-4 border-l-amber-500 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-sm font-medium">{item.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.last_training_review
                        ? `Last trained ${format(parseISO(item.last_training_review), 'MMM d, yyyy')} — due this year (Q${item.quarter})`
                        : `No training on record — due this year (Q${item.quarter})`}
                    </p>
                  </button>
                ))}
              </Section>
            )}

            {/* Status Changes */}
            {statusChanges.length > 0 && (
              <Section title="Recent Status Changes" color="text-muted-foreground" badgeVariant="outline" count={statusChanges.length}>
                {statusChanges.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { navigate(`/referral/${item.referral_id}`); setOpen(false); }}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <p className="text-sm font-medium">{item.patient_name || 'Unknown patient'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatStatus(item.old_status)} → {formatStatus(item.new_status)}
                    </p>
                    <p className="text-xs text-muted-foreground">{format(parseISO(item.changed_at), 'MMM d, h:mm a')}</p>
                  </button>
                ))}
              </Section>
            )}

            {unreadCount === 0 && dueTomorrow.length === 0 && statusChanges.length === 0 && mentions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">All caught up! No pending notifications.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

const Section = ({ title, color, badgeVariant, count, children }: {
  title: string;
  color: string;
  badgeVariant: 'destructive' | 'secondary' | 'outline' | 'default';
  count: number;
  children: React.ReactNode;
}) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      <h3 className={`text-sm font-semibold ${color}`}>{title}</h3>
      <Badge variant={badgeVariant} className="text-[10px] h-5">{count}</Badge>
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

const FollowUpRow = ({ item, variant, onClick }: {
  item: FollowUpItem;
  variant: 'overdue' | 'today' | 'tomorrow';
  onClick: () => void;
}) => {
  const borderColor = variant === 'overdue' ? 'border-l-destructive' : variant === 'today' ? 'border-l-amber-500' : 'border-l-blue-500';
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border border-border ${borderColor} border-l-4 hover:bg-accent/50 transition-colors`}
    >
      <p className="text-sm font-medium">{item.org_name || 'Unknown organization'}</p>
      {item.discussion_points && (
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.discussion_points}</p>
      )}
      <p className="text-xs text-muted-foreground mt-0.5">
        Due: {format(parseISO(item.follow_up_date), 'MMM d, yyyy')}
      </p>
    </button>
  );
};

export default NotificationCenter;
