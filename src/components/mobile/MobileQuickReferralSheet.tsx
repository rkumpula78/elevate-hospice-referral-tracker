import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addToQueue } from '@/lib/offlineQueue';

interface MobileQuickReferralSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRIORITIES = [
  { value: 'routine', label: 'Routine' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'low', label: 'Low' },
];

export function MobileQuickReferralSheet({ open, onOpenChange }: MobileQuickReferralSheetProps) {
  const { toast } = useToast();
  const { displayName } = useAuth();
  const queryClient = useQueryClient();

  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [orgId, setOrgId] = useState('');
  const [priority, setPriority] = useState('routine');
  const [note, setNote] = useState('');

  React.useEffect(() => {
    if (open) {
      setPatientName('');
      setPhone('');
      setOrgId('');
      setPriority('routine');
      setNote('');
    }
  }, [open]);

  const { data: organizations } = useQuery({
    queryKey: ['organizations-list-mobile'],
    queryFn: async () => {
      const { data, error } = await supabase.from('organizations').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        patient_name: patientName.trim(),
        patient_phone: phone.trim() || null,
        organization_id: orgId || null,
        priority,
        notes: note.trim() || null,
        status: 'new_referral',
        referral_date: new Date().toISOString(),
        assigned_marketer: displayName || null,
        benefit_period_number: 1,
      };

      if (!navigator.onLine) {
        addToQueue({ table: 'referrals', payload, type: 'insert' });
        return { offline: true };
      }

      const { error } = await supabase.from('referrals').insert(payload);
      if (error) throw error;
      return { offline: false };
    },
    onSuccess: (result) => {
      if (result?.offline) {
        toast({ title: 'Saved offline', description: 'Will sync when reconnected.' });
      } else {
        queryClient.invalidateQueries({ queryKey: ['referrals'] });
        toast({ title: 'Referral added', description: `${patientName} has been added.` });
      }
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error saving referral', description: error.message, variant: 'destructive' });
    },
  });

  const canSave = patientName.trim().length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-xl p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b">
          <SheetTitle className="text-lg">Quick Add Referral</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Add essential info now, complete details later
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 py-4 space-y-4 overflow-y-auto">
          <div>
            <Label className="text-sm">Patient Name <span className="text-destructive">*</span></Label>
            <Input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="First Last"
              className="h-12 text-base"
              autoFocus
            />
          </div>

          <div>
            <Label className="text-sm">Phone</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="h-12 text-base"
            />
          </div>

          <div>
            <Label className="text-sm">Referral Source</Label>
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations?.map((org) => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm">Priority</Label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    "flex-1 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors min-h-[44px]",
                    priority === p.value
                      ? p.value === 'urgent'
                        ? "bg-destructive text-destructive-foreground border-destructive"
                        : "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm">Brief Note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Quick context about this referral..."
              rows={2}
              className="text-base"
            />
          </div>
        </div>

        <div className="px-4 pb-4 pt-2 border-t">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!canSave || saveMutation.isPending}
            className="w-full h-12 text-base"
          >
            {saveMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              'Save Referral'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
