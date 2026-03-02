import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PageLayout from "@/components/layout/PageLayout";
import { BarChart3, TrendingUp, Users, Building, Inbox } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, subMonths, format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const AnalyticsPage = () => {
  const isMobile = useIsMobile();

  // Batch all analytics queries in parallel
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-page-stats'],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const [
        totalReferralsRes,
        admittedReferralsRes,
        prevTotalRes,
        prevAdmittedRes,
        activePartnersRes,
        prevPartnersRes,
        responseTimeRes,
        prevResponseTimeRes,
        topOrgsRes,
        monthlyTrendsRes,
      ] = await Promise.all([
        // Total referrals last 30 days
        supabase.from('referrals').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
        // Admitted referrals last 30 days
        supabase.from('referrals').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()).in('status', ['admitted', 'admitted_our_hospice']),
        // Previous 30 days total
        supabase.from('referrals').select('*', { count: 'exact', head: true }).gte('created_at', sixtyDaysAgo.toISOString()).lt('created_at', thirtyDaysAgo.toISOString()),
        // Previous 30 days admitted
        supabase.from('referrals').select('*', { count: 'exact', head: true }).gte('created_at', sixtyDaysAgo.toISOString()).lt('created_at', thirtyDaysAgo.toISOString()).in('status', ['admitted', 'admitted_our_hospice']),
        // Active partners
        supabase.from('organizations').select('*', { count: 'exact', head: true }).in('partnership_stage', ['prospect', 'active']).eq('is_active', true),
        // Previous month partners (approximation via created_at)
        supabase.from('organizations').select('*', { count: 'exact', head: true }).in('partnership_stage', ['prospect', 'active']).eq('is_active', true).lt('created_at', thirtyDaysAgo.toISOString()),
        // Response time current
        supabase.from('referrals').select('referral_date, contact_date').not('contact_date', 'is', null).gte('created_at', thirtyDaysAgo.toISOString()),
        // Response time previous
        supabase.from('referrals').select('referral_date, contact_date').not('contact_date', 'is', null).gte('created_at', sixtyDaysAgo.toISOString()).lt('created_at', thirtyDaysAgo.toISOString()),
        // Top organizations by referral count
        supabase.from('referrals').select('organization_id, organizations(name)').not('organization_id', 'is', null),
        // Last 6 months of referrals for trend chart
        supabase.from('referrals').select('created_at').gte('created_at', subMonths(now, 6).toISOString()),
      ]);

      // Total referrals
      const totalReferrals = totalReferralsRes.count || 0;
      const prevTotal = prevTotalRes.count || 0;
      const referralChange = prevTotal > 0 ? Math.round(((totalReferrals - prevTotal) / prevTotal) * 100) : 0;

      // Conversion rate
      const admitted = admittedReferralsRes.count || 0;
      const conversionRate = totalReferrals > 0 ? Math.round((admitted / totalReferrals) * 100) : 0;
      const prevAdmitted = prevAdmittedRes.count || 0;
      const prevConversion = prevTotal > 0 ? Math.round((prevAdmitted / prevTotal) * 100) : 0;
      const conversionChange = conversionRate - prevConversion;

      // Active partners
      const activePartners = activePartnersRes.count || 0;
      const prevPartners = prevPartnersRes.count || 0;
      const newPartners = activePartners - prevPartners;

      // Avg response time
      const calcAvg = (data: any[]) => {
        if (!data || data.length === 0) return 0;
        const total = data.reduce((sum, r) => {
          return sum + (new Date(r.contact_date).getTime() - new Date(r.referral_date).getTime()) / (1000 * 60 * 60);
        }, 0);
        return total / data.length;
      };
      const avgResponseHours = calcAvg(responseTimeRes.data || []);
      const prevAvgResponseHours = calcAvg(prevResponseTimeRes.data || []);
      const responseChange = prevAvgResponseHours > 0 ? +(avgResponseHours - prevAvgResponseHours).toFixed(1) : 0;

      // Top organizations - group by org
      const orgCounts: Record<string, { name: string; count: number }> = {};
      (topOrgsRes.data || []).forEach((r: any) => {
        const id = r.organization_id;
        const name = r.organizations?.name || 'Unknown';
        if (!orgCounts[id]) orgCounts[id] = { name, count: 0 };
        orgCounts[id].count++;
      });
      const topOrgs = Object.values(orgCounts).sort((a, b) => b.count - a.count).slice(0, 5);

      // Monthly trends - group by month
      const monthlyMap: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(now, i);
        monthlyMap[format(startOfMonth(month), 'yyyy-MM')] = 0;
      }
      (monthlyTrendsRes.data || []).forEach((r: any) => {
        const key = format(new Date(r.created_at), 'yyyy-MM');
        if (monthlyMap[key] !== undefined) monthlyMap[key]++;
      });
      const monthlyTrends = Object.entries(monthlyMap).map(([month, count]) => ({
        month: format(new Date(month + '-01'), 'MMM yyyy'),
        referrals: count,
      }));

      return {
        totalReferrals,
        referralChange,
        conversionRate,
        conversionChange,
        activePartners,
        newPartners,
        avgResponseHours,
        responseChange,
        topOrgs,
        monthlyTrends,
      };
    },
  });

  const formatResponseTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const StatSkeleton = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <Inbox className="h-8 w-8 mb-2" />
      <p className="text-sm">{message}</p>
    </div>
  );

  return (
    <PageLayout title="Analytics" subtitle="Performance insights and trends">
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${isMobile ? 'gap-3 mb-6' : 'gap-6 mb-8'}`}>
        {isLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.totalReferrals || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {data?.referralChange !== 0 && (
                    <span className={data?.referralChange! > 0 ? 'text-green-600' : 'text-red-600'}>
                      {data?.referralChange! > 0 ? '+' : ''}{data?.referralChange}%
                    </span>
                  )}{' '}
                  vs last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.conversionRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {data?.conversionChange !== 0 && (
                    <span className={data?.conversionChange! > 0 ? 'text-green-600' : 'text-red-600'}>
                      {data?.conversionChange! > 0 ? '+' : ''}{data?.conversionChange}%
                    </span>
                  )}{' '}
                  vs last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.activePartners || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {data?.newPartners !== 0 && (
                    <span className={data?.newPartners! > 0 ? 'text-green-600' : 'text-red-600'}>
                      {data?.newPartners! > 0 ? '+' : ''}{data?.newPartners} new
                    </span>
                  )}{' '}
                  this period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.avgResponseHours ? formatResponseTime(data.avgResponseHours) : '—'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data?.responseChange !== 0 && (
                    <span className={data?.responseChange! < 0 ? 'text-green-600' : 'text-red-600'}>
                      {data?.responseChange! > 0 ? '+' : ''}{data?.responseChange}h
                    </span>
                  )}{' '}
                  vs last 30 days
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-2 ${isMobile ? 'gap-3' : 'gap-6'}`}>
        {/* Referral Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Trends</CardTitle>
            <CardDescription>Monthly referral volume — last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : data?.monthlyTrends?.every(m => m.referrals === 0) ? (
              <EmptyState message="No referral data available for the last 6 months" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="referrals" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Organizations */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Organizations</CardTitle>
            <CardDescription>Organizations by referral volume</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : !data?.topOrgs?.length ? (
              <EmptyState message="No organization referral data yet" />
            ) : (
              <div className="space-y-4">
                {data.topOrgs.map((org, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="font-medium truncate mr-2">{org.name}</span>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {org.count} referral{org.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default AnalyticsPage;
