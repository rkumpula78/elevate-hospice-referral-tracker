import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, addWeeks, addDays, isSameDay, parseISO, formatDistanceToNow } from 'date-fns';
import { ChevronLeft, ChevronRight, Copy, Plus, Loader2, Trash2, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const ACTIVITY_LABELS: Record<string, string> = {
  cold_visit: 'Field Visit',
  followup_visit: 'Follow-Up Visit',
  call: 'Call',
  covisit_anneli: 'Co-Visit',
  in_service: 'In-Service',
  email: 'Email',
};

const ACTIVITY_GROUP: Record<string, string> = {
  cold_visit: 'Field Visits',
  followup_visit: 'Field Visits',
  covisit_anneli: 'Field Visits',
  in_service: 'In-Services',
  call: 'Calls',
  email: 'Emails',
};

// activity_communications uses its own interaction_type values (org-page "Log Activity").
const COMM_LABELS: Record<string, string> = {
  in_person_visit: 'Visit',
  lunch_learn: 'Lunch & Learn',
  phone_call: 'Call',
  email: 'Email',
  virtual_meeting: 'Virtual Meeting',
  event: 'Event',
};
const COMM_VISIT_TYPES = ['in_person_visit', 'lunch_learn', 'event'];
const COMM_CALL_TYPES = ['phone_call', 'virtual_meeting'];

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MARKETER_ALL = '__all__';
const MARKETER_ME = '__me__';

const WeeklyActivityPage: React.FC = () => {
  const { user, isAdmin, displayName } = useAuth();
  const qc = useQueryClient();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedMarketer, setSelectedMarketer] = useState<string>(MARKETER_ME);
  const [noteDialog, setNoteDialog] = useState<{ date: string } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const weekStart = useMemo(() => addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset), [weekOffset]);
  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);
  const days = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const startISO = format(weekStart, 'yyyy-MM-dd');
  const endISO = format(weekEnd, 'yyyy-MM-dd');

  // Profiles list (for marketer dropdown — admins only)
  const { data: profiles = [] } = useQuery({
    queryKey: ['weekly-marketers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .order('first_name');
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  // Resolve filter context
  const activeProfile = useMemo(() => {
    if (selectedMarketer === MARKETER_ME) {
      return profiles.find((p: any) => p.id === user?.id) ?? { id: user?.id, first_name: displayName.split(' ')[0], last_name: displayName.split(' ').slice(1).join(' '), email: user?.email };
    }
    if (selectedMarketer === MARKETER_ALL) return null;
    return profiles.find((p: any) => p.id === selectedMarketer) ?? null;
  }, [selectedMarketer, profiles, user, displayName]);

  const marketerNameForReferralMatch = activeProfile
    ? `${activeProfile.first_name ?? ''}`.trim()
    : null;

  // Week data
  const { data: weekData, isLoading } = useQuery({
    queryKey: ['weekly-activity', startISO, endISO, selectedMarketer, user?.id],
    queryFn: async () => {
      // bd_activities
      let actQ = (supabase as any)
        .from('bd_activities')
        .select('id, organization_id, activity_date, activity_type, anneli_present, outcome, notes, logged_by_user_id')
        .gte('activity_date', startISO)
        .lte('activity_date', endISO);
      if (activeProfile?.id) actQ = actQ.eq('logged_by_user_id', activeProfile.id);
      const { data: activities, error: aErr } = await actQ;
      if (aErr) throw aErr;

      // referrals (created this week)
      let refQ = supabase
        .from('referrals')
        .select('id, patient_name, first_name, last_name, status, created_at, assigned_marketer')
        .gte('created_at', `${startISO}T00:00:00`)
        .lte('created_at', `${endISO}T23:59:59`);
      if (marketerNameForReferralMatch) refQ = refQ.ilike('assigned_marketer', `%${marketerNameForReferralMatch}%`);
      const { data: referrals, error: rErr } = await refQ;
      if (rErr) throw rErr;

      // status history (changes this week, for referrals matching marketer)
      const { data: history, error: hErr } = await supabase
        .from('referral_status_history')
        .select('id, referral_id, new_status, old_status, changed_at, referrals!inner(id, patient_name, assigned_marketer)')
        .gte('changed_at', `${startISO}T00:00:00`)
        .lte('changed_at', `${endISO}T23:59:59`);
      if (hErr) throw hErr;
      const filteredHistory = (history || []).filter((h: any) => {
        if (!marketerNameForReferralMatch) return true;
        const am = h.referrals?.assigned_marketer || '';
        return am.toLowerCase().includes(marketerNameForReferralMatch.toLowerCase());
      });

      // referral activity log entries (phone calls, visits, notes logged from referral detail page)
      let logQ = supabase
        .from('referral_activity_log')
        .select('id, referral_id, activity_type, note_text, created_by, created_at')
        .gte('created_at', `${startISO}T00:00:00`)
        .lte('created_at', `${endISO}T23:59:59`);
      if (activeProfile?.email) logQ = logQ.eq('created_by', activeProfile.email);
      const { data: activityLogs, error: lErr } = await logQ;
      if (lErr) throw lErr;

      // activity_communications (the org-page "Log Activity" log most marketers use).
      // completed_by stores an email (quick-log) or a typed name (full form), so match both.
      let commQ = supabase
        .from('activity_communications')
        .select('id, organization_id, activity_date, interaction_type, completed_by, discussion_points')
        .gte('activity_date', `${startISO}T00:00:00`)
        .lte('activity_date', `${endISO}T23:59:59`);
      if (activeProfile) {
        const ors: string[] = [];
        if (activeProfile.email) ors.push(`completed_by.eq.${activeProfile.email}`);
        const full = `${activeProfile.first_name ?? ''} ${activeProfile.last_name ?? ''}`.trim();
        if (full) ors.push(`completed_by.ilike.%${full}%`);
        if (activeProfile.first_name) ors.push(`completed_by.ilike.%${activeProfile.first_name}%`);
        if (ors.length) commQ = commQ.or(ors.join(','));
      }
      const { data: comms, error: cErr } = await commQ;
      if (cErr) throw cErr;

      // day notes
      let noteQ = (supabase as any)
        .from('marketer_day_notes')
        .select('id, user_id, note_date, content')
        .gte('note_date', startISO)
        .lte('note_date', endISO);
      if (activeProfile?.id) noteQ = noteQ.eq('user_id', activeProfile.id);
      const { data: notes, error: nErr } = await noteQ;
      if (nErr) throw nErr;

      // resolve org names
      const orgIds = Array.from(new Set([...(activities || []), ...(comms || [])].map((a: any) => a.organization_id).filter(Boolean))) as string[];
      let orgs: Record<string, { id: string; name: string }> = {};
      if (orgIds.length) {
        const { data: o } = await supabase.from('organizations').select('id, name').in('id', orgIds);
        (o || []).forEach((x: any) => { orgs[x.id] = x; });
      }

      return { activities: activities || [], referrals: referrals || [], history: filteredHistory, activityLogs: activityLogs || [], comms: comms || [], notes: notes || [], orgs };
    },
  });

  // Management rollup data (admins + "All" marketers)
  const showRollup = isAdmin && selectedMarketer === MARKETER_ALL;
  const { data: rollup } = useQuery({
    queryKey: ['weekly-rollup', startISO, endISO],
    queryFn: async () => {
      const { data: acts } = await (supabase as any)
        .from('bd_activities')
        .select('logged_by_user_id, activity_type, organization_id, logged_at')
        .gte('activity_date', startISO)
        .lte('activity_date', endISO);
      const { data: refs } = await supabase
        .from('referrals')
        .select('assigned_marketer, status, created_at')
        .gte('created_at', `${startISO}T00:00:00`)
        .lte('created_at', `${endISO}T23:59:59`);
      return { acts: acts || [], refs: refs || [] };
    },
    enabled: showRollup,
  });

  const rollupRows = useMemo(() => {
    if (!showRollup || !rollup) return [];
    return profiles.map((p: any) => {
      const myActs = rollup.acts.filter((a: any) => a.logged_by_user_id === p.id);
      const firstName = (p.first_name || '').toLowerCase();
      const myRefs = firstName
        ? rollup.refs.filter((r: any) => (r.assigned_marketer || '').toLowerCase().includes(firstName))
        : [];
      const lastLogged = myActs.length
        ? new Date(Math.max(...myActs.map((a: any) => new Date(a.logged_at).getTime())))
        : null;
      return {
        id: p.id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email,
        visits: myActs.filter((a: any) => ['cold_visit', 'followup_visit', 'covisit_anneli', 'in_service'].includes(a.activity_type)).length,
        calls: myActs.filter((a: any) => a.activity_type === 'call').length,
        emails: myActs.filter((a: any) => a.activity_type === 'email').length,
        referrals: myRefs.length,
        admits: myRefs.filter((r: any) => r.status === 'admitted').length,
        accounts: new Set(myActs.map((a: any) => a.organization_id).filter(Boolean)).size,
        lastLogged,
      };
    }).filter((r: any) => r.visits + r.calls + r.emails + r.referrals > 0 || r.lastLogged)
      .sort((a, b) => (b.visits + b.calls + b.emails) - (a.visits + a.calls + a.emails));
  }, [showRollup, rollup, profiles]);

  const handleSaveNote = async () => {
    if (!noteDialog || !noteText.trim() || !user?.id) return;
    setSavingNote(true);
    const { error } = await (supabase as any).from('marketer_day_notes').insert({
      user_id: user.id,
      note_date: noteDialog.date,
      content: noteText.trim(),
    });
    setSavingNote(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Day note saved');
    setNoteDialog(null);
    setNoteText('');
    qc.invalidateQueries({ queryKey: ['weekly-activity'] });
  };

  const handleDeleteNote = async (id: string) => {
    const { error } = await (supabase as any).from('marketer_day_notes').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Note deleted');
    qc.invalidateQueries({ queryKey: ['weekly-activity'] });
  };

  // Group activities by day
  const byDay = useMemo(() => {
    const map: Record<string, { activities: any[]; referrals: any[]; history: any[]; activityLogs: any[]; comms: any[]; notes: any[] }> = {};
    days.forEach((d) => {
      const key = format(d, 'yyyy-MM-dd');
      map[key] = { activities: [], referrals: [], history: [], activityLogs: [], comms: [], notes: [] };
    });
    weekData?.activities.forEach((a: any) => {
      if (map[a.activity_date]) map[a.activity_date].activities.push(a);
    });
    weekData?.referrals.forEach((r: any) => {
      const key = format(parseISO(r.created_at), 'yyyy-MM-dd');
      if (map[key]) map[key].referrals.push(r);
    });
    weekData?.history.forEach((h: any) => {
      const key = format(parseISO(h.changed_at), 'yyyy-MM-dd');
      if (map[key]) map[key].history.push(h);
    });
    weekData?.activityLogs?.forEach((l: any) => {
      const key = format(parseISO(l.created_at), 'yyyy-MM-dd');
      if (map[key]) map[key].activityLogs.push(l);
    });
    weekData?.comms?.forEach((c: any) => {
      const key = format(parseISO(c.activity_date), 'yyyy-MM-dd');
      if (map[key]) map[key].comms.push(c);
    });
    weekData?.notes.forEach((n: any) => {
      if (map[n.note_date]) map[n.note_date].notes.push(n);
    });
    return map;
  }, [weekData, days]);

  // Totals
  const totals = useMemo(() => {
    const acts = weekData?.activities || [];
    const comms = weekData?.comms || [];
    return {
      visits: acts.filter((a: any) => ['cold_visit', 'followup_visit', 'covisit_anneli', 'in_service'].includes(a.activity_type)).length
        + comms.filter((c: any) => COMM_VISIT_TYPES.includes(c.interaction_type)).length,
      calls: acts.filter((a: any) => a.activity_type === 'call').length
        + comms.filter((c: any) => COMM_CALL_TYPES.includes(c.interaction_type)).length,
      emails: acts.filter((a: any) => a.activity_type === 'email').length
        + comms.filter((c: any) => c.interaction_type === 'email').length,
      newReferrals: (weekData?.referrals || []).length,
      admits: (weekData?.history || []).filter((h: any) => h.new_status === 'admitted').length,
      patientUpdates: (weekData?.activityLogs || []).length,
    };
  }, [weekData]);

  // Copy plain-text recap
  const copyRecap = async () => {
    const lines: string[] = [];
    const who = activeProfile ? `${activeProfile.first_name || ''} ${activeProfile.last_name || ''}`.trim() : 'All Marketers';
    lines.push(`${who}'s Weekly Activity ${format(weekStart, 'MMM d')}-${format(weekEnd, 'd, yyyy')}`);
    lines.push('');
    days.forEach((d) => {
      const key = format(d, 'yyyy-MM-dd');
      const data = byDay[key];
      const items = data.activities.length + data.comms.length + data.referrals.length + data.history.length + data.notes.length;
      if (items === 0) return;
      lines.push(`${format(d, 'EEEE')}`);
      // Group by category
      const groups: Record<string, string[]> = {};
      data.activities.forEach((a: any) => {
        const g = ACTIVITY_GROUP[a.activity_type] || ACTIVITY_LABELS[a.activity_type] || 'Other';
        const name = weekData?.orgs[a.organization_id]?.name || 'Unknown';
        (groups[g] = groups[g] || []).push(name);
      });
      data.comms.forEach((c: any) => {
        const g = COMM_LABELS[c.interaction_type] || 'Activity';
        const name = weekData?.orgs[c.organization_id]?.name || 'Unknown';
        (groups[g] = groups[g] || []).push(name);
      });
      Object.entries(groups).forEach(([g, names]) => {
        lines.push(`  ${g} (${names.length}): ${names.join(', ')}`);
      });
      data.referrals.forEach((r: any) => {
        lines.push(`  New Referral: ${r.id.slice(0, 8)} (${r.status?.replace(/_/g, ' ')})`);
      });
      data.history.forEach((h: any) => {
        if (h.new_status === 'admitted') {
          lines.push(`  Admitted: ${h.referral_id.slice(0, 8)}`);
        }
      });
      data.notes.forEach((n: any) => {
        lines.push(`  Note: ${n.content}`);
      });
      lines.push('');
    });
    lines.push(`Totals: ${totals.visits} visits · ${totals.calls} calls · ${totals.emails} emails · ${totals.newReferrals} new referrals · ${totals.admits} admits`);
    await navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Weekly recap copied to clipboard');
  };

  return (
    <PageLayout
      title="Weekly Activity"
      subtitle={`${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`}
      actions={
        <Button onClick={copyRecap} size="sm" variant="outline" className="gap-2">
          <Copy className="w-4 h-4" /> Copy Recap
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Controls */}
        <Card>
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-sm font-medium min-w-[180px] text-center">
                {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
              </div>
              <Button size="icon" variant="outline" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week">
                <ChevronRight className="w-4 h-4" />
              </Button>
              {weekOffset !== 0 && (
                <Button size="sm" variant="ghost" onClick={() => setWeekOffset(0)}>This week</Button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">Marketer:</span>
              <Select value={selectedMarketer} onValueChange={setSelectedMarketer}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MARKETER_ME}>Me ({displayName})</SelectItem>
                  {isAdmin && <SelectItem value={MARKETER_ALL}>All marketers</SelectItem>}
                  {isAdmin && profiles.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {`${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Totals strip */}
        <Card>
          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { label: 'Visits', value: totals.visits },
              { label: 'Calls', value: totals.calls },
              { label: 'Emails', value: totals.emails },
              { label: 'New Referrals', value: totals.newReferrals },
              { label: 'Admits', value: totals.admits },
              { label: 'Patient Updates', value: totals.patientUpdates },
            ].map((t) => (
              <div key={t.label} className="text-center">
                <div className="text-2xl font-bold">{t.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{t.label}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Management rollup */}
        {showRollup && rollupRows.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Team Rollup — This Week</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marketer</TableHead>
                    <TableHead className="text-right">Visits</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead className="text-right">Emails</TableHead>
                    <TableHead className="text-right">Accounts</TableHead>
                    <TableHead className="text-right">Referrals</TableHead>
                    <TableHead className="text-right">Admits</TableHead>
                    <TableHead>Last Logged</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rollupRows.map((r: any) => {
                    const staleDays = r.lastLogged ? (Date.now() - r.lastLogged.getTime()) / 86400000 : 999;
                    return (
                      <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelectedMarketer(r.id)}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-right">{r.visits}</TableCell>
                        <TableCell className="text-right">{r.calls}</TableCell>
                        <TableCell className="text-right">{r.emails}</TableCell>
                        <TableCell className="text-right">{r.accounts}</TableCell>
                        <TableCell className="text-right">{r.referrals}</TableCell>
                        <TableCell className="text-right">{r.admits}</TableCell>
                        <TableCell>
                          {r.lastLogged ? (
                            <span className={staleDays > 2 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                              {formatDistanceToNow(r.lastLogged, { addSuffix: true })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">No activity</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Weekly grid */}
        {isLoading ? (
          <div className="grid gap-3">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <div className="grid gap-3">
            {days.map((d) => {
              const key = format(d, 'yyyy-MM-dd');
              const data = byDay[key];
              const isToday = isSameDay(d, new Date());
              const empty = data.activities.length + data.referrals.length + data.history.length + data.activityLogs.length + data.comms.length + data.notes.length === 0;

              // Group activities by category
              const groups: Record<string, any[]> = {};
              data.activities.forEach((a: any) => {
                const g = ACTIVITY_GROUP[a.activity_type] || 'Other';
                (groups[g] = groups[g] || []).push(a);
              });

              return (
                <Card key={key} className={isToday ? 'border-primary' : ''}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {format(d, 'EEEE')} <span className="text-muted-foreground font-normal text-sm">{format(d, 'MMM d')}</span>
                        {isToday && <Badge variant="outline" className="ml-2 text-xs">Today</Badge>}
                      </CardTitle>
                    </div>
                    {selectedMarketer === MARKETER_ME && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setNoteDialog({ date: key }); setNoteText(''); }}
                        className="gap-1"
                      >
                        <Plus className="w-4 h-4" /> Day note
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {empty && (
                      <p className="text-sm text-muted-foreground italic">No activity logged.</p>
                    )}

                    {Object.entries(groups).map(([groupName, items]) => (
                      <div key={groupName}>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          {groupName} ({items.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {items.map((a: any) => {
                            const org = weekData?.orgs[a.organization_id];
                            return (
                              <Link
                                key={a.id}
                                to={org ? `/organizations/${org.id}` : '#'}
                                className="text-sm bg-muted/60 hover:bg-muted px-2 py-1 rounded border"
                              >
                                {org?.name || 'Unknown'}
                                {a.anneli_present && <span className="ml-1 text-xs text-purple-700">(Co-visit)</span>}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {data.referrals.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          New Referrals ({data.referrals.length})
                        </div>
                        <ul className="space-y-1">
                          {data.referrals.map((r: any) => (
                            <li key={r.id} className="text-sm">
                              <Link to={`/referral/${r.id}`} className="text-primary hover:underline font-medium">
                                {r.patient_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Unnamed'}
                              </Link>
                              <Badge variant="outline" className="ml-2 text-xs">{r.status?.replace(/_/g, ' ')}</Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {data.history.filter((h: any) => h.new_status === 'admitted').length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                          Admits
                        </div>
                        <ul className="space-y-1">
                          {data.history.filter((h: any) => h.new_status === 'admitted').map((h: any) => (
                            <li key={h.id} className="text-sm">
                              <Link to={`/referral/${h.referral_id}`} className="text-primary hover:underline">
                                {h.referrals?.patient_name || 'Unknown'}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {data.comms.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Activity Log ({data.comms.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {data.comms.map((c: any) => {
                            const org = weekData?.orgs[c.organization_id];
                            return (
                              <Link
                                key={c.id}
                                to={org ? `/organizations/${org.id}` : '#'}
                                className="text-sm bg-muted/60 hover:bg-muted px-2 py-1 rounded border"
                              >
                                {org?.name || 'Activity'}
                                <span className="ml-1 text-xs text-muted-foreground">
                                  ({COMM_LABELS[c.interaction_type] || (c.interaction_type || '').replace(/_/g, ' ')})
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {data.activityLogs.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Patient Updates ({data.activityLogs.length})
                        </div>
                        <ul className="space-y-1">
                          {data.activityLogs.map((l: any) => (
                            <li key={l.id} className="text-sm flex items-start gap-2 bg-muted/40 px-2 py-1.5 rounded">
                              <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">
                                {l.activity_type?.replace(/_/g, ' ')}
                              </Badge>
                              <Link to={`/referral/${l.referral_id}`} className="text-primary hover:underline font-medium text-xs">
                                Referral
                              </Link>
                              <span className="text-xs text-muted-foreground truncate">{l.note_text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {data.notes.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                          <StickyNote className="w-3 h-3" /> Notes
                        </div>
                        <ul className="space-y-1">
                          {data.notes.map((n: any) => (
                            <li key={n.id} className="text-sm flex items-start justify-between gap-2 bg-amber-50 border border-amber-100 px-2 py-1.5 rounded">
                              <span className="whitespace-pre-wrap">{n.content}</span>
                              {n.user_id === user?.id && (
                                <button
                                  onClick={() => handleDeleteNote(n.id)}
                                  className="text-muted-foreground hover:text-destructive shrink-0"
                                  aria-label="Delete note"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Day note dialog */}
      <Dialog open={!!noteDialog} onOpenChange={(o) => !o && setNoteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add note for {noteDialog && format(parseISO(noteDialog.date), 'EEEE, MMM d')}</DialogTitle>
            <DialogDescription>
              Capture meetings, training, market research, or anything that isn't a visit or call.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="e.g., Met with NW Valley Chamber, CRM training, Created 7 Healthy U orgs"
            rows={5}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog(null)}>Cancel</Button>
            <Button onClick={handleSaveNote} disabled={!noteText.trim() || savingNote}>
              {savingNote && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default WeeklyActivityPage;
