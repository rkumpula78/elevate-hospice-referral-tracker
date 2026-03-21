import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { Target } from 'lucide-react';

const GoalProgressWidget = () => {
  const { displayName } = useAuth();
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const { data, isLoading } = useQuery({
    queryKey: ['goal-progress', displayName],
    queryFn: async () => {
      // Get goals for current period
      const todayStr = format(now, 'yyyy-MM-dd');
      const { data: goals } = await supabase
        .from('liaison_goals')
        .select('*')
        .eq('liaison_name', displayName)
        .lte('goal_period_start', todayStr)
        .gte('goal_period_end', todayStr)
        .limit(1);

      const goal = goals?.[0];
      if (!goal) return null;

      // Get actual counts this week
      const weekStartISO = weekStart.toISOString();
      const weekEndISO = weekEnd.toISOString();

      const { data: activities } = await supabase
        .from('activity_communications')
        .select('interaction_type')
        .eq('completed_by', displayName)
        .gte('activity_date', weekStartISO)
        .lte('activity_date', weekEndISO);

      const visits = (activities || []).filter(a =>
        a.interaction_type === 'in_person_visit'
      ).length;
      const calls = (activities || []).filter(a =>
        a.interaction_type === 'phone_call'
      ).length;
      const lunchLearns = (activities || []).filter(a =>
        a.interaction_type === 'lunch_learn'
      ).length;

      return {
        visits: { actual: visits, goal: goal.in_person_visits_goal || 0 },
        calls: { actual: calls, goal: goal.phone_calls_goal || 0 },
        lunchLearns: { actual: lunchLearns, goal: goal.lunch_learns_goal || 0 },
      };
    },
    enabled: !!displayName,
  });

  if (isLoading) {
    return <Skeleton className="h-24 rounded-lg" />;
  }

  if (!data) return null;

  const items = [
    { label: 'Visits', ...data.visits },
    { label: 'Calls', ...data.calls },
    { label: 'L&Ls', ...data.lunchLearns },
  ].filter(i => i.goal > 0);

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Weekly Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map(item => {
          const pct = item.goal > 0 ? Math.min(Math.round((item.actual / item.goal) * 100), 100) : 0;
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.actual}/{item.goal}</span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default GoalProgressWidget;
