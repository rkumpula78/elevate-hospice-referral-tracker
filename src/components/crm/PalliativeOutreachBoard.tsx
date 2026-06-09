import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SortHeader } from '@/components/ui/sort-header';
import { differenceInDays, format, parseISO, isBefore } from 'date-fns';
import { FOLLOWUP_FREQUENCIES, LOCATION_TYPES, getStatusBadgeColor, getStatusLabel } from '@/lib/constants';
import { AlertCircle, Clock, Pencil, Search, X as XIcon } from 'lucide-react';
import QuickLogActivityDialog from '@/components/crm/QuickLogActivityDialog';
import InlineStatusNote from '@/components/crm/InlineStatusNote';
import { useDebounce } from '@/hooks/useDebounce';
import { ReferralsFilterBar, ReferralFilters } from '@/components/crm/ReferralsFilterBar';

const PALLIATIVE_STATUSES = ['palliative_outreach', 'not_appropriate', 'declined', 'lost_to_followup', 'closed', 'admitted'];

const PALLIATIVE_STATUS_OPTIONS = [
  { label: 'Palliative Outreach', value: 'palliative_outreach' },
  { label: 'Not Appropriate', value: 'not_appropriate' },
  { label: 'Declined', value: 'declined' },
  { label: 'Lost to Follow-up', value: 'lost_to_followup' },
  { label: 'Closed', value: 'closed' },
  { label: 'Converted to Hospice', value: 'admitted' },
];

const PalliativeOutreachBoard = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ReferralFilters>({
    statuses: [],
    priorities: [],
    facilities: [],
    insurances: [],
    marketers: [],
    dateRange: undefined,
  });
  const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({ field: 'next_followup_date', direction: 'asc' });
  const [quickLogRef, setQuickLogRef] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['palliative-outreach-referrals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('id, patient_name, assigned_marketer, pcp_provider, pcp_company, next_followup_date, followup_frequency, location_type, location_city, status, notes, patient_status_note, updated_at, priority, insurance, organization_id, referral_date, organizations(name)')
        .is('deleted_at', null)
        .in('status', PALLIATIVE_STATUSES as any[])
        .order('next_followup_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    return referrals.filter((r: any) => {
      if (filters.statuses.length > 0 && !filters.statuses.includes(r.status)) return false;
      if (filters.priorities.length > 0 && !filters.priorities.includes(r.priority)) return false;
      if (filters.facilities.length > 0 && !filters.facilities.includes(r.organization_id)) return false;
      if (filters.insurances.length > 0 && !filters.insurances.includes(r.insurance)) return false;
      if (filters.marketers.length > 0 && !filters.marketers.includes(r.assigned_marketer)) return false;
      if (filters.dateRange?.from && r.referral_date && new Date(r.referral_date) < filters.dateRange.from) return false;
      if (filters.dateRange?.to && r.referral_date && new Date(r.referral_date) > filters.dateRange.to) return false;
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase();
        const haystack = [
          r.patient_name, r.assigned_marketer, r.pcp_provider,
          r.pcp_company, r.location_city, r.notes, r.patient_status_note,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [referrals, filters, debouncedSearch]);

  const sorted = [...filtered].sort((a: any, b: any) => {
    const dir = sort.direction === 'asc' ? 1 : -1;
    const aVal = a[sort.field];
    const bVal = b[sort.field];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    return aVal < bVal ? -dir : aVal > bVal ? dir : 0;
  });

  const handleSort = (field: string) => {
    setSort(prev => prev.field === field ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { field, direction: 'asc' });
  };

  const today = new Date();

  const getLastNote = (notes: string | null): string => {
    if (!notes) return '—';
    try {
      const parsed = JSON.parse(notes);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const last = parsed[parsed.length - 1];
        const text = last.text || '';
        return text.length > 40 ? text.slice(0, 40) + '…' : text;
      }
    } catch { /* ignore */ }
    return notes.length > 40 ? notes.slice(0, 40) + '…' : notes;
  };

  const getLocationLabel = (type: string | null) => LOCATION_TYPES.find(l => l.value === type)?.label || type || '—';
  const getFrequencyLabel = (freq: string | null) => FOLLOWUP_FREQUENCIES.find(f => f.value === freq)?.label || freq || '—';

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by patient, marketer, PCP, company, city, or notes... (Ctrl+K)"
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Pipeline-style filter bar */}
      <ReferralsFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={referrals.length}
        filteredCount={filtered.length}
        statusOptions={PALLIATIVE_STATUS_OPTIONS}
        showQuickPresets={false}
      />

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No palliative outreach patients found.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortHeader label="Patient Name" field="patient_name" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead><SortHeader label="Assigned To" field="assigned_marketer" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead>PCP Provider</TableHead>
                <TableHead><SortHeader label="Primary Care Co." field="pcp_company" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead><SortHeader label="Next Follow-up" field="next_followup_date" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="min-w-[220px]">Patient Status</TableHead>
                <TableHead>Last Note</TableHead>
                <TableHead><SortHeader label="Days Since Update" field="updated_at" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead className="w-[80px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((ref: any) => {
                const isOverdue = ref.next_followup_date && isBefore(parseISO(ref.next_followup_date), today);
                const daysSinceUpdate = ref.updated_at ? differenceInDays(today, parseISO(ref.updated_at)) : null;

                return (
                  <TableRow
                    key={ref.id}
                    className={`cursor-pointer ${isOverdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-muted/50'}`}
                    onClick={() => navigate(`/referral/${ref.id}`)}
                  >
                    <TableCell className="font-medium">{ref.patient_name}</TableCell>
                    <TableCell>{ref.assigned_marketer || '—'}</TableCell>
                    <TableCell>{ref.pcp_provider || '—'}</TableCell>
                    <TableCell>{ref.pcp_company || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isOverdue && <AlertCircle className="w-4 h-4 text-red-500" />}
                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          {ref.next_followup_date ? format(parseISO(ref.next_followup_date), 'MMM d, yyyy') : '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getFrequencyLabel(ref.followup_frequency)}</TableCell>
                    <TableCell>
                      {ref.location_type ? (
                        <span>{getLocationLabel(ref.location_type)}{ref.location_city ? ` · ${ref.location_city}` : ''}</span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(ref.status)}>{getStatusLabel(ref.status)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[280px] align-top">
                      <InlineStatusNote
                        referralId={ref.id}
                        value={ref.patient_status_note}
                        invalidateKeys={[['palliative-outreach-referrals']]}
                      />
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{getLastNote(ref.notes)}</TableCell>
                    <TableCell>{daysSinceUpdate != null ? `${daysSinceUpdate}d` : '—'}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-xs"
                        onClick={(e) => { e.stopPropagation(); setQuickLogRef({ id: ref.id, name: ref.patient_name }); }}
                      >
                        <Pencil className="w-3 h-3" />
                        Log
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {quickLogRef && (
        <QuickLogActivityDialog
          open={!!quickLogRef}
          onOpenChange={(open) => { if (!open) setQuickLogRef(null); }}
          referralId={quickLogRef.id}
          patientName={quickLogRef.name}
        />
      )}
    </div>
  );
};

export default PalliativeOutreachBoard;
