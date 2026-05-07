import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarIcon, Check, Minus, X, CircleSlash, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const ACTIVITY_TYPES = [
  { key: 'cold_visit', label: 'Cold Visit' },
  { key: 'follow_up_visit', label: 'Follow-Up Visit' },
  { key: 'call', label: 'Call' },
  { key: 'co_visit_anneli', label: 'Co-Visit w/ Anneli' },
  { key: 'in_service', label: 'In-Service/Education' },
  { key: 'email', label: 'Email' },
] as const;

const OUTCOMES = [
  { key: 'productive', label: 'Productive', icon: Check, color: 'border-green-500 text-green-700 data-[active=true]:bg-green-500 data-[active=true]:text-white' },
  { key: 'neutral', label: 'Neutral', icon: Minus, color: 'border-gray-400 text-gray-700 data-[active=true]:bg-gray-500 data-[active=true]:text-white' },
  { key: 'negative', label: 'Negative', icon: X, color: 'border-red-500 text-red-700 data-[active=true]:bg-red-500 data-[active=true]:text-white' },
  { key: 'no_show', label: 'No Show', icon: CircleSlash, color: 'border-amber-500 text-amber-700 data-[active=true]:bg-amber-500 data-[active=true]:text-white' },
] as const;

export type BDActivityRecord = {
  id?: string;
  organization_id?: string;
  activity_date?: string;
  activity_type?: string;
  anneli_present?: boolean;
  outcome?: string | null;
  notes?: string | null;
  next_step?: string | null;
  next_step_date?: string | null;
};

interface LogVisitSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: BDActivityRecord | null;
}

const todayISO = () => format(new Date(), 'yyyy-MM-dd');

