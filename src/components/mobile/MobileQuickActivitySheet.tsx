import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MobileQuickActivitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralId: string;
  patientName: string;
}

const ACTIVITY_TYPES = [
  { value: 'phone_call', label: '📞 Call' },
  { value: 'in_person_visit', label: '🏢 Visit' },
  { value: 'voicemail', label: '📱 VM' },
  { value: 'email', label: '✉️ Email' },
  { value: 'chart_review', label: '📋 Review' },
  { value: 'other', label: '📝 Other' },
];

export function MobileQuickActivitySheet({ open, onOpenChange, referralId, patientName }: MobileQuickActivitySheetProps) {
  const { toast } = useToast();
  const { displayName } = useAuth();
  const queryClient = useQueryClient();

  const [activityType, setActivityType] = useState('phone_call');
  const [noteText, setNoteText] = useState('');
  const [nextFollowup, setNextFollowup] = useState('');

  React.useEffect(() => {
    if (open) {
      setActivityType('phone_call');
      setNoteText('');
      setNextFollowup('');
    }
  }, [open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Save to referral_activity_log
      const { error: logError } = await supabase
        .from('referral_activity_log')
        .insert({
          referral_id: referralId,
          activity_type: activityType,
          note_text: noteText.trim(),
          next_action_date: nextFollowup || null,
          created_by: displayName || 'Unknown',
        });
      if (logError) throw logError;

      // Update next_followup_date on referral if provided
      if (nextFollowup) {
        await supabase
          .from('referrals')
          .update({ next_followup_date: nextFollowup })
          .eq('id', referralId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['referral-activity-log'] });
      toast({ title: 'Activity logged', description: `Note added for ${patientName}` });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error logging activity', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-xl p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b">
          <SheetTitle className="text-lg">Log Activity</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground truncate">
            {patientName}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 py-4 space-y-4">
          <div>
            <Label className="text-sm mb-2 block">Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {ACTIVITY_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setActivityType(type.value)}
                  className={cn(
                    "px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors min-h-[44px]",
                    activityType === type.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm">Note</Label>
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="What happened?"
              rows={3}
              className="text-base"
              autoFocus
            />
          </div>

          <div>
            <Label className="text-sm">Next Follow-up Date</Label>
            <Input
              type="date"
              value={nextFollowup}
              onChange={(e) => setNextFollowup(e.target.value)}
              className="h-12"
            />
          </div>
        </div>

        <div className="px-4 pb-4 pt-2 border-t">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!noteText.trim() || saveMutation.isPending}
            className="w-full h-12 text-base"
          >
            {saveMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              'Save Activity'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
