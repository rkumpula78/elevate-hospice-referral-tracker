import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { differenceInDays, format, isPast, parseISO } from 'date-fns';
import { Search, Check, Plus, ChevronDown, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import LogVisitSheet from './LogVisitSheet';

const STATUS_ORDER_KEY: Record<string, number> = {
  pre_referral: 0, active_conversation: 1, active_referrer: 2, contacted: 3, cold: 4, lost_inactive: 5,
};

const STATUS_OPTIONS = [
  { key: 'cold', label: 'Cold', chip: 'bg-gray-200 text-gray-800' },
  { key: 'contacted', label: 'Contacted', chip: 'bg-blue-100 text-blue-800' },
  { key: 'active_conversation', label: 'Active Conversation', chip: 'bg-teal-100 text-teal-800' },
  { key: 'pre_referral', label: 'Pre-Referral', chip: 'bg-purple-100 text-purple-800' },
  { key: 'active_referrer', label: 'Active Referrer', chip: 'bg-green-100 text-green-800' },
  { key: 'lost_inactive', label: 'Lost / Inactive', chip: 'bg-red-100 text-red-800' },
];
const STATUS_BY_KEY = Object.fromEntries(STATUS_OPTIONS.map(s => [s.key, s]));

const TIER_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'A', label: 'A - ALFs' },
  { key: 'B', label: 'B - Home Health' },
  { key: 'C', label: 'C - SNFs' },
  { key: 'D', label: 'D - Physicians' },
  { key: 'E', label: 'E - DD Homes (Deferred)' },
];

const TIER_CHIP: Record<string, string> = {
  A: 'bg-amber-100 text-amber-800 border-amber-300',
  B: 'bg-blue-100 text-blue-800 border-blue-300',
  C: 'bg-teal-100 text-teal-800 border-teal-300',
  D: 'bg-purple-100 text-purple-800 border-purple-300',
  E: 'bg-gray-100 text-gray-700 border-gray-300',
};

const PRIORITY_CHIP: Record<string, string> = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-gray-100 text-gray-700 border-gray-200',
};

const PAGE_SIZE = 25;

const lastVisitLabel = (date: string | null) => {
  if (!date) return { text: 'Never', stale: true };
  const days = differenceInDays(new Date(), parseISO(date));
  if (days <= 0) return { text: 'Today', stale: false };
  if (days === 1) return { text: '1 day ago', stale: false };
  return { text: `${days} days ago`, stale: days > 14 };
};

