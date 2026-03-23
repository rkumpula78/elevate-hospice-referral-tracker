import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Phone, Eye, Voicemail, Mail, FileText, RefreshCw, MoreHorizontal, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTIVITY_TYPES = [
  { value: 'phone_call', label: 'Phone Call', icon: Phone },
  { value: 'in_person_visit', label: 'In-Person Visit', icon: Eye },
  { value: 'voicemail', label: 'Voicemail Left', icon: Voicemail },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'chart_review', label: 'Chart Review', icon: FileText },
  { value: 'status_update', label: 'Status Update', icon: RefreshCw },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
] as const;

const getTypeIcon = (type: string) => {
  const found = ACTIVITY_TYPES.find(t => t.value === type);
  return found ? found.icon : MoreHorizontal;
};

const getTypeLabel = (type: string) => {
  return ACTIVITY_TYPES.find(t => t.value === type)?.label || type;
};

interface ReferralActivityLogProps {
  referralId: string;
}

const ReferralActivityLog = ({ referralId }: ReferralActivityLogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [activityType, setActivityType] = useState('phone_call');
  const [noteText, setNoteText] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState<Date | undefined>();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['referral-activity-log', referralId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_activity_log')
        .select('*')
        .eq('referral_id', referralId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('referral_activity_log')
        .insert({
          referral_id: referralId,
          activity_type: activityType,
          note_text: noteText,
          next_action: nextAction || null,
          next_action_date: nextActionDate ? format(nextActionDate, 'yyyy-MM-dd') : null,
          created_by: user?.email || 'Unknown',
        });
      if (error) throw error;

      // If next_action_date is set, update the referral's next_followup_date
      if (nextActionDate) {
        await supabase
          .from('referrals')
          .update({ next_followup_date: format(nextActionDate, 'yyyy-MM-dd') } as any)
          .eq('id', referralId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-activity-log', referralId] });
      queryClient.invalidateQueries({ queryKey: ['referral', referralId] });
      toast({ title: '✅ Activity logged' });
      setShowForm(false);
      setNoteText('');
      setNextAction('');
      setNextActionDate(undefined);
      setActivityType('phone_call');
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          Activity Log
        </CardTitle>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
          <Plus className="w-4 h-4" />
          Log Activity
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Activity Type</Label>
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Next Action Date (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full mt-1 justify-start text-left font-normal", !nextActionDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {nextActionDate ? format(nextActionDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={nextActionDate} onSelect={setNextActionDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label className="text-sm">Note</Label>
              <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="What happened during this interaction..." rows={3} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Next Action (optional)</Label>
              <Input value={nextAction} onChange={e => setNextAction(e.target.value)} placeholder="e.g., Call back in 2 weeks to reassess" className="mt-1" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={() => addMutation.mutate()} disabled={!noteText.trim() || addMutation.isPending}>
                {addMutation.isPending ? 'Saving...' : 'Save Activity'}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading activities...</p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No activities logged yet. Click "Log Activity" to add the first entry.</p>
        ) : (
          <div className="space-y-3">
            {activities.map((a: any) => {
              const Icon = getTypeIcon(a.activity_type);
              return (
                <div key={a.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 rounded-md bg-muted">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{getTypeLabel(a.activity_type)}</Badge>
                          <span className="text-xs text-muted-foreground">{a.created_by}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{format(new Date(a.created_at), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{a.note_text}</p>
                      {a.next_action && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="font-medium">Next:</span> {a.next_action}
                          {a.next_action_date && ` · Due ${format(new Date(a.next_action_date), 'MMM d, yyyy')}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralActivityLog;
