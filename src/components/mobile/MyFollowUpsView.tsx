import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Phone, CheckCircle, AlertCircle, Calendar, ClipboardList } from 'lucide-react';
import { format, parseISO, isBefore, startOfDay, addDays } from 'date-fns';
import { EmptyState } from '@/components/ui/empty-state';
import { useNavigate } from 'react-router-dom';

const MyFollowUpsView = () => {
  const { displayName } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const today = startOfDay(new Date());

  const { data: followUps = [], isLoading } = useQuery({
    queryKey: ['my-followups', displayName],
    queryFn: async () => {
      let query = supabase
        .from('referrals')
        .select('id, patient_name, patient_phone, assigned_marketer, next_followup_date, status, diagnosis, organizations(name)')
        .not('next_followup_date', 'is', null)
        .in('status', ['palliative_outreach', 'not_appropriate', 'contacted', 'assessment_scheduled', 'new_referral'] as any[])
        .order('next_followup_date', { ascending: true });

      // Filter by current user if we have a display name
      if (displayName) {
        query = query.eq('assigned_marketer', displayName);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  const completeMutation = useMutation({
    mutationFn: async (referralId: string) => {
      // Log a "completed follow-up" activity
      await supabase.from('referral_activity_log').insert({
        referral_id: referralId,
        activity_type: 'status_update',
        note_text: 'Completed scheduled follow-up',
        created_by: displayName || 'Unknown',
      });

      // Clear the follow-up date
      const nextDate = format(addDays(new Date(), 14), 'yyyy-MM-dd');
      await supabase
        .from('referrals')
        .update({ next_followup_date: nextDate })
        .eq('id', referralId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-followups'] });
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      toast({ title: 'Follow-up completed', description: 'Next follow-up set in 14 days.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Swipe state per row
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent, id: string) => {
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchStartX.current - touchCurrentX.current;
    if (diff > 60) {
      setSwipedId(id);
    } else if (diff < -30) {
      setSwipedId(null);
    }
  };

  const handleTouchEnd = () => {
    // Keep swiped state
  };

  const overdueCount = followUps.filter(r => r.next_followup_date && isBefore(parseISO(r.next_followup_date), today)).length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          My Follow-ups
          <Badge variant="secondary">{followUps.length}</Badge>
          {overdueCount > 0 && (
            <Badge className="bg-destructive/10 text-destructive">{overdueCount} overdue</Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">Swipe left to complete • Tap phone to call</p>
      </CardHeader>
      <CardContent className="px-2">
        {followUps.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="All caught up!"
            description="No follow-ups assigned to you"
          />
        ) : (
          <div className="space-y-1">
            {followUps.map((ref: any) => {
              const isOverdue = ref.next_followup_date && isBefore(parseISO(ref.next_followup_date), today);
              const isSwiped = swipedId === ref.id;

              return (
                <div
                  key={ref.id}
                  className="relative overflow-hidden rounded-lg"
                >
                  {/* Swipe-to-complete background */}
                  <div className="absolute inset-0 bg-green-500 flex items-center justify-end pr-4 rounded-lg">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <CheckCircle className="w-5 h-5" />
                      Complete
                    </div>
                  </div>

                  {/* Main row */}
                  <div
                    className={`relative bg-background border rounded-lg transition-transform duration-200 ${
                      isSwiped ? '-translate-x-24' : 'translate-x-0'
                    } ${isOverdue ? 'border-destructive/30 bg-destructive/5' : 'border-border'}`}
                    onTouchStart={(e) => handleTouchStart(e, ref.id)}
                    onTouchMove={(e) => handleTouchMove(e, ref.id)}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div className="flex items-center p-3 gap-3">
                      {/* Left: Patient info */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => navigate(`/referrals/${ref.id}`)}
                      >
                        <p className="font-medium text-sm truncate">{ref.patient_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          {ref.organizations?.name && (
                            <span className="truncate">{ref.organizations.name}</span>
                          )}
                          {ref.diagnosis && (
                            <>
                              <span>•</span>
                              <span className="truncate">{ref.diagnosis}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {isOverdue ? (
                            <AlertCircle className="w-3 h-3 text-destructive" />
                          ) : (
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                          )}
                          <span className={`text-xs ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                            {ref.next_followup_date ? format(parseISO(ref.next_followup_date), 'MMM d') : ''}
                          </span>
                        </div>
                      </div>

                      {/* Right: Phone + Complete */}
                      <div className="flex items-center gap-2 shrink-0">
                        {ref.patient_phone && (
                          <a
                            href={`tel:${ref.patient_phone}`}
                            className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="w-4 h-4 text-primary" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Complete button revealed by swipe */}
                  {isSwiped && (
                    <button
                      className="absolute right-0 top-0 bottom-0 w-24 bg-green-500 flex items-center justify-center rounded-r-lg"
                      onClick={() => {
                        completeMutation.mutate(ref.id);
                        setSwipedId(null);
                      }}
                    >
                      <div className="text-white text-center">
                        <CheckCircle className="w-5 h-5 mx-auto" />
                        <span className="text-xs">Done</span>
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyFollowUpsView;
