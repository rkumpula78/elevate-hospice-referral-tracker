import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { notifyStatusChange } from '@/lib/webhookNotifier';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getStatusLabel } from '@/lib/constants';
import { differenceInDays, parseISO, format, isBefore } from 'date-fns';
import { GripVertical, User, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLUMNS = [
  { status: 'palliative_outreach', label: 'Active Outreach', accent: 'border-l-blue-500' },
  { status: 'not_appropriate', label: 'Not Appropriate / Re-engage Later', accent: 'border-l-amber-500' },
  { status: 'admitted', label: 'Converted to Hospice', accent: 'border-l-emerald-500' },
] as const;

const PalliativeOutreachKanban = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['palliative-outreach-kanban'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('id, patient_name, first_name, last_name, assigned_marketer, pcp_provider, pcp_company, next_followup_date, status, updated_at, priority, organizations(name)')
        .in('status', ['palliative_outreach', 'not_appropriate', 'admitted'] as any[])
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('referrals')
        .update({ status: status as any } as any)
        .eq('id', id)
        .is('deleted_at', null);
      if (error) throw error;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ['palliative-outreach-kanban'] });
      const previous = queryClient.getQueryData(['palliative-outreach-kanban']);
      queryClient.setQueryData(['palliative-outreach-kanban'], (old: any[]) =>
        old?.map(r => r.id === vars.id ? { ...r, status: vars.status, updated_at: new Date().toISOString() } : r) ?? []
      );
      return { previous };
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['palliative-outreach-referrals'] });
      queryClient.invalidateQueries({ queryKey: ['palliative-outreach-count'] });
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      toast({ title: `✅ Moved to ${getStatusLabel(vars.status)}` });
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['palliative-outreach-kanban'], context.previous);
      }
      toast({ title: 'Failed to update status', variant: 'destructive' });
    },
  });

  const grouped = COLUMNS.reduce<Record<string, any[]>>((acc, col) => {
    acc[col.status] = referrals.filter(r => r.status === col.status);
    return acc;
  }, {});

  const today = new Date();

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    const ref = referrals.find(r => r.id === id);
    if (ref && ref.status !== targetStatus) {
      notifyStatusChange(id, ref.status, targetStatus);
      updateStatusMutation.mutate({ id, status: targetStatus });
    }
    setDraggedId(null);
  };

  const getName = (ref: any) => {
    if (ref.first_name || ref.last_name) {
      return `${ref.first_name || ''} ${ref.last_name || ''}`.trim();
    }
    return ref.patient_name || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <div key={col.status} className="flex-shrink-0 w-[300px] space-y-2">
            <Skeleton className="h-10 w-full" />
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
      {COLUMNS.map(col => {
        const items = grouped[col.status] || [];
        const isDropTarget = dragOverColumn === col.status;

        return (
          <div
            key={col.status}
            className={cn(
              'flex-shrink-0 w-[300px] flex flex-col rounded-lg border bg-muted/30',
              isDropTarget && 'ring-2 ring-primary/50 bg-primary/5'
            )}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => handleDrop(e, col.status)}
          >
            <div className="flex items-center justify-between p-3 border-b">
              <span className="text-sm font-semibold">{col.label}</span>
              <Badge variant="secondary" className="text-xs">{items.length}</Badge>
            </div>

            <ScrollArea className="flex-1 max-h-[calc(100vh-22rem)]">
              <div className="p-2 space-y-2">
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">Drop patients here</p>
                )}
                {items.map(ref => {
                  const isOverdue = ref.next_followup_date && isBefore(parseISO(ref.next_followup_date), today);
                  const daysSinceUpdate = ref.updated_at ? differenceInDays(today, parseISO(ref.updated_at)) : null;

                  return (
                    <Card
                      key={ref.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ref.id)}
                      onDragEnd={() => setDraggedId(null)}
                      className={cn(
                        'p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-l-4',
                        col.accent,
                        draggedId === ref.id && 'opacity-40'
                      )}
                      onClick={() => navigate(`/referral/${ref.id}`)}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-sm font-medium leading-tight">{getName(ref)}</p>
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      </div>

                      {(ref as any).pcp_company && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {(ref as any).pcp_company}
                        </p>
                      )}
                      {ref.organizations?.name && !(ref as any).pcp_company && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {ref.organizations.name}
                        </p>
                      )}

                      {ref.next_followup_date && (
                        <div className={cn(
                          'flex items-center gap-1 mt-2 text-[11px]',
                          isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
                        )}>
                          {isOverdue && <AlertCircle className="w-3 h-3" />}
                          <ArrowRight className="w-3 h-3" />
                          {format(parseISO(ref.next_followup_date), 'MMM d')}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2 gap-1 flex-wrap">
                        {ref.assigned_marketer && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <User className="w-3 h-3" />
                            {ref.assigned_marketer.split(' ')[0]}
                          </span>
                        )}
                        {daysSinceUpdate != null && (
                          <span className={cn(
                            'text-[11px]',
                            daysSinceUpdate > 14 ? 'text-amber-600 font-medium' : 'text-muted-foreground'
                          )}>
                            {daysSinceUpdate}d
                          </span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
};

export default PalliativeOutreachKanban;
