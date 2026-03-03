import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, Activity, Target, Calendar, Award, Inbox } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import EventFrequencyManager from "@/components/kpis/EventFrequencyManager";
import RepPerformanceDashboard from "@/components/kpis/RepPerformanceDashboard";
import SegmentMixAnalysis from "@/components/kpis/SegmentMixAnalysis";
import VisitSchedulingManager from "@/components/kpis/VisitSchedulingManager";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek } from "date-fns";
import ExportDropdown from "@/components/ui/export-dropdown";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";

const KPIPage = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedTab, setSelectedTab] = useState('events');

  // Fetch KPI header metrics + overview data via RPC
  const { data: kpiData, isLoading } = useQuery({
    queryKey: ['kpi-page-stats'],
    queryFn: async () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

      const [rpcResult, weekEventsRes, weekReferralsRes, weekOrgsRes] = await Promise.all([
        supabase.rpc('get_kpi_metrics'),
        // Weekly events count
        supabase.from('activity_communications').select('*', { count: 'exact', head: true }).gte('activity_date', weekStart),
        // Weekly referrals count
        supabase.from('referrals').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
        // Distinct organizations visited this week
        supabase.from('activity_communications').select('organization_id').not('organization_id', 'is', null).gte('activity_date', weekStart),
      ]);

      const rpc = rpcResult.data as any;
      const uniqueOrgs = new Set((weekOrgsRes.data || []).map((r: any) => r.organization_id)).size;

      return {
        weeklyEvents: weekEventsRes.count || 0,
        weeklyEventsTarget: rpc?.weeklyEventsTarget || 50,
        referralsGenerated: weekReferralsRes.count || 0,
        accountsVisited: uniqueOrgs,
        visitCompliance: rpc?.visitCompliance || 0,
        accountTiers: rpc?.accountTiers || { a: { total: 0, compliant: 0, complianceRate: 0 }, b: { total: 0, compliant: 0, complianceRate: 0 }, c: { total: 0, compliant: 0, complianceRate: 0 }, prospect: { total: 0, compliant: 0, complianceRate: 0 } },
        leadingIndicators: rpc?.leadingIndicators || {},
        laggingIndicators: rpc?.laggingIndicators || {},
      };
    },
  });

  const MetricSkeleton = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-12 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );

  const complianceBadgeClass = (rate: number) => {
    if (rate >= 80) return 'bg-green-100 text-green-800';
    if (rate >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const tiers = kpiData?.accountTiers;

  const handleExportCSV = () => {
    if (!kpiData) return;
    exportToCSV([
      { metric: 'Weekly Events', value: kpiData.weeklyEvents, target: kpiData.weeklyEventsTarget },
      { metric: 'Referrals Generated', value: kpiData.referralsGenerated, target: '' },
      { metric: 'Accounts Visited', value: kpiData.accountsVisited, target: '' },
      { metric: 'Visit Compliance', value: `${kpiData.visitCompliance}%`, target: '' },
    ], 'kpi-dashboard', [
      { key: 'metric', label: 'Metric' },
      { key: 'value', label: 'Value' },
      { key: 'target', label: 'Target' },
    ]);
  };

  return (
    <PageLayout 
      title="KPI Dashboard" 
      subtitle="Track leading and lagging indicators for referral growth"
      actions={<ExportDropdown onExportCSV={handleExportCSV} onExportPDF={exportToPDF} disabled={isLoading} />}
    >
      <div className={isMobile ? "space-y-4" : "space-y-6"}>
        {/* Header with Key Metrics Overview */}
        <div className={`grid grid-cols-1 md:grid-cols-4 ${isMobile ? 'gap-3' : 'gap-4'}`}>
          {isLoading ? (
            <>
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Weekly Events</span>
                  </div>
                  <div className="text-2xl font-bold">{kpiData?.weeklyEvents ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Target: {kpiData?.weeklyEventsTarget}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Referrals Generated</span>
                  </div>
                  <div className="text-2xl font-bold">{kpiData?.referralsGenerated ?? 0}</div>
                  <p className="text-xs text-muted-foreground">This week</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Accounts Visited</span>
                  </div>
                  <div className="text-2xl font-bold">{kpiData?.accountsVisited ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Unique organizations</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Visit Compliance</span>
                  </div>
                  <div className="text-2xl font-bold">{kpiData?.visitCompliance ?? 0}%</div>
                  <p className="text-xs text-muted-foreground">On schedule</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Main KPI Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2 h-auto gap-1' : 'grid-cols-5 max-w-3xl'}`}>
            <TabsTrigger value="events" className={`flex items-center ${isMobile ? 'gap-1 text-xs py-2.5' : 'gap-2'}`}>
              <Calendar className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              {isMobile ? "Events" : "Event Frequency"}
            </TabsTrigger>
            <TabsTrigger value="performance" className={`flex items-center ${isMobile ? 'gap-1 text-xs py-2.5' : 'gap-2'}`}>
              <BarChart3 className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              {isMobile ? "Reps" : "Rep Performance"}
            </TabsTrigger>
            <TabsTrigger value="segments" className={`flex items-center ${isMobile ? 'gap-1 text-xs py-2.5' : 'gap-2'}`}>
              <TrendingUp className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              {isMobile ? "Segments" : "Segment Mix"}
            </TabsTrigger>
            <TabsTrigger value="scheduling" className={`flex items-center ${isMobile ? 'gap-1 text-xs py-2.5' : 'gap-2'}`}>
              <Calendar className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              {isMobile ? "Visits" : "Visit Scheduling"}
            </TabsTrigger>
            <TabsTrigger value="overview" className={`flex items-center ${isMobile ? 'gap-1 text-xs py-2.5 col-span-2' : 'gap-2'}`}>
              <Award className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className={isMobile ? "mt-4" : "mt-6"}>
            <EventFrequencyManager />
          </TabsContent>

          <TabsContent value="performance" className={isMobile ? "mt-4" : "mt-6"}>
            <RepPerformanceDashboard />
          </TabsContent>

          <TabsContent value="segments" className={isMobile ? "mt-4" : "mt-6"}>
            <SegmentMixAnalysis />
          </TabsContent>

          <TabsContent value="scheduling" className={isMobile ? "mt-4" : "mt-6"}>
            <VisitSchedulingManager />
          </TabsContent>

          <TabsContent value="overview" className={isMobile ? "mt-4" : "mt-6"}>
            <div className={`grid grid-cols-1 lg:grid-cols-2 ${isMobile ? 'gap-3' : 'gap-6'}`}>
              {/* KPI Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    KPI Summary
                  </CardTitle>
                  <CardDescription>Leading vs Lagging indicators from Trella Health framework</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-3 text-green-700">Leading Indicators (Predictive)</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                            <span className="text-sm">Events completed per week</span>
                            <Badge className="bg-green-100 text-green-800">
                              {kpiData?.weeklyEvents}/{kpiData?.weeklyEventsTarget}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                            <span className="text-sm">Visit frequency compliance</span>
                            <Badge className="bg-green-100 text-green-800">{kpiData?.visitCompliance}%</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                            <span className="text-sm">Account coverage (A-rated)</span>
                            <Badge className="bg-green-100 text-green-800">
                              {tiers?.a?.complianceRate || 0}%
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3 text-blue-700">Lagging Indicators (Results)</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                            <span className="text-sm">Referrals generated</span>
                            <Badge className="bg-blue-100 text-blue-800">{kpiData?.referralsGenerated}</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                            <span className="text-sm">Conversion rate</span>
                            <Badge className="bg-blue-100 text-blue-800">
                              {kpiData?.laggingIndicators?.conversionRate || 0}%
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                            <span className="text-sm">New admissions</span>
                            <Badge className="bg-blue-100 text-blue-800">
                              {kpiData?.laggingIndicators?.newAdmissions || 0}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Tier Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Account Tier Performance
                  </CardTitle>
                  <CardDescription>Visit frequency by account priority (A/B/C/P)</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[
                        { label: 'A-Rated Accounts', desc: 'Weekly visits required', data: tiers?.a },
                        { label: 'B-Rated Accounts', desc: 'Bi-weekly visits required', data: tiers?.b },
                        { label: 'C-Rated Accounts', desc: 'Monthly visits required', data: tiers?.c },
                        { label: 'Prospect Accounts', desc: 'Quarterly visits required', data: tiers?.prospect },
                      ].map((tier) => (
                        <div key={tier.label} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">{tier.label}</span>
                            <p className="text-sm text-muted-foreground">{tier.desc}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={complianceBadgeClass(tier.data?.complianceRate || 0)}>
                              {tier.data?.complianceRate || 0}% compliant
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              {tier.data?.compliant || 0}/{tier.data?.total || 0} accounts
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Performance Trends */}
            <div className={isMobile ? "mt-4" : "mt-6"}>
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>Key metrics this week</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">{kpiData?.weeklyEvents}</div>
                        <p className="font-medium mt-2">Events This Week</p>
                        <p className="text-sm text-muted-foreground">
                          {kpiData?.weeklyEvents && kpiData?.weeklyEventsTarget
                            ? `${Math.round((kpiData.weeklyEvents / kpiData.weeklyEventsTarget) * 100)}% of target`
                            : 'No target set'}
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">{kpiData?.referralsGenerated}</div>
                        <p className="font-medium mt-2">Referrals This Week</p>
                        <p className="text-sm text-muted-foreground">From {kpiData?.accountsVisited} accounts</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">{kpiData?.visitCompliance}%</div>
                        <p className="font-medium mt-2">Visit Compliance</p>
                        <p className="text-sm text-muted-foreground">Across all tiers</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default KPIPage;
