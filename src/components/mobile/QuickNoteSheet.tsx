import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addToQueue } from '@/lib/offlineQueue';

interface QuickNoteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledOrgId?: string;
}

const ACTIVITY_TYPES = [
  { value: 'in_person_visit', label: 'Visit' },
  { value: 'phone_call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
];

export function QuickNoteSheet({ open, onOpenChange, prefilledOrgId }: QuickNoteSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [orgId, setOrgId] = useState(prefilledOrgId || '');
  const [note, setNote] = useState('');
  const [activityType, setActivityType] = useState('in_person_visit');

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setOrgId(prefilledOrgId || '');
      setNote('');
      setActivityType('in_person_visit');
    }
  }, [open, prefilledOrgId]);

  const { data: organizations } = useQuery({
    queryKey: ['organizations', 'all', 'all', 'all', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('organizations').select('id, name').order('name');
      if (error) throw error;
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        organization_id: orgId || null,
        discussion_points: note,
        interaction_type: activityType,
        completed_by: 'Current User',
        activity_date: new Date().toISOString(),
      };

      if (!navigator.onLine) {
        addToQueue({ table: 'activity_communications', payload, type: 'insert' });
        return { offline: true };
      }

      const { error } = await supabase.from('activity_communications').insert(payload);
      if (error) throw error;
      return { offline: false };
    },
    onSuccess: (result) => {
      if (result?.offline) {
        toast({ title: 'Saved offline', description: 'Will sync when reconnected.', className: 'border-yellow-500' });
      } else {
        queryClient.invalidateQueries({ queryKey: ['activities'] });
        queryClient.invalidateQueries({ queryKey: ['activity_communications'] });
        toast({ title: 'Note saved', description: 'Your quick note has been logged.', className: 'border-green-500' });
      }
      onOpenChange(false);
    },
    onError: () => {
      // If network error, try offline queue
      if (!navigator.onLine) {
        const payload = {
          organization_id: orgId || null,
          discussion_points: note,
          interaction_type: activityType,
          completed_by: 'Current User',
          activity_date: new Date().toISOString(),
        };
        addToQueue({ table: 'activity_communications', payload, type: 'insert' });
        toast({ title: 'Saved offline', description: 'Will sync when reconnected.', className: 'border-yellow-500' });
        onOpenChange(false);
      } else {
        toast({ title: 'Error saving note', variant: 'destructive' });
      }
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-xl p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="text-lg">Quick Note</SheetTitle>
          <SheetDescription className="sr-only">Log a quick activity note</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4 space-y-4">
          {/* Activity type chips */}
          <div>
            <Label className="text-sm mb-2 block">Activity Type</Label>
            <div className="flex gap-2 flex-wrap">
              {ACTIVITY_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setActivityType(type.value)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium border transition-colors min-h-[44px]",
                    activityType === type.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:bg-accent"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Organization */}
          <div>
            <Label className="text-sm">Organization</Label>
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select organization (optional)" />
              </SelectTrigger>
              <SelectContent>
                {organizations?.map((org) => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Note */}
          <div>
            <Label className="text-sm">Note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What happened during the visit?"
              rows={4}
              className="text-base"
              autoFocus
            />
          </div>

          {/* Save */}
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!note.trim() || saveMutation.isPending}
            className="w-full h-12 text-base"
          >
            {saveMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              'Save Note'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
