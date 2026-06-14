import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { differenceInDays, format, isPast, parseISO } from 'date-fns';
import { Search, Check, Plus, ChevronDown, X, AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
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
import LogVisitSheet from './LogVisitSheet';

const PAGE_SIZE = 25;

const STATUS_ORDER_KEY: Record<string, number> = {
  pre_referral: 0, active_conversation: 1, active_referrer: 2, contacted: 3, cold: 4, lost_inactive: 5,
};

const STATUS_OPTIONS = [
  { key: 'cold', label: 'Cold', chip: 'bg-gray-200 text-gray-800' },
  { key: 'contacted', label: 'Contacted', chip: 'bg-blue-100 text-blue-800' },
  { key: 'active_conversation', label: 'Active', chip: 'bg-teal-100 text-teal-800' },
  { key: 'pre_referral', label: 'Pre-Referral', chip: 'bg-purple-100 text-purple-800' },
  { key: 'active_referrer', label: 'Active Referrer', chip: 'bg-green-100 text-green-800' },
  { key: 'lost_inactive', label: 'Lost', chip: 'bg-red-100 text-red-800' },
];

const TIER_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'A', label: 'A — ALFs' },
  { key: 'B', label: 'B — Home Health' },
  { key: 'C', label: 'C — SNFs' },
  { key: 'D', label: 'D — Physicians' },
  { key: 'E', label: 'E — DD Homes (Deferred)' },
];

const TIER_CHIP: Record<string, string> = {
  A: 'bg-blue-100 text-blue-800 border-blue-300',
  B: 'bg-teal-100 text-teal-800 border-teal-300',
  C: 'bg-purple-100 text-purple-800 border-purple-300',
  D: 'bg-amber-100 text-amber-800 border-amber-300',
  E: 'bg-gray-100 text-gray-700 border-gray-300',
};

const RATING_CHIP: Record<string, string> = {
  A: 'bg-green-100 text-green-800 border-green-200',
  B: 'bg-teal-100 text-teal-800 border-teal-200',
  C: 'bg-gray-100 text-gray-700 border-gray-200',
  D: 'bg-gray-100 text-gray-700 border-gray-200',
};

const ANNELI_OPTIONS = [
  { key: 'not_yet', label: 'Not Yet' },
  { key: 'booked', label: 'Booked' },
  { key: 'delivered', label: 'Delivered' },
];

const anneliDisplay = (s: string | null | undefined) => {
  if (s === 'booked') return 'Booked';
  if (s === 'delivered') return '✓';
  return '—';
};

// Best-effort city extraction from address ("123 Main St, Surprise, AZ 85374")
const cityFromAddress = (addr: string | null | undefined): string => {
  if (!addr) return '';
  const parts = addr.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 3) return parts[parts.length - 2];
  if (parts.length === 2) return parts[1];
  return '';
};

const lastContactLabel = (date: string | null) => {
  if (!date) return { text: 'Never', days: Infinity };
  const days = differenceInDays(new Date(), parseISO(date));
  if (days <= 0) return { text: 'Today', days: 0 };
  if (days === 1) return { text: '1 day ago', days: 1 };
  return { text: `${days} days ago`, days };
};

