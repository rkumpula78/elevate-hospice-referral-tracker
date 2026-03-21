import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AccountRatingBadge } from '@/components/crm/AccountRatingBadge';
import QuickLogActivitySheet from '@/components/crm/QuickLogActivitySheet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { differenceInDays, parseISO } from 'date-fns';
import { MapPin, Zap, AlertTriangle, ChevronRight } from 'lucide-react';

const RATING_WEIGHT: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 };

function getCurrentWeekOfMonth(): number {
  const now = new Date();
  return Math.ceil(now.getDate() / 7);
}

function parseRoutingWeek(notes: string | null): number | null {
  if (!notes) return null;
  const match = notes.match(/Week\s*(\d)/i);
  return match ? parseInt(match[1]) : null;
}

const MyRouteThisWeek = () => {
  const { displayName } = useAuth();
  const navigate = useNavigate();
  const autoWeek = getCurrentWeekOfMonth();
  const [selectedWeek, setSelectedWeek] = useState<string>(String(Math.min(autoWeek, 4)));

  const { data: routeOrgs, isLoading } = useQuery({
    queryKey: ['my-route-week', displayName, selectedWeek],
    queryFn: async () => {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, account_rating, partnership_notes, address, phone')
        .eq('is_active', true)
        .eq('assigned_marketer', displayName);

      if (!orgs || orgs.length === 0) return [];

      // Filter by routing week
      const weekNum = parseInt(selectedWeek);
      const weekOrgs = orgs.filter(o => parseRoutingWeek(o.partnership_notes) === weekNum);

      if (weekOrgs.length === 0) return [];

      // Get last activity for each
      const orgIds = weekOrgs.map(o => o.id);
      const { data: activities } = await supabase
        .from('activity_communications')
        .select('organization_id, activity_date')
        .in('organization_id', orgIds)
        .order('activity_date', { ascending: false });

      const lastVisitMap: Record<string, string> = {};
      (activities || []).forEach(a => {
        if (a.organization_id && !lastVisitMap[a.organization_id]) {
          lastVisitMap[a.organization_id] = a.activity_date;
        }
      });

      // Get overdue follow-ups count per org
      const { data: overdueData } = await supabase
        .from('activity_communications')
        .select('organization_id')
        .in('organization_id', orgIds)
        .eq('follow_up_required', true)
        .eq('follow_up_completed', false)
        .lt('follow_up_date', new Date().toISOString().split('T')[0]);

      const overdueMap: Record<string, number> = {};
      (overdueData || []).forEach(a => {
        if (a.organization_id) {
          overdueMap[a.organization_id] = (overdueMap[a.organization_id] || 0) + 1;
        }
      });

      return weekOrgs
        .map(org => {
          const lastVisit = lastVisitMap[org.id];
          const daysSince = lastVisit ? differenceInDays(new Date(), parseISO(lastVisit)) : 999;
          const weight = RATING_WEIGHT[org.account_rating || 'C'] || 2;
          const priority = daysSince * weight;
          return {
            ...org,
            lastVisitDate: lastVisit || null,
            daysSinceVisit: daysSince,
            overdueCount: overdueMap[org.id] || 0,
            priority,
          };
        })
        .sort((a, b) => b.priority - a.priority);
    },
    enabled: !!displayName,
  });

  const getContactColor = (days: number) => {
    if (days >= 999) return 'text-muted-foreground';
    if (days <= 7) return 'text-green-600';
    if (days <= 14) return 'text-amber-600';
    return 'text-destructive';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            My Route This Week
          </CardTitle>
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Week 1</SelectItem>
              <SelectItem value="2">Week 2</SelectItem>
              <SelectItem value="3">Week 3</SelectItem>
              <SelectItem value="4">Week 4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-md" />)
        ) : routeOrgs && routeOrgs.length > 0 ? (
          routeOrgs.map(org => (
            <div
              key={org.id}
              className="flex items-center justify-between p-2.5 rounded-md border border-border hover:bg-accent/50 transition-colors"
            >
              <div
                className="min-w-0 flex-1 cursor-pointer"
                onClick={() => navigate(`/organizations/${org.id}`)}
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{org.name}</p>
                  {org.overdueCount > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                      {org.overdueCount}
                    </Badge>
                  )}
                </div>
                <p className={`text-xs ${getContactColor(org.daysSinceVisit)}`}>
                  {org.daysSinceVisit >= 999
                    ? 'Never visited'
                    : `${org.daysSinceVisit}d since last contact`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <AccountRatingBadge rating={org.account_rating} />
                <QuickLogActivitySheet
                  organizationId={org.id}
                  organizationName={org.name}
                  accountRating={org.account_rating}
                  trigger={
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                      <Zap className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <ChevronRight
                  className="h-4 w-4 text-muted-foreground cursor-pointer"
                  onClick={() => navigate(`/organizations/${org.id}`)}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No organizations assigned to Week {selectedWeek}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MyRouteThisWeek;
