import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, isToday, isYesterday } from 'date-fns';
import { Trash2, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import LogVisitSheet, { type BDActivityRecord } from './LogVisitSheet';

const ACTIVITY_LABELS: Record<string, string> = {
  cold_visit: 'Cold Visit',
  followup_visit: 'Follow-Up',
  call: 'Call',
  covisit_anneli: 'Co-Visit',
  in_service: 'In-Service',
  email: 'Email',
};

const OUTCOME_STYLES: Record<string, string> = {
  productive: 'bg-green-100 text-green-800 border-green-200',
  neutral: 'bg-gray-100 text-gray-800 border-gray-200',
  negative: 'bg-red-100 text-red-800 border-red-200',
  no_show: 'bg-amber-100 text-amber-800 border-amber-200',
};

const formatDate = (d: string) => {
  const date = new Date(d);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE MMM d');
};

const RecentActivityFeed: React.FC = () => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<BDActivityRecord | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['bd-recent-activity'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('bd_activities')
        .select('id, organization_id, activity_date, activity_type, anneli_present, outcome, notes, next_step, next_step_date, logged_at')
        .order('logged_at', { ascending: false })
        .limit(10);
      if (error) throw error;

      const ids = Array.from(new Set((data || []).map((r: any) => r.organization_id).filter(Boolean))) as string[];
      let accounts: Record<string, any> = {};
      if (ids.length) {
        const { data: accs } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', ids);
        (accs || []).forEach((a: any) => { accounts[a.id] = { id: a.id, account_name: a.name }; });
      }
      return (data || []).map((r: any) => ({ ...r, account: accounts[r.organization_id] }));
    },
  });

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any).from('bd_activities').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Activity deleted');
    qc.invalidateQueries({ queryKey: ['bd-recent-activity'] });
    qc.invalidateQueries({ queryKey: ['bd-weekly-dashboard'] });
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[0,1,2].map(i => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (data || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No activities logged yet</p>
          ) : (
            <ul className="divide-y">
              {data!.map((row: any) => {
                const isExpanded = expanded[row.id];
                const truncated = (row.notes || '').length > 80 && !isExpanded;
                const displayNotes = truncated ? `${row.notes.slice(0, 80)}…` : row.notes;
                return (
                  <li key={row.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditing(row)}>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">{formatDate(row.activity_date)}</span>
                          {row.account ? (
                            <Link
                              to={`/organizations/${row.account.id}`}
                              className="text-sm font-semibold text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {row.account.account_name}
                            </Link>
                          ) : (
                            <span className="text-sm font-semibold">Unknown account</span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {ACTIVITY_LABELS[row.activity_type] || row.activity_type}
                          </Badge>
                          {row.outcome && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${OUTCOME_STYLES[row.outcome] || 'bg-gray-100'}`}>
                              {row.outcome.replace('_', ' ')}
                            </span>
                          )}
                          {row.anneli_present && <Badge className="text-xs bg-purple-100 text-purple-800 border-purple-200">Anneli</Badge>}
                        </div>
                        {row.notes && (
                          <p className="text-sm text-muted-foreground">
                            {displayNotes}
                            {(row.notes || '').length > 80 && (
                              <button
                                className="ml-1 text-xs text-primary hover:underline"
                                onClick={(e) => { e.stopPropagation(); setExpanded(s => ({ ...s, [row.id]: !isExpanded })); }}
                              >
                                {isExpanded ? 'less' : 'more'}
                              </button>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(row)} aria-label="Edit">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" aria-label="Delete">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete activity?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This permanently removes the logged visit. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(row.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <LogVisitSheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)} initial={editing} />
    </>
  );
};

export default RecentActivityFeed;
