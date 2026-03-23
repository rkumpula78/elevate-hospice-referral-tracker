import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { SortHeader } from '@/components/ui/sort-header';
import { differenceInDays, format, parseISO, isBefore } from 'date-fns';
import { FOLLOWUP_FREQUENCIES, LOCATION_TYPES, getStatusBadgeColor, getStatusLabel } from '@/lib/constants';
import { AlertCircle, Clock, Pencil } from 'lucide-react';
import QuickLogActivityDialog from '@/components/crm/QuickLogActivityDialog';

const PalliativeOutreachBoard = () => {
  const navigate = useNavigate();
  const [filterAssigned, setFilterAssigned] = useState('all');
  const [filterFrequency, setFilterFrequency] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({ field: 'next_followup_date', direction: 'asc' });
  const [quickLogRef, setQuickLogRef] = useState<{ id: string; name: string } | null>(null);

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['palliative-outreach-referrals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('id, patient_name, assigned_marketer, pcp_provider, next_followup_date, followup_frequency, location_type, location_city, status, notes, updated_at')
        .in('status', ['palliative_outreach', 'not_appropriate'] as any[])
        .order('next_followup_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data || [];
    },
  });

  const uniqueAssigned = [...new Set(referrals.map(r => r.assigned_marketer).filter(Boolean))];

  const filtered = referrals.filter(r => {
    if (filterAssigned !== 'all' && r.assigned_marketer !== filterAssigned) return false;
    if (filterFrequency !== 'all' && r.followup_frequency !== filterFrequency) return false;
    if (filterLocation !== 'all' && r.location_type !== filterLocation) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sort.direction === 'asc' ? 1 : -1;
    const field = sort.field;
    const aVal = (a as any)[field];
    const bVal = (b as any)[field];
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
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterAssigned} onValueChange={setFilterAssigned}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Assigned To" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assigned</SelectItem>
            {uniqueAssigned.map(a => <SelectItem key={a} value={a!}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterFrequency} onValueChange={setFilterFrequency}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Frequency" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frequencies</SelectItem>
            {FOLLOWUP_FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterLocation} onValueChange={setFilterLocation}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Location" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {LOCATION_TYPES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

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
                <TableHead><SortHeader label="Next Follow-up" field="next_followup_date" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Note</TableHead>
                <TableHead><SortHeader label="Days Since Update" field="updated_at" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead className="w-[80px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(ref => {
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