const BDAccountsTab: React.FC = () => {
  const qc = useQueryClient();
  const [tier, setTier] = useState('all');
  const [statuses, setStatuses] = useState<string[]>([]);
  const [priority, setPriority] = useState('all');
  const [marketer, setMarketer] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['bd-orgs-tab'],
    queryFn: async () => {
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select(`id, name, type, address, phone, bd_tier, bd_status, account_rating,
                 last_contact_date, next_followup_date, anneli_covisit_status,
                 competitive_landscape, decision_maker_name, decision_maker_title,
                 partnership_priority_level, assigned_marketer`)
        .eq('is_active', true);
      if (error) throw error;

      const ids = (orgs || []).map((o: any) => o.id);
      const counts: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: acts } = await (supabase as any)
          .from('bd_activities')
          .select('organization_id')
          .in('organization_id', ids);
        (acts || []).forEach((a: any) => {
          counts[a.organization_id] = (counts[a.organization_id] || 0) + 1;
        });
      }
      return (orgs || []).map((o: any) => ({
        ...o,
        city: cityFromAddress(o.address),
        visit_count: counts[o.id] || 0,
      }));
    },
  });

  const marketerOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r: any) => {
      const m = (r.assigned_marketer || '').trim();
      if (m) set.add(m);
    });
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      // 'All' hides Tier E (deferred); user must explicitly select E to see them.
      .filter((a: any) => tier === 'all' ? a.bd_tier !== 'E' : a.bd_tier === tier)
      .filter((a: any) => statuses.length === 0 || statuses.includes(a.bd_status))
      .filter((a: any) => {
        if (priority === 'all') return true;
        const p = (a.partnership_priority_level || '').toLowerCase();
        return p === priority;
      })
      .filter((a: any) => marketer === 'all' || (a.assigned_marketer || '') === marketer)
      .filter((a: any) => !q
        || (a.name || '').toLowerCase().includes(q)
        || (a.city || '').toLowerCase().includes(q)
        || (a.address || '').toLowerCase().includes(q))
      .sort((a: any, b: any) => {
        const sa = STATUS_ORDER_KEY[a.bd_status] ?? 99;
        const sb = STATUS_ORDER_KEY[b.bd_status] ?? 99;
        if (sa !== sb) return sa - sb;
        const da = a.last_contact_date ? new Date(a.last_contact_date).getTime() : 0;
        const db = b.last_contact_date ? new Date(b.last_contact_date).getTime() : 0;
        return da - db;
      });
  }, [rows, tier, statuses, priority, marketer, search]);

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_OPTIONS.forEach(s => { counts[s.key] = 0; });
    filtered.forEach((a: any) => { if (counts[a.bd_status] !== undefined) counts[a.bd_status]++; });
    return counts;
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  React.useEffect(() => { setPage(0); }, [tier, statuses, priority, marketer, search]);


  const updateField = async (id: string, updates: Record<string, any>) => {
    const { error } = await supabase.from('organizations').update(updates).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Updated');
    qc.invalidateQueries({ queryKey: ['bd-orgs-tab'] });
    qc.invalidateQueries({ queryKey: ['bd-org-detail', id] });
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
                  onCheckedChange={(checked) =>
                    setStatuses(prev => checked ? [...prev, s.key] : prev.filter(x => x !== s.key))
                  }
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

          <Select value={marketer} onValueChange={setMarketer}>
            <SelectTrigger className="h-8 w-[180px] text-xs rounded-full">
              <SelectValue placeholder="Marketer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Marketers</SelectItem>
              {marketerOptions.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>


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
                  <TableHead>Name</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>BD Status</TableHead>
                  <TableHead className="text-center">Visits</TableHead>
                  <TableHead>Last Contact</TableHead>
                  <TableHead>Follow-Up Due</TableHead>
                  <TableHead className="text-center">Anneli</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((a: any) => {
                  const lc = lastContactLabel(a.last_contact_date);
                  const lcStale = lc.days > 14 && a.bd_status !== 'cold' && a.bd_status !== 'lost_inactive';
                  const followOverdue = a.next_followup_date && isPast(parseISO(a.next_followup_date));
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <button
                            className="font-medium text-primary hover:underline text-left"
                            onClick={() => setSelectedId(a.id)}
                          >
                            {a.name}
                          </button>
                          <Link
                            to={`/organizations/${a.id}`}
                            className="text-muted-foreground hover:text-primary"
                            title="Open full profile"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        {a.bd_tier ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TIER_CHIP[a.bd_tier] || 'bg-muted'}`}>
                            {a.bd_tier}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{a.city || '—'}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={a.bd_status || 'cold'}
                          onValueChange={(v) => updateField(a.id, { bd_status: v })}
                        >
                          <SelectTrigger className="h-8 w-[160px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(s => (
                              <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center">{a.visit_count}</TableCell>
                      <TableCell className={cn(lcStale && 'text-red-600 font-semibold')}>
                        {lc.text}
                      </TableCell>
                      <TableCell className={cn(followOverdue && 'text-amber-600 font-semibold')}>
                        {a.next_followup_date ? format(parseISO(a.next_followup_date), 'MMM d') : '—'}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {anneliDisplay(a.anneli_covisit_status)}
                      </TableCell>
                      <TableCell>
                        {a.account_rating ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${RATING_CHIP[a.account_rating] || 'bg-muted'}`}>
                            {a.account_rating}
                          </span>
                        ) : '—'}
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

      <AccountDetailPanel orgId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
};

/* ====================== Account Detail Panel ====================== */

