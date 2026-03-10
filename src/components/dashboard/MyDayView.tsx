import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import QuickAddDialog from '@/components/crm/QuickAddDialog';
import { AccountRatingBadge } from '@/components/crm/AccountRatingBadge';
import PullToRefresh from 'react-simple-pull-to-refresh';
import {
  format, startOfDay, startOfWeek, startOfMonth, differenceInDays, parseISO,
} from 'date-fns';
import {
  Clock, AlertTriangle, FileText, Building, BarChart3, Phone, ChevronRight,
} from 'lucide-react';

const MyDayView = () => {
  const { displayName } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = new Date(new Date().setHours(23, 59, 59, 999)).toISOString();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
  const monthStart = startOfMonth(new Date()).toISOString();

  // 1. Today's Schedule
  const { data: todaySchedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['my-day-schedule', today, displayName],
    queryFn: async () => {
      const { data } = await supabase
        .from('activity_communications')
        .select('id, activity_date, interaction_type, purpose, organizations(id, name)')
        .gte('activity_date', todayStart)
        .lte('activity_date', todayEnd)
        .eq('completed_by', displayName)
        .order('activity_date', { ascending: true });
      return data || [];
    },
  });

  // 2. Overdue Follow-ups
  const { data: overdueFollowUps, isLoading: overdueLoading } = useQuery({
    queryKey: ['my-day-overdue', today, displayName],
    queryFn: async () => {
      const { data } = await supabase
        .from('activity_communications')
        .select('id, follow_up_date, interaction_type, next_step, organizations(id, name, phone)')
        .eq('follow_up_required', true)
        .eq('follow_up_completed', false)
        .lt('follow_up_date', today)
        .eq('completed_by', displayName)
        .order('follow_up_date', { ascending: true })
        .limit(10);
      return data || [];
    },
  });

  // 3. New Referrals
  const { data: newReferrals, isLoading: referralsLoading } = useQuery({
    queryKey: ['my-day-new-referrals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('referrals')
        .select('id, first_name, last_name, referral_date, referral_source, created_at, organizations(name)')
        .eq('status', 'new_referral')
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  // 4. Accounts Due for Visit
  const { data: accountsDue, isLoading: accountsLoading } = useQuery({
    queryKey: ['my-day-accounts-due', displayName],
    queryFn: async () => {
      // Get active orgs assigned to this marketer
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, account_rating, assigned_marketer')
        .eq('is_active', true)
        .eq('assigned_marketer', displayName);

      if (!orgs || orgs.length === 0) return [];

      // For each org, get last activity date
      const results = await Promise.all(
        orgs.map(async (org) => {
          const { data: activities } = await supabase
            .from('activity_communications')
            .select('activity_date')
            .eq('organization_id', org.id)
            .order('activity_date', { ascending: false })
            .limit(1);

          const lastVisit = activities?.[0]?.activity_date;
          const daysSince = lastVisit
            ? differenceInDays(new Date(), parseISO(lastVisit))
            : 999;

          return { ...org, lastVisitDate: lastVisit, daysSinceVisit: daysSince };
        })
      );

      return results
        .filter((r) => r.daysSinceVisit > 14)
        .sort((a, b) => b.daysSinceVisit - a.daysSinceVisit)
        .slice(0, 10);
    },
  });

  // 5. Quick Stats
  const { data: quickStats, isLoading: statsLoading } = useQuery({
    queryKey: ['my-day-stats', today, displayName],
    queryFn: async () => {
      const [visitsRes, weekReferralsRes, monthReferralsRes, monthAdmittedRes] = await Promise.all([
        supabase
          .from('activity_communications')
          .select('id', { count: 'exact', head: true })
          .gte('activity_date', todayStart)
          .lte('activity_date', todayEnd)
          .eq('completed_by', displayName),
        supabase
          .from('referrals')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', weekStart),
        supabase
          .from('referrals')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', monthStart),
        supabase
          .from('referrals')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', monthStart)
          .in('status', ['admitted', 'admitted_our_hospice']),
      ]);

      const totalMonth = monthReferralsRes.count || 0;
      const admittedMonth = monthAdmittedRes.count || 0;
      const conversionRate = totalMonth > 0 ? Math.round((admittedMonth / totalMonth) * 100) : 0;

      return {
        visitsToday: visitsRes.count || 0,
        referralsThisWeek: weekReferralsRes.count || 0,
        conversionRate,
      };
    },
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['my-day-schedule'] });
    await queryClient.invalidateQueries({ queryKey: ['my-day-overdue'] });
    await queryClient.invalidateQueries({ queryKey: ['my-day-new-referrals'] });
    await queryClient.invalidateQueries({ queryKey: ['my-day-accounts-due'] });
    await queryClient.invalidateQueries({ queryKey: ['my-day-stats'] });
  };

  const redactLastName = (first: string | null, last: string | null) => {
    const f = first || 'Unknown';
    const l = last ? last.charAt(0) + '.' : '';
    return `${f} ${l}`.trim();
  };

  const content = (
    <div className="space-y-5">
      {/* Quick Stats Bar */}
      <div className="grid grid-cols-3 gap-3" data-tour="my-day-stats">
        {statsLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))
        ) : (
          <>
            <Card className="text-center p-3">
              <p className="text-2xl font-bold text-foreground">{quickStats?.visitsToday ?? 0}</p>
              <p className="text-xs text-muted-foreground">Visits Today</p>
            </Card>
            <Card className="text-center p-3">
              <p className="text-2xl font-bold text-foreground">{quickStats?.referralsThisWeek ?? 0}</p>
              <p className="text-xs text-muted-foreground">Referrals This Week</p>
            </Card>
            <Card className="text-center p-3">
              <p className="text-2xl font-bold text-foreground">{quickStats?.conversionRate ?? 0}%</p>
              <p className="text-xs text-muted-foreground">Conversion (MTD)</p>
            </Card>
          </>
        )}
      </div>

      {/* Overdue Follow-ups (priority) */}
      <Card className="border-destructive/30" data-tour="my-day-overdue">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Overdue Follow-ups
            {overdueFollowUps && overdueFollowUps.length > 0 && (
              <Badge variant="destructive" className="ml-auto text-xs">{overdueFollowUps.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {overdueLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-md" />)
          ) : overdueFollowUps && overdueFollowUps.length > 0 ? (
            overdueFollowUps.map((item: any) => {
              const daysOverdue = differenceInDays(new Date(), parseISO(item.follow_up_date));
              const org = item.organizations as any;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-md bg-destructive/5 border border-destructive/20"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{org?.name || 'Unknown Org'}</p>
                    <p className="text-xs text-destructive font-medium">{daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue</p>
                    {item.next_step && <p className="text-xs text-muted-foreground truncate">{item.next_step}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {org?.phone && (
                      <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                        <a href={`tel:${org.phone}`}><Phone className="h-3.5 w-3.5" /></a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => org?.id ? navigate(`/organizations/${org.id}`) : null}
                    >
                      Follow Up
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No overdue follow-ups 🎉</p>
          )}
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scheduleLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-md" />)}
            </div>
          ) : todaySchedule && todaySchedule.length > 0 ? (
            <div className="relative pl-4 border-l-2 border-primary/20 space-y-3">
              {todaySchedule.map((item: any) => {
                const org = item.organizations as any;
                const time = format(parseISO(item.activity_date), 'h:mm a');
                return (
                  <div
                    key={item.id}
                    className="relative cursor-pointer hover:bg-accent/50 rounded-md p-2 -ml-2 transition-colors"
                    onClick={() => org?.id && navigate(`/organizations/${org.id}`)}
                  >
                    <div className="absolute -left-[1.15rem] top-3 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{org?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{time} · {item.interaction_type}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No activities scheduled today</p>
          )}
        </CardContent>
      </Card>

      {/* New Referrals to Review */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            New Referrals to Review
            {newReferrals && newReferrals.length > 0 && (
              <Badge className="ml-auto text-xs">{newReferrals.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {referralsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-md" />)
          ) : newReferrals && newReferrals.length > 0 ? (
            newReferrals.map((ref: any) => {
              const org = ref.organizations as any;
              return (
                <div
                  key={ref.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/referrals/${ref.id}`)}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {redactLastName(ref.first_name, ref.last_name)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {org?.name || ref.referral_source || 'Unknown source'} · {ref.referral_date ? format(parseISO(ref.referral_date), 'MMM d') : 'No date'}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No new referrals to review</p>
          )}
        </CardContent>
      </Card>

      {/* Accounts Due for Visit */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building className="h-4 w-4 text-primary" />
            Accounts Due for Visit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {accountsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-md" />)
          ) : accountsDue && accountsDue.length > 0 ? (
            accountsDue.map((org: any) => (
              <div
                key={org.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/organizations/${org.id}`)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{org.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {org.daysSinceVisit >= 999 ? 'Never visited' : `${org.daysSinceVisit} days since last visit`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <AccountRatingBadge rating={org.account_rating} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">All accounts are up to date ✓</p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <PullToRefresh onRefresh={handleRefresh} pullingContent={<p className="text-center text-xs text-muted-foreground py-2">Pull to refresh...</p>}>
          {content}
        </PullToRefresh>
      ) : (
        content
      )}

      {isMobile && <FloatingActionButton onClick={() => setShowQuickAdd(true)} label="Quick Add" />}
      <QuickAddDialog open={showQuickAdd} onOpenChange={setShowQuickAdd} />
    </>
  );
};

export default MyDayView;
