import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GitCommitVertical } from 'lucide-react';

interface StatusHistoryEntry {
  id: string;
  referral_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
}

interface StatusTimelineProps {
  referralId: string;
  currentStatus: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  new_referral: { label: 'New', color: 'hsl(var(--primary))', bgColor: 'bg-blue-100', borderColor: 'border-blue-400' },
  in_progress: { label: 'In Progress', color: 'hsl(45 93% 47%)', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-400' },
  assessment: { label: 'Assessment', color: 'hsl(270 50% 60%)', bgColor: 'bg-purple-100', borderColor: 'border-purple-400' },
  pending: { label: 'Pending', color: 'hsl(30 80% 55%)', bgColor: 'bg-orange-100', borderColor: 'border-orange-400' },
  pending_admission: { label: 'Pending', color: 'hsl(30 80% 55%)', bgColor: 'bg-orange-100', borderColor: 'border-orange-400' },
  admitted: { label: 'Admitted', color: 'hsl(142 76% 36%)', bgColor: 'bg-green-100', borderColor: 'border-green-400' },
  closed: { label: 'Closed', color: 'hsl(var(--muted-foreground))', bgColor: 'bg-muted', borderColor: 'border-muted-foreground/40' },
};

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status] ?? { label: status, color: 'hsl(var(--muted-foreground))', bgColor: 'bg-muted', borderColor: 'border-muted-foreground/40' };

const StatusTimeline: React.FC<StatusTimelineProps> = ({ referralId, currentStatus }) => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['referral-status-history', referralId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_status_history' as any)
        .select('*')
        .eq('referral_id', referralId)
        .order('changed_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as StatusHistoryEntry[];
    },
    enabled: !!referralId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Status History</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-6 w-6 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Build timeline entries from history or fallback to current status
  const entries: StatusHistoryEntry[] =
    history && history.length > 0
      ? history
      : [
          {
            id: 'current',
            referral_id: referralId,
            old_status: null,
            new_status: currentStatus,
            changed_by: null,
            changed_at: new Date().toISOString(),
            notes: null,
          },
        ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCommitVertical className="h-5 w-5 text-muted-foreground" />
          Status History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {entries.map((entry, idx) => {
            const isLast = idx === entries.length - 1;
            const isCurrent = isLast;
            const cfg = getStatusConfig(entry.new_status);

            return (
              <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Connecting line */}
                {!isLast && (
                  <div
                    className="absolute left-[11px] top-6 w-0.5 bottom-0"
                    style={{ backgroundColor: 'hsl(var(--border))' }}
                  />
                )}

                {/* Dot */}
                <div className="relative shrink-0 flex items-start pt-0.5">
                  <div
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${isCurrent ? 'animate-pulse' : ''}`}
                    style={{
                      borderColor: cfg.color,
                      backgroundColor: isCurrent ? cfg.color : 'hsl(var(--background))',
                    }}
                  >
                    {isCurrent && (
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: 'hsl(var(--background))' }}
                      />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.old_status && (
                      <>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusConfig(entry.old_status).bgColor} text-foreground/70`}>
                          {getStatusConfig(entry.old_status).label}
                        </span>
                        <span className="text-muted-foreground text-xs">→</span>
                      </>
                    )}
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bgColor}`}
                      style={{ color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(entry.changed_at), 'MMM dd, yyyy · h:mm a')}
                    {entry.changed_by && (
                      <span> · by {entry.changed_by}</span>
                    )}
                  </p>
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{entry.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusTimeline;