const BDAccountsTab: React.FC = () => {
  const qc = useQueryClient();
  const [tier, setTier] = useState('all');
  const [statuses, setStatuses] = useState<string[]>([]);
  const [priority, setPriority] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ['bd-accounts-tab'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('bd_accounts').select('*');
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data
      .filter(a => tier === 'all' || a.tier === tier)
      .filter(a => statuses.length === 0 || statuses.includes(a.status))
      .filter(a => priority === 'all' || a.priority === priority)
      .filter(a => !q
        || (a.account_name || '').toLowerCase().includes(q)
        || (a.city || '').toLowerCase().includes(q))
      .sort((a, b) => {
        const sa = STATUS_ORDER_KEY[a.status] ?? 99;
        const sb = STATUS_ORDER_KEY[b.status] ?? 99;
        if (sa !== sb) return sa - sb;
        const da = a.last_visit_date ? new Date(a.last_visit_date).getTime() : 0;
        const db = b.last_visit_date ? new Date(b.last_visit_date).getTime() : 0;
        return da - db;
      });
  }, [data, tier, statuses, priority, search]);

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_OPTIONS.forEach(s => { counts[s.key] = 0; });
    filtered.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });
    return counts;
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  React.useEffect(() => { setPage(0); }, [tier, statuses, priority, search]);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await (supabase as any).from('bd_accounts').update({ status: newStatus }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Status updated');
    qc.invalidateQueries({ queryKey: ['bd-accounts-tab'] });
    qc.invalidateQueries({ queryKey: ['bd-weekly-dashboard'] });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {TIER_FILTERS.map(t => (
            <Button
              key={t.key}
              size="sm"
              variant={tier === t.key ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setTier(t.key)}
            >
              {t.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="rounded-full">
                Status {statuses.length > 0 && <Badge variant="secondary" className="ml-2">{statuses.length}</Badge>}
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {STATUS_OPTIONS.map(s => (
                <DropdownMenuCheckboxItem
                  key={s.key}
                  checked={statuses.includes(s.key)}
                  onCheckedChange={(checked) => {
                    setStatuses(prev => checked ? [...prev, s.key] : prev.filter(x => x !== s.key));
                  }}
                >
                  {s.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {statuses.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setStatuses([])}>
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
          )}

          {['all', 'high', 'medium', 'low'].map(p => (
            <Button
              key={p}
              size="sm"
              variant={priority === p ? 'default' : 'outline'}
              className="rounded-full capitalize"
              onClick={() => setPriority(p)}
            >
              {p}
            </Button>
          ))}

          <div className="relative flex-1 min-w-[200px] max-w-sm ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or city…"
              className="pl-9"
            />
          </div>
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(s => (
            <span key={s.key} className={`text-xs px-2.5 py-1 rounded-full ${s.chip}`}>
              {s.label}: <strong>{summary[s.key] || 0}</strong>
            </span>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">{[0,1,2,3].map(i => <Skeleton key={i} className="h-10" />)}</div>
          ) : pageRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No accounts match these filters</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Next Step</TableHead>
                  <TableHead className="text-center">Anneli</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map(a => {
                  const lv = lastVisitLabel(a.last_visit_date);
                  const lvHighlight = lv.stale && a.status !== 'cold' && a.status !== 'lost_inactive';
                  const nextOverdue = a.next_step_date && isPast(parseISO(a.next_step_date));
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/40">
                      <TableCell>
                        <button
                          className="font-medium text-primary hover:underline text-left"
                          onClick={() => setSelectedId(a.id)}
                        >
                          {a.account_name}
                        </button>
                      </TableCell>
                      <TableCell>
                        {a.tier ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TIER_CHIP[a.tier] || 'bg-muted'}`}>
                            {a.tier}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{a.city || '—'}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select value={a.status} onValueChange={(v) => updateStatus(a.id, v)}>
                          <SelectTrigger className="h-8 w-[170px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(s => (
                              <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className={cn(lvHighlight && 'text-red-600 font-semibold')}>
                        {lv.text}
                      </TableCell>
                      <TableCell className={cn(nextOverdue && 'text-amber-600 font-semibold')}>
                        {a.next_step_date ? format(parseISO(a.next_step_date), 'MMM d') : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {a.anneli_covisit_status === 'completed' || a.anneli_covisit_status === 'yes'
                          ? <Check className="w-4 h-4 text-green-600 inline" />
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${PRIORITY_CHIP[a.priority] || 'bg-muted'}`}>
                          {a.priority || '—'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <AccountDetailPanel
        accountId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
};

/* ====================== Account Detail Panel ====================== */

const AccountDetailPanel: React.FC<{ accountId: string | null; onClose: () => void }> = ({ accountId, onClose }) => {
  const qc = useQueryClient();
  const open = !!accountId;
  const [logOpen, setLogOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [orgSearch, setOrgSearch] = useState('');
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const [editingDM, setEditingDM] = useState(false);
  const [dmName, setDmName] = useState('');
  const [dmTitle, setDmTitle] = useState('');

  const { data: account } = useQuery({
    queryKey: ['bd-account-detail', accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('bd_accounts').select('*').eq('id', accountId).single();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['bd-account-activities', accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('bd_activities')
        .select('*')
        .eq('account_id', accountId)
        .order('activity_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: refs = [] } = useQuery({
    queryKey: ['bd-account-referrals', account?.referring_org_id],
    enabled: !!account?.referring_org_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('id, patient_name, status, referral_date, created_at')
        .eq('organization_id', account.referring_org_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: orgOptions = [] } = useQuery({
    queryKey: ['bd-org-search', orgSearch],
    enabled: linkOpen,
    queryFn: async () => {
      let q = supabase.from('organizations').select('id, name, type').eq('is_active', true).limit(50);
      if (orgSearch.trim()) q = q.ilike('name', `%${orgSearch.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

  React.useEffect(() => {
    setNotesDraft(null);
    setEditingDM(false);
    if (account) {
      setDmName(account.decision_maker_name || '');
      setDmTitle(account.decision_maker_title || '');
    }
  }, [account?.id]); // eslint-disable-line

  const patch = async (updates: Record<string, any>) => {
    if (!accountId) return;
    const { error } = await (supabase as any).from('bd_accounts').update(updates).eq('id', accountId);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ['bd-account-detail', accountId] });
    qc.invalidateQueries({ queryKey: ['bd-accounts-tab'] });
  };

  const saveNotes = async () => {
    if (notesDraft === null) return;
    await patch({ notes: notesDraft });
    toast.success('Notes saved');
    setNotesDraft(null);
  };

  const linkOrg = async (orgId: string) => {
    await patch({ referring_org_id: orgId });
    toast.success('Organization linked');
    setLinkOpen(false);
    qc.invalidateQueries({ queryKey: ['bd-account-referrals'] });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col" aria-describedby={undefined}>
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>{account?.account_name || 'Account'}</SheetTitle>
            <SheetDescription className="sr-only">Account detail</SheetDescription>
          </SheetHeader>

          {!account ? (
            <div className="p-6 space-y-3"><Skeleton className="h-24" /><Skeleton className="h-40" /></div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Header */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {account.tier && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TIER_CHIP[account.tier] || ''}`}>
                      Tier {account.tier}
                    </span>
                  )}
                  {account.account_type && <Badge variant="outline">{account.account_type}</Badge>}
                </div>
                <div className="text-sm text-muted-foreground space-y-0.5">
                  {account.address && <div>{account.address}</div>}
                  {account.city && <div>{account.city}</div>}
                  {account.phone && (
                    <a href={`tel:${account.phone}`} className="text-blue-600 hover:underline">{account.phone}</a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Status</label>
                    <Select value={account.status} onValueChange={(v) => patch({ status: v })}>
                      <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Priority</label>
                    <div className="flex gap-1 mt-1">
                      {['high', 'medium', 'low'].map(p => (
                        <Button
                          key={p}
                          size="sm"
                          variant={account.priority === p ? 'default' : 'outline'}
                          className="capitalize flex-1"
                          onClick={() => patch({ priority: p })}
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Decision maker */}
                <div className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Decision Maker</span>
                    {!editingDM ? (
                      <Button size="sm" variant="ghost" onClick={() => setEditingDM(true)}>Edit</Button>
                    ) : (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingDM(false); setDmName(account.decision_maker_name || ''); setDmTitle(account.decision_maker_title || ''); }}>Cancel</Button>
                        <Button size="sm" onClick={async () => {
                          await patch({ decision_maker_name: dmName || null, decision_maker_title: dmTitle || null });
                          toast.success('Decision maker updated');
                          setEditingDM(false);
                        }}>Save</Button>
                      </div>
                    )}
                  </div>
                  {editingDM ? (
                    <div className="space-y-2">
                      <Input value={dmName} onChange={(e) => setDmName(e.target.value)} placeholder="Name" />
                      <Input value={dmTitle} onChange={(e) => setDmTitle(e.target.value)} placeholder="Title" />
                    </div>
                  ) : (
                    <div className="text-sm">
                      <div className="font-medium">{account.decision_maker_name || '—'}</div>
                      {account.decision_maker_title && (
                        <div className="text-muted-foreground">{account.decision_maker_title}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Competitive risk */}
              {account.competitive_risk && (
                <div className="border-l-4 border-yellow-500 bg-yellow-50 px-3 py-2 rounded-md">
                  <div className="text-xs font-semibold text-yellow-800 uppercase mb-1">Competitive Risk</div>
                  <div className="text-sm text-yellow-900">{account.competitive_risk}</div>
                </div>
              )}

              {/* Activity timeline */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Activity Timeline</h3>
                  <Button size="sm" onClick={() => setLogOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Log Visit
                  </Button>
                </div>
                {activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No activities logged yet</p>
                ) : (
                  <ul className="space-y-2">
                    {activities.map(a => (
                      <li key={a.id} className="border rounded-md p-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            {format(parseISO(a.activity_date), 'MMM d, yyyy')}
                          </span>
                          <Badge variant="outline" className="text-xs">{a.activity_type?.replace(/_/g, ' ')}</Badge>
                          {a.outcome && (
                            <span className={cn(
                              'text-xs px-2 py-0.5 rounded-full border',
                              a.outcome === 'productive' && 'bg-green-100 text-green-800 border-green-200',
                              a.outcome === 'neutral' && 'bg-gray-100 text-gray-800 border-gray-200',
                              a.outcome === 'negative' && 'bg-red-100 text-red-800 border-red-200',
                              a.outcome === 'no_show' && 'bg-amber-100 text-amber-800 border-amber-200',
                            )}>{a.outcome.replace('_', ' ')}</span>
                          )}
                          {a.anneli_present && <Badge className="text-xs bg-purple-100 text-purple-800 border-purple-200">Anneli</Badge>}
                        </div>
                        {a.notes && <p className="text-muted-foreground">{a.notes}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Referral attribution */}
              <section>
                <h3 className="text-sm font-semibold mb-3">
                  Referral Attribution {account.referring_org_id && <span className="text-muted-foreground font-normal">({refs.length})</span>}
                </h3>
                {!account.referring_org_id ? (
                  <Popover open={linkOpen} onOpenChange={setLinkOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">Link to CRM Organization</Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[320px]" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput placeholder="Search organizations…" value={orgSearch} onValueChange={setOrgSearch} />
                        <CommandList>
                          <CommandEmpty>No matches</CommandEmpty>
                          <CommandGroup>
                            {orgOptions.map(o => (
                              <CommandItem key={o.id} value={o.id} onSelect={() => linkOrg(o.id)}>
                                <div>
                                  <div className="font-medium">{o.name}</div>
                                  {o.type && <div className="text-xs text-muted-foreground">{o.type}</div>}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                ) : refs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No referrals attributed yet</p>
                ) : (
                  <ul className="space-y-2">
                    {refs.map(r => (
                      <li key={r.id} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{r.patient_name || `Patient — ${r.referral_date || format(parseISO(r.created_at), 'MMM d')}`}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.referral_date ? format(parseISO(r.referral_date), 'MMM d, yyyy') : format(parseISO(r.created_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">{(r.status || '').replace(/_/g, ' ')}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Notes */}
              <section>
                <h3 className="text-sm font-semibold mb-2">Notes / Intel</h3>
                <Textarea
                  value={notesDraft ?? account.notes ?? ''}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  onBlur={saveNotes}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveNotes(); }}
                  placeholder="Click to add notes…"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">Saves on blur or ⌘/Ctrl+Enter</p>
              </section>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <LogVisitSheet
        open={logOpen}
        onOpenChange={(o) => {
          setLogOpen(o);
          if (!o) {
            qc.invalidateQueries({ queryKey: ['bd-account-activities', accountId] });
            qc.invalidateQueries({ queryKey: ['bd-account-detail', accountId] });
          }
        }}
        initial={accountId ? { account_id: accountId } : null}
      />
    </>
  );
};

export default BDAccountsTab;
