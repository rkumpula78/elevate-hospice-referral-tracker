import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calendar, ArrowRight } from 'lucide-react';
import { format, parseISO, isBefore, addDays, startOfDay } from 'date-fns';

const FollowUpsDueWidget = () => {
  const navigate = useNavigate();
  const today = startOfDay(new Date());
  const nextWeek = addDays(today, 7);

  const { data, isLoading } = useQuery({
    queryKey: ['followups-due-widget'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('id, patient_name, assigned_marketer, next_followup_date')
        .in('status', ['palliative_outreach', 'not_appropriate'])
        .not('next_followup_date', 'is', null)
        .lte('next_followup_date', format(nextWeek, 'yyyy-MM-dd'))
        .order('next_followup_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  const overdueCount = data?.filter(r => r.next_followup_date && isBefore(parseISO(r.next_followup_date), today)).length || 0;
  const totalDue = data?.length || 0;
  const display = data?.slice(0, 5) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            Follow-ups Due This Week
            <Badge variant="secondary" className="ml-1">{totalDue}</Badge>
            {overdueCount > 0 && (
              <Badge className="bg-red-100 text-red-800 ml-1">{overdueCount} overdue</Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/referrals?tab=palliative')}>
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {display.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No follow-ups due this week 🎉</p>
        ) : (
          <div className="space-y-2">
            {display.map(ref => {
              const isOverdue = ref.next_followup_date && isBefore(parseISO(ref.next_followup_date), today);
              return (
                <div
                  key={ref.id}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${isOverdue ? 'bg-red-50 hover:bg-red-100' : 'bg-muted/50 hover:bg-muted'}`}
                  onClick={() => navigate(`/referral/${ref.id}`)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isOverdue && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{ref.patient_name}</p>
                      <p className="text-xs text-muted-foreground">{ref.assigned_marketer || 'Unassigned'}</p>
                    </div>
                  </div>
                  <span className={`text-xs whitespace-nowrap ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                    {ref.next_followup_date ? format(parseISO(ref.next_followup_date), 'MMM d') : ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FollowUpsDueWidget;