const AccountDetailPanel: React.FC<{ orgId: string | null; onClose: () => void }> = ({ orgId, onClose }) => {
  const qc = useQueryClient();
  const open = !!orgId;
  const [logOpen, setLogOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const [editingDM, setEditingDM] = useState(false);
  const [dmName, setDmName] = useState('');
  const [dmTitle, setDmTitle] = useState('');
  const [headerDraft, setHeaderDraft] = useState<{ name: string; address: string; phone: string } | null>(null);

  const { data: org } = useQuery({
    queryKey: ['bd-org-detail', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from('organizations').select('*').eq('id', orgId).single();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['bd-org-activities', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('bd_activities')
        .select('*')
        .eq('organization_id', orgId)
        .order('activity_date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: refs = [] } = useQuery({
    queryKey: ['bd-org-referrals', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('id, patient_name, status, referral_date, created_at')
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any[];
    },
  });

  React.useEffect(() => {
    setNotesDraft(null);
    setEditingDM(false);
    setHeaderDraft(null);
    if (org) {
      setDmName(org.decision_maker_name || '');
      setDmTitle(org.decision_maker_title || '');
    }
  }, [org?.id]); // eslint-disable-line

  const patch = async (updates: Record<string, any>) => {
    if (!orgId) return;
    const { error } = await supabase.from('organizations').update(updates).eq('id', orgId);
    if (error) { toast.error(error.message); return false; }
    qc.invalidateQueries({ queryKey: ['bd-org-detail', orgId] });
    qc.invalidateQueries({ queryKey: ['bd-orgs-tab'] });
    return true;
  };

  const saveNotes = async () => {
    if (notesDraft === null) return;
    if (await patch({ partnership_notes: notesDraft })) toast.success('Notes saved');
    setNotesDraft(null);
  };

  const saveHeader = async () => {
    if (!headerDraft) return;
    if (await patch({
      name: headerDraft.name,
      address: headerDraft.address || null,
      phone: headerDraft.phone || null,
    })) toast.success('Saved');
    setHeaderDraft(null);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col" aria-describedby={undefined}>
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>{org?.name || 'Account'}</SheetTitle>
            <SheetDescription className="sr-only">Account detail</SheetDescription>
          </SheetHeader>

          {!org ? (
            <div className="p-6 space-y-3"><Skeleton className="h-24" /><Skeleton className="h-40" /></div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Header — inline editable */}
              <div className="space-y-3">
                {headerDraft ? (
                  <div className="space-y-2">
                    <Input value={headerDraft.name} onChange={(e) => setHeaderDraft({ ...headerDraft, name: e.target.value })} placeholder="Name" />
                    <Input value={headerDraft.address} onChange={(e) => setHeaderDraft({ ...headerDraft, address: e.target.value })} placeholder="Address" />
                    <Input value={headerDraft.phone} onChange={(e) => setHeaderDraft({ ...headerDraft, phone: e.target.value })} placeholder="Phone" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveHeader}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setHeaderDraft(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="text-left w-full text-sm text-muted-foreground space-y-0.5 hover:bg-muted/40 rounded p-2 -m-2"
                    onClick={() => setHeaderDraft({ name: org.name || '', address: org.address || '', phone: org.phone || '' })}
                  >
                    {org.address && <div>{org.address}</div>}
                    {!org.address && <div className="italic">Click to add address…</div>}
                    {org.phone && (
                      <a href={`tel:${org.phone}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:underline">{org.phone}</a>
                    )}
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Tier</label>
                    <Select value={org.bd_tier || ''} onValueChange={(v) => patch({ bd_tier: v })}>
                      <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A — ALFs</SelectItem>
                        <SelectItem value="B">B — DD Homes</SelectItem>
                        <SelectItem value="C">C — SNFs</SelectItem>
                        <SelectItem value="D">D — Physicians</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">BD Status</label>
                    <Select value={org.bd_status || 'cold'} onValueChange={(v) => patch({ bd_status: v })}>
                      <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Priority (Rating)</label>
                    <Select value={org.account_rating || ''} onValueChange={(v) => patch({ account_rating: v })}>
                      <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Anneli Co-Visit</label>
                    <Select
                      value={org.anneli_covisit_status || 'not_yet'}
                      onValueChange={(v) => patch({ anneli_covisit_status: v })}
                    >
                      <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ANNELI_OPTIONS.map(o => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
                        <Button size="sm" variant="ghost" onClick={() => {
                          setEditingDM(false);
                          setDmName(org.decision_maker_name || '');
                          setDmTitle(org.decision_maker_title || '');
                        }}>Cancel</Button>
                        <Button size="sm" onClick={async () => {
                          if (await patch({ decision_maker_name: dmName || null, decision_maker_title: dmTitle || null })) {
                            toast.success('Decision maker updated');
                          }
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
                      <div className="font-medium">{org.decision_maker_name || '—'}</div>
                      {org.decision_maker_title && (
                        <div className="text-muted-foreground">{org.decision_maker_title}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Competitive Intel */}
              {org.competitive_landscape && (
                <div className="border-l-4 border-amber-500 bg-amber-50 px-3 py-2 rounded-md">
                  <div className="text-xs font-semibold text-amber-800 uppercase mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Competitive Intel
                  </div>
                  <div className="text-sm text-amber-900 whitespace-pre-wrap">{org.competitive_landscape}</div>
                </div>
              )}

              {/* Activity Timeline */}
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
                          {a.anneli_present && <span className="w-2 h-2 rounded-full bg-purple-500" title="Anneli present" />}
                        </div>
                        {a.notes && <p className="text-muted-foreground whitespace-pre-wrap">{a.notes}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Referral History */}
              <section>
                <h3 className="text-sm font-semibold mb-3">Referral History</h3>
                {refs.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No referrals yet — this account is in the pipeline</p>
                ) : (
                  <ul className="space-y-2">
                    {refs.map(r => (
                      <li key={r.id} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{r.patient_name || 'Patient'}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.referral_date
                              ? format(parseISO(r.referral_date), 'MMM d, yyyy')
                              : format(parseISO(r.created_at), 'MMM d, yyyy')}
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
                <h3 className="text-sm font-semibold mb-2">Notes</h3>
                <Textarea
                  value={notesDraft ?? org.partnership_notes ?? ''}
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
            qc.invalidateQueries({ queryKey: ['bd-org-activities', orgId] });
            qc.invalidateQueries({ queryKey: ['bd-org-detail', orgId] });
            qc.invalidateQueries({ queryKey: ['bd-orgs-tab'] });
          }
        }}
        initial={orgId ? ({ account_id: orgId } as any) : null}
      />
    </>
  );
};

export default BDAccountsTab;
