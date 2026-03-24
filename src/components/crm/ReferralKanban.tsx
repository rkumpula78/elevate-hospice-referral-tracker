import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { notifyStatusChange } from '@/lib/webhookNotifier';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getStatusBadgeColor, getStatusLabel } from '@/lib/constants';
import { differenceInDays, parseISO } from 'date-fns';
import { ChevronDown, ChevronRight, GripVertical, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const KANBAN_COLUMNS = [
  { status: 'new_referral', label: 'New Referral' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'assessment_scheduled', label: 'Assessment Scheduled' },
  { status: 'palliative_outreach', label: 'Palliative Outreach' },
  { status: 'admitted', label: 'Admitted' },
  { status: 'closed', label: 'Closed' },
] as const;

interface ReferralKanbanProps {
  referrals: any[];
}

const ReferralKanban = ({ referrals }: ReferralKanbanProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(() => new Set());

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('referrals')
        .update({ status: status as any, deleted_at: undefined } as any)
        .eq('id', id)
        .is('deleted_at', null);
      if (error) throw error;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ['referrals-kanban'] });
      const previous = queryClient.getQueryData(['referrals-kanban']);
      queryClient.setQueryData(['referrals-kanban'], (old: any[]) =>
        old?.map(r => r.id === vars.id ? { ...r, status: vars.status, updated_at: new Date().toISOString() } : r) ?? []
      );
      return { previous };
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['referrals-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['palliative-outreach-count'] });
      toast({ title: `✅ Moved to ${getStatusLabel(vars.status)}` });
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['referrals-kanban'], context.previous);
      }
      toast({ title: 'Failed to update status', variant: 'destructive' });
    },
  });

  const grouped = KANBAN_COLUMNS.reduce<Record<string, any[]>>((acc, col) => {
    acc[col.status] = referrals.filter(r => r.status === col.status);
    return acc;
  }, {});

  // Also count referrals in statuses not shown in kanban columns
  const otherStatuses = ['not_appropriate', 'declined', 'lost_to_followup', 'pending'];
  const closedItems = [
    ...grouped['closed'],
    ...referrals.filter(r => otherStatuses.includes(r.status)),
  ];
  grouped['closed'] = closedItems;

  const toggleCollapse = (status: string) => {
    setCollapsedColumns(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

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

  const handleDragLeave = () => {
    setDragOverColumn(null);
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

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverColumn(null);
  };

  const today = new Date();

  const getPriorityIndicator = (priority: string | null) => {
    if (priority === 'urgent') return 'border-l-4 border-l-red-500';
    if (priority === 'routine') return 'border-l-4 border-l-blue-400';
    return 'border-l-4 border-l-transparent';
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
      {KANBAN_COLUMNS.map(col => {
        const items = grouped[col.status] || [];
        const isCollapsed = collapsedColumns.has(col.status);
        const isDropTarget = dragOverColumn === col.status;

        return (
          <div
            key={col.status}
            className={cn(
              'flex-shrink-0 w-[280px] flex flex-col rounded-lg border bg-muted/30',
              isDropTarget && 'ring-2 ring-primary/50 bg-primary/5'
            )}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.status)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2">
                {col.status === 'closed' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => toggleCollapse(col.status)}
                  >
                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </Button>
                )}
                <span className="text-sm font-semibold">{col.label}</span>
              </div>
              <Badge variant="secondary" className="text-xs">{items.length}</Badge>
            </div>

            {/* Column body */}
            {!(col.status === 'closed' && isCollapsed) && (
              <ScrollArea className="flex-1 max-h-[calc(100vh-20rem)]">
                <div className="p-2 space-y-2">
                  {items.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">No referrals</p>
                  )}
                  {items.map(ref => {
                    const daysInStage = ref.updated_at
                      ? differenceInDays(today, parseISO(ref.updated_at))
                      : null;

                    return (
                      <Card
                        key={ref.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ref.id)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          'p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow',
                          getPriorityIndicator(ref.priority),
                          draggedId === ref.id && 'opacity-40'
                        )}
                        onClick={() => navigate(`/referral/${ref.id}`)}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-sm font-medium leading-tight">{ref.patient_name}</p>
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        </div>

                        {ref.organizations?.name && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {ref.organizations.name}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-2 gap-1 flex-wrap">
                          {ref.assigned_marketer && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <User className="w-3 h-3" />
                              {ref.assigned_marketer.split(' ')[0]}
                            </span>
                          )}
                          {daysInStage != null && (
                            <span className={cn(
                              'text-[11px]',
                              daysInStage > 7 ? 'text-amber-600 font-medium' : 'text-muted-foreground'
                            )}>
                              {daysInStage}d in stage
                            </span>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ReferralKanban;
