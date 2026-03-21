import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';
import { ClipboardCheck } from 'lucide-react';
import ChartExportButton from '@/components/ui/chart-export-button';
import { exportToCSV } from '@/lib/exportUtils';

interface Props {
  periodStart: Date;
  periodEnd: Date;
}

const ActivityComplianceCard = ({ periodStart, periodEnd }: Props) => {
  const { data, isLoading } = useQuery({
    queryKey: ['activity-compliance', periodStart.toISOString(), periodEnd.toISOString()],
    queryFn: async () => {
      // Get all marketers with assigned orgs
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, assigned_marketer, account_rating')
        .eq('is_active', true)
        .not('assigned_marketer', 'is', null);

      const marketerOrgs: Record<string, { total: number; ids: string[] }> = {};
      (orgs || []).forEach(o => {
        const m = o.assigned_marketer!;
        if (!marketerOrgs[m]) marketerOrgs[m] = { total: 0, ids: [] };
        marketerOrgs[m].total++;
        marketerOrgs[m].ids.push(o.id);
      });

      // Get activities in period
      const { data: activities } = await supabase
        .from('activity_communications')
        .select('completed_by, organization_id, discussion_points, follow_up_required, follow_up_completed, interaction_type')
        .gte('activity_date', periodStart.toISOString())
        .lte('activity_date', periodEnd.toISOString());

      // Get goals
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const { data: goals } = await supabase
        .from('liaison_goals')
        .select('*')
        .lte('goal_period_start', todayStr)
        .gte('goal_period_end', todayStr);

      const goalsMap: Record<string, any> = {};
      (goals || []).forEach(g => { goalsMap[g.liaison_name] = g; });

      // Build per-marketer stats
      const marketers = Object.keys(marketerOrgs);
      return marketers.map(name => {
        const myActivities = (activities || []).filter(a => a.completed_by === name);
        const contactedOrgIds = new Set(myActivities.map(a => a.organization_id).filter(Boolean));
        const totalOrgs = marketerOrgs[name].total;
        const contactedPct = totalOrgs > 0 ? Math.round((contactedOrgIds.size / totalOrgs) * 100) : 0;

        const notesLengths = myActivities
          .map(a => (a.discussion_points || '').length)
          .filter(l => l > 0);
        const avgNotesLen = notesLengths.length > 0
          ? Math.round(notesLengths.reduce((a, b) => a + b, 0) / notesLengths.length)
          : 0;

        const followUps = myActivities.filter(a => a.follow_up_required);
        const completedFollowUps = followUps.filter(a => a.follow_up_completed);
        const followUpRate = followUps.length > 0
          ? Math.round((completedFollowUps.length / followUps.length) * 100)
          : 100;

        const goal = goalsMap[name];
        const visits = myActivities.filter(a => a.interaction_type === 'in_person_visit').length;
        const goalVisits = goal?.in_person_visits_goal || 0;

        return {
          name,
          activitiesLogged: myActivities.length,
          contactedPct,
          avgNotesLen,
          followUpRate,
          visits,
          goalVisits,
        };
      }).sort((a, b) => b.activitiesLogged - a.activitiesLogged);
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            <span>Activity Compliance</span>
          </CardTitle>
          <ChartExportButton onClick={() => {
            if (!data) return;
            exportToCSV(data, 'activity-compliance', [
              { key: 'name', label: 'Marketer' },
              { key: 'activitiesLogged', label: 'Activities' },
              { key: 'contactedPct', label: 'Accounts Contacted (%)' },
              { key: 'avgNotesLen', label: 'Avg Notes Length' },
              { key: 'followUpRate', label: 'Follow-up Rate (%)' },
              { key: 'visits', label: 'Visits' },
              { key: 'goalVisits', label: 'Visit Goal' },
            ]);
          }} />
        </div>
        <CardDescription>Per-marketer activity metrics and compliance</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-4">
            {data.map(m => (
              <div key={m.name} className="space-y-2 p-3 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{m.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {m.activitiesLogged} activities
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Accounts contacted</span>
                    <span className="font-medium">{m.contactedPct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Follow-up rate</span>
                    <span className="font-medium">{m.followUpRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg note length</span>
                    <span className="font-medium">{m.avgNotesLen} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Visits vs goal</span>
                    <span className="font-medium">{m.visits}/{m.goalVisits || '—'}</span>
                  </div>
                </div>
                {m.goalVisits > 0 && (
                  <Progress
                    value={Math.min(Math.round((m.visits / m.goalVisits) * 100), 100)}
                    className="h-1.5"
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No marketer data available</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityComplianceCard;
