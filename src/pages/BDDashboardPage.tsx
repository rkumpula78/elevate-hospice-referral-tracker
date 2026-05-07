import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth, startOfWeek, format } from 'date-fns';
import { RefreshCw, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PageLayout from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import LogVisitSheet from '@/components/bd/LogVisitSheet';
import RecentActivityFeed from '@/components/bd/RecentActivityFeed';
import BDAccountsTab from '@/components/bd/BDAccountsTab';

type PipelineRow = { tier: string; status: string; cnt: number };

const TIERS = ['A', 'B', 'C', 'D'] as const;
const STATUS_ORDER = [
  { key: 'cold', label: 'Cold', chip: 'bg-gray-200 text-gray-800' },
  { key: 'contacted', label: 'Contacted', chip: 'bg-blue-100 text-blue-800' },
  { key: 'active_conversation', label: 'Active Conversation', chip: 'bg-teal-100 text-teal-800' },
  { key: 'pre_referral', label: 'Pre-Referral', chip: 'bg-purple-100 text-purple-800' },
  { key: 'active_referrer', label: 'Active Referrer', chip: 'bg-green-100 text-green-800' },
  { key: 'lost_inactive', label: 'Lost / Inactive', chip: 'bg-red-100 text-red-800' },
];

const colorForTarget = (value: number, target: number) => {
  if (value >= target) return { ring: 'border-green-500', text: 'text-green-600', bar: 'bg-green-500' };
  if (value >= target * 0.8) return { ring: 'border-amber-500', text: 'text-amber-600', bar: 'bg-amber-500' };
  return { ring: 'border-red-500', text: 'text-red-600', bar: 'bg-red-500' };
};

const MetricCard = ({
  label, value, target, suffix, showProgress,
}: { label: string; value: number; target: number; suffix?: string; showProgress?: boolean }) => {
  const c = colorForTarget(value, target);
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <Card className={`border-l-4 ${c.ring}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${c.text}`}>
          {value}{suffix || ''}
        </div>
        <div className="text-xs text-muted-foreground mt-1">Target: {target}{suffix || ''}</div>
        {showProgress && (
          <div className="mt-3 h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div className={`h-full ${c.bar} transition-all`} style={{ width: `${pct}%` }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const BDDashboardPage = () => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const monthStart = startOfMonth(new Date());
  const [logOpen, setLogOpen] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['bd-weekly-dashboard'],
    queryFn: async () => {
      const [viewRes, refMonthRes, admMonthRes, sourcesRes] = await Promise.all([
        (supabase as any).from('v_bd_weekly_dashboard').select('*').limit(1).maybeSingle(),
        supabase.from('referrals').select('id, organization_id', { count: 'exact', head: false })
          .gte('created_at', monthStart.toISOString()),
        supabase.from('referrals').select('id', { count: 'exact', head: true })
          .eq('status', 'admitted')
          .gte('admission_date', monthStart.toISOString()),
        supabase.from('referrals').select('referral_source').is('deleted_at', null),
      ]);

      // Filter referrals this month to those linked to bd_accounts orgs
      const { data: bdOrgs } = await (supabase as any).from('bd_accounts').select('referring_org_id').not('referring_org_id', 'is', null);
      const orgSet = new Set((bdOrgs || []).map((r: any) => r.referring_org_id));
      const refsMonth = (refMonthRes.data || []).filter((r: any) => orgSet.has(r.organization_id)).length;

      // Top 5 sources
      const counts: Record<string, number> = {};
      (sourcesRes.data || []).forEach((r: any) => {
        const k = (r.referral_source || 'Unknown').trim() || 'Unknown';
        counts[k] = (counts[k] || 0) + 1;
      });
      const topSources = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        view: viewRes.data as any,
        referralsThisMonth: refsMonth,
        admissionsThisMonth: admMonthRes.count || 0,
        topSources,
      };
    },
  });

  const v = data?.view || {};
  const pipeline: PipelineRow[] = Array.isArray(v.pipeline) ? v.pipeline : [];

  // Build pivot
  const pivot: Record<string, Record<string, number>> = {};
  STATUS_ORDER.forEach(s => { pivot[s.key] = { A: 0, B: 0, C: 0, D: 0 }; });
  pipeline.forEach(p => {
    const sk = (p.status || '').toLowerCase();
    const tk = (p.tier || '').toUpperCase();
    if (pivot[sk] && TIERS.includes(tk as any)) {
      pivot[sk][tk] = (pivot[sk][tk] || 0) + Number(p.cnt || 0);
    }
  });
  const rowTotal = (sk: string) => TIERS.reduce((s, t) => s + (pivot[sk]?.[t] || 0), 0);
  const colTotal = (t: string) => STATUS_ORDER.reduce((s, r) => s + (pivot[r.key]?.[t] || 0), 0);
  const grandTotal = STATUS_ORDER.reduce((s, r) => s + rowTotal(r.key), 0);

  const doctorPct = Number(v.doctorcare_pct ?? 0);
  const doctorColor = doctorPct < 40 ? 'text-green-600' : doctorPct < 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <PageLayout
      title="BD Dashboard"
      subtitle={`Week of ${format(weekStart, 'MMM d, yyyy')}`}
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-semibold mb-3">This Week's Activity</h2>
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-3">
                {[0,1,2].map(i => <Skeleton key={i} className="h-32" />)}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard label="Visits This Week" value={Number(v.visits_this_week || 0)} target={25} showProgress />
                <MetricCard label="CRM Same-Day %" value={Number(v.crm_compliance_pct || 0)} target={100} suffix="%" showProgress />
                <MetricCard label="Anneli Co-Visits" value={Number(v.anneli_covisits_this_week || 0)} target={1} showProgress />
              </div>
            )}
          </section>

          <RecentActivityFeed />

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Pipeline by Tier</h2>
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      {TIERS.map(t => <TableHead key={t} className="text-center">Tier {t}</TableHead>)}
                      <TableHead className="text-center">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {STATUS_ORDER.map(s => (
                      <TableRow key={s.key}>
                        <TableCell>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${s.chip}`}>
                            {s.label}
                          </span>
                        </TableCell>
                        {TIERS.map(t => (
                          <TableCell key={t} className="text-center">{pivot[s.key]?.[t] || 0}</TableCell>
                        ))}
                        <TableCell className="text-center font-semibold">{rowTotal(s.key)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>TOTAL</TableCell>
                      {TIERS.map(t => <TableCell key={t} className="text-center">{colTotal(t)}</TableCell>)}
                      <TableCell className="text-center">{grandTotal}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Referral Attribution</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <MetricCard label="Referrals This Month" value={data?.referralsThisMonth || 0} target={4} showProgress />
              <MetricCard label="Admissions This Month" value={data?.admissionsThisMonth || 0} target={2} showProgress />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Targets: 4–6 referrals/mo, 2–4 admissions/mo</p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Referral Mix</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">DoctorCare %</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-bold ${doctorColor}`}>{doctorPct.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground mt-1">Target: &lt;40%</div>
                  <Progress value={Math.min(100, doctorPct)} className="mt-3" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Top 5 Referral Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  {(data?.topSources || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={data!.topSources} layout="vertical" margin={{ left: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="accounts">
          <BDAccountsTab />
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}
      <Button
        onClick={() => setLogOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 sm:h-auto sm:w-auto sm:px-5 sm:py-3 rounded-full shadow-xl"
        size="lg"
        aria-label="Log Visit"
      >
        <Plus className="w-6 h-6 sm:mr-2" />
        <span className="hidden sm:inline">Log Visit</span>
      </Button>

      <LogVisitSheet open={logOpen} onOpenChange={setLogOpen} />
    </PageLayout>
  );
};
export default BDDashboardPage;
