import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTIVITY_TYPES = [
  { value: 'phone_call', label: 'Phone Call' },
  { value: 'in_person_visit', label: 'In-Person Visit' },
  { value: 'voicemail', label: 'Voicemail Left' },
  { value: 'email', label: 'Email' },
  { value: 'chart_review', label: 'Chart Review' },
  { value: 'status_update', label: 'Status Update' },
  { value: 'other', label: 'Other' },
];

interface QuickLogActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralId: string;
  patientName: string;
}

const QuickLogActivityDialog = ({ open, onOpenChange, referralId, patientName }: QuickLogActivityDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activityType, setActivityType] = useState('phone_call');
  const [noteText, setNoteText] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState<Date | undefined>();

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('referral_activity_log')
        .insert({
          referral_id: referralId,
          activity_type: activityType,
          note_text: noteText,
          next_action_date: nextFollowupDate ? format(nextFollowupDate, 'yyyy-MM-dd') : null,
          created_by: user?.email || 'Unknown',
        });
      if (error) throw error;

      if (nextFollowupDate) {
        await supabase
          .from('referrals')
          .update({ next_followup_date: format(nextFollowupDate, 'yyyy-MM-dd') } as any)
          .eq('id', referralId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['palliative-outreach-referrals'] });
      queryClient.invalidateQueries({ queryKey: ['referral-activity-log', referralId] });
      queryClient.invalidateQueries({ queryKey: ['followups-due'] });
      toast({ title: `✅ Activity logged for ${patientName}` });
      onOpenChange(false);
      setNoteText('');
      setNextFollowupDate(undefined);
      setActivityType('phone_call');
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Log — {patientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-sm">Type</Label>
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
            <Label className="text-sm">Note</Label>
            <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Brief note..." rows={2} className="mt-1" />
          </div>
          <div>
            <Label className="text-sm">Next Follow-up Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full mt-1 justify-start text-left font-normal", !nextFollowupDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {nextFollowupDate ? format(nextFollowupDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={nextFollowupDate} onSelect={setNextFollowupDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={() => mutation.mutate()} disabled={!noteText.trim() || mutation.isPending} className="w-full gap-2">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickLogActivityDialog;