const LogVisitSheet: React.FC<LogVisitSheetProps> = ({ open, onOpenChange, initial }) => {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const editing = !!initial?.id;

  const [activityDate, setActivityDate] = useState<string>(todayISO());
  const [accountId, setAccountId] = useState<string>('');
  const [accountSearchOpen, setAccountSearchOpen] = useState(false);
  const [activityType, setActivityType] = useState<string>('');
  const [anneliPresent, setAnneliPresent] = useState(false);
  const [outcome, setOutcome] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [nextStepDate, setNextStepDate] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Reset/seed form on open
  useEffect(() => {
    if (!open) return;
    setActivityDate(initial?.activity_date || todayISO());
    setAccountId(initial?.organization_id || '');
    setActivityType(initial?.activity_type || '');
    setAnneliPresent(!!initial?.anneli_present);
    setOutcome(initial?.outcome || '');
    setNotes(initial?.notes || '');
    setNextStep(initial?.next_step || '');
    setNextStepDate(initial?.next_step_date || '');
  }, [open, initial]);

  // Auto-toggle anneli_present when co-visit selected
  useEffect(() => {
    if (activityType === 'co_visit_anneli' && !anneliPresent) setAnneliPresent(true);
  }, [activityType]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: accounts = [] } = useQuery({
    queryKey: ['bd-orgs-for-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, bd_tier, address')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data || []).map((o: any) => ({
        id: o.id,
        account_name: o.name,
        tier: o.bd_tier,
        city: (o.address || '').split(',').map((s: string) => s.trim())[1] || '',
      }));
    },
    enabled: open,
  });

  const selectedAccount = useMemo(() => accounts.find(a => a.id === accountId), [accounts, accountId]);
  const isBackdated = activityDate !== todayISO();

  const handleSave = async () => {
    if (!accountId) { toast.error('Please select an organization'); return; }
    if (!activityType) { toast.error('Please select an activity type'); return; }
    if (!outcome) { toast.error('Please select an outcome'); return; }

    setSaving(true);
    try {
      const payload: any = {
        organization_id: accountId,
        activity_date: activityDate,
        activity_type: activityType,
        anneli_present: anneliPresent,
        outcome,
        notes: notes || null,
        next_step: nextStep || null,
        next_step_date: nextStepDate || null,
      };

      let error;
      if (editing && initial?.id) {
        ({ error } = await (supabase as any).from('bd_activities').update(payload).eq('id', initial.id));
      } else {
        payload.logged_at = new Date().toISOString();
        payload.logged_by_user_id = user?.id;
        ({ error } = await (supabase as any).from('bd_activities').insert(payload));
      }
      if (error) throw error;

      toast.success(editing ? 'Visit updated ✓' : 'Visit logged ✓');
      qc.invalidateQueries({ queryKey: ['bd-weekly-dashboard'] });
      qc.invalidateQueries({ queryKey: ['bd-recent-activity'] });
      qc.invalidateQueries({ queryKey: ['bd-orgs-tab'] });
      qc.invalidateQueries({ queryKey: ['bd-org-detail', accountId] });
      qc.invalidateQueries({ queryKey: ['bd-org-activities', accountId] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save visit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col h-full"
        aria-describedby={undefined}
      >
        <SheetHeader className="px-5 py-4 border-b shrink-0">
          <SheetTitle>{editing ? 'Edit Visit' : 'Log Visit'}</SheetTitle>
          <SheetDescription className="sr-only">Quickly log a business development activity.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Activity date */}
          <div className="space-y-2">
            <Label>Activity Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal h-11">
                  <CalendarIcon className="mr-2 w-4 h-4" />
                  {format(new Date(activityDate), 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={new Date(activityDate)}
                  onSelect={(d) => d && setActivityDate(format(d, 'yyyy-MM-dd'))}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
            {isBackdated && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Logging as backdated entry
              </div>
            )}
          </div>

          {/* Account */}
          <div className="space-y-2">
            <Label>Account *</Label>
            <Popover open={accountSearchOpen} onOpenChange={setAccountSearchOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal h-11">
                  {selectedAccount ? (
                    <span className="flex items-center gap-2 truncate">
                      <span className="truncate">{selectedAccount.account_name}</span>
                      {selectedAccount.tier && <Badge variant="outline" className="ml-auto">Tier {selectedAccount.tier}</Badge>}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Select account…</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
                <Command>
                  <CommandInput placeholder="Search by name or city…" />
                  <CommandList>
                    <CommandEmpty>No accounts found</CommandEmpty>
                    <CommandGroup>
                      {accounts.map((a) => (
                        <CommandItem
                          key={a.id}
                          value={`${a.account_name} ${a.city || ''}`}
                          onSelect={() => { setAccountId(a.id); setAccountSearchOpen(false); }}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className="font-medium truncate">{a.account_name}</span>
                            {a.tier && <Badge variant="outline" className="text-xs">T{a.tier}</Badge>}
                            {a.city && <span className="ml-auto text-xs text-muted-foreground">{a.city}</span>}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Activity Type */}
          <div className="space-y-2">
            <Label>Activity Type *</Label>
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITY_TYPES.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActivityType(t.key)}
                  className={cn(
                    'min-h-[48px] rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors touch-manipulation',
                    activityType === t.key
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Anneli */}
          <div className="flex items-center justify-between border rounded-lg px-4 py-3">
            <div>
              <Label className="cursor-pointer">Anneli Present</Label>
              <p className="text-xs text-muted-foreground">Auto-on for co-visits</p>
            </div>
            <Switch checked={anneliPresent} onCheckedChange={setAnneliPresent} />
          </div>

          {/* Outcome */}
          <div className="space-y-2">
            <Label>Outcome *</Label>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOMES.map(o => {
                const Icon = o.icon;
                const active = outcome === o.key;
                return (
                  <button
                    key={o.key}
                    type="button"
                    data-active={active}
                    onClick={() => setOutcome(o.key)}
                    className={cn(
                      'min-h-[56px] rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-2 touch-manipulation',
                      o.color
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Who did you meet? Key takeaways? Next step?"
              rows={3}
            />
          </div>

          {/* Next step */}
          <div className="space-y-2">
            <Label>Next Step</Label>
            <Input
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              placeholder="e.g. Bring brochures, follow up with DON"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal h-11">
                  <CalendarIcon className="mr-2 w-4 h-4" />
                  {nextStepDate ? format(new Date(nextStepDate), 'PPP') : <span className="text-muted-foreground">Next step date (optional)</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={nextStepDate ? new Date(nextStepDate) : undefined}
                  onSelect={(d) => setNextStepDate(d ? format(d, 'yyyy-MM-dd') : '')}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <SheetFooter className="px-5 py-4 border-t shrink-0 flex-row gap-2">
          <Button variant="outline" className="flex-1 h-11" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button className="flex-1 h-11" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editing ? 'Save Changes' : 'Log Visit'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default LogVisitSheet;
