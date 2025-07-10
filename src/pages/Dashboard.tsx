import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, FileText, TrendingUp, Users, Phone, AlertCircle, Building, Target, Clock, Edit2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import QuickAddDialog from "@/components/crm/QuickAddDialog";
import ConversionFunnelChart from "@/components/charts/ConversionFunnelChart";
import SourcePerformanceChart from "@/components/charts/SourcePerformanceChart";
import MarketerPerformance from "@/components/charts/MarketerPerformance";
import TrainingMetrics from "@/components/charts/TrainingMetrics";
import PageLayout from "@/components/layout/PageLayout";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfDay, startOfMonth, subDays } from "date-fns";
import AlertCenter from "@/components/dashboard/AlertCenter";
import CensusManager from "@/components/dashboard/CensusManager";
import ValuesReminder from "@/components/dashboard/ValuesReminder";

const Dashboard = () => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCensusManager, setShowCensusManager] = useState(false);
  const { displayName } = useAuth();

  // Fetch real dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const thisMonth = startOfMonth(new Date());
      const thirtyDaysAgo = subDays(new Date(), 30);
      const sixtyDaysAgo = subDays(new Date(), 60);
      const lastMonth = subDays(thisMonth, 1);
      const lastMonthStart = startOfMonth(lastMonth);

      // Get current census from manual entries
      // NOTE: This will work after you apply the migration
      let currentCensus = 0;
      let censusPrevious = 0;
      
      try {
        // Try localStorage first (temporary solution)
        const latestCensusLocal = localStorage.getItem('latest_census');
        if (latestCensusLocal) {
          const censusData = JSON.parse(latestCensusLocal);
          currentCensus = censusData.count;
        } else {
          // Get latest census entry from database
          const { data: latestCensus } = await supabase
            .from('census_entries' as any)
            .select('*')
            .order('census_date', { ascending: false })
            .limit(1)
            .single();

          if (latestCensus) {
            currentCensus = (latestCensus as any).patient_count;
          }
        }

        // Get census from 30 days ago
        const thirtyDaysKey = `census_${format(thirtyDaysAgo, 'yyyy-MM-dd')}`;
        const previousCensusLocal = localStorage.getItem(thirtyDaysKey);
        
        if (previousCensusLocal) {
          const prevData = JSON.parse(previousCensusLocal);
          censusPrevious = prevData.patient_count;
        } else {
          const { data: previousCensus } = await supabase
            .from('census_entries' as any)
            .select('*')
            .eq('census_date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
            .maybeSingle();

          if (previousCensus) {
            censusPrevious = (previousCensus as any).patient_count;
          }
        }
      } catch (error) {
        // Fallback to counting admitted referrals if census_entries doesn't exist yet
        const { count: admittedCount } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          .in('status', ['admitted', 'admitted_our_hospice']);
        
        currentCensus = admittedCount || 0;
      }

      // Calculate census trend
      const censusTrend = censusPrevious > 0 
        ? Math.round(((currentCensus - censusPrevious) / censusPrevious) * 100)
        : 0;

      // Get today's referrals count
      const { count: todayReferrals } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Get monthly referrals count
      const { count: monthlyReferrals } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonth.toISOString());

      // Get last month's referrals for trend
      const { count: lastMonthReferrals } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonthStart.toISOString())
        .lt('created_at', thisMonth.toISOString());

      // Calculate monthly trend
      const monthlyTrend = lastMonthReferrals > 0
        ? Math.round(((monthlyReferrals - lastMonthReferrals) / lastMonthReferrals) * 100)
        : 0;

      // Get pending follow-ups (activities with follow_up_required = true and not completed)
      const { count: pendingFollowUps } = await supabase
        .from('activity_communications')
        .select('*', { count: 'exact', head: true })
        .eq('follow_up_required', true)
        .eq('follow_up_completed', false);

      // Get active prospects (organizations with partnership_stage = 'prospect' or 'active')
      const { count: activeProspects } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .in('partnership_stage', ['prospect', 'active'])
        .eq('is_active', true);

      // Calculate conversion rate (admitted referrals vs total referrals in last 30 days)
      const { data: recentReferrals } = await supabase
        .from('referrals')
        .select('status')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { data: previousReferrals } = await supabase
        .from('referrals')
        .select('status')
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());

      const totalRecentReferrals = recentReferrals?.length || 0;
      const admittedReferrals = recentReferrals?.filter(r => 
        r.status === 'admitted' || r.status === 'admitted_our_hospice'
      ).length || 0;
      
      const conversionRate = totalRecentReferrals > 0 
        ? Math.round((admittedReferrals / totalRecentReferrals) * 100) 
        : 0;

      // Previous period conversion rate
      const totalPreviousReferrals = previousReferrals?.length || 0;
      const admittedPreviousReferrals = previousReferrals?.filter(r => 
        r.status === 'admitted' || r.status === 'admitted_our_hospice'
      ).length || 0;
      
      const previousConversionRate = totalPreviousReferrals > 0 
        ? Math.round((admittedPreviousReferrals / totalPreviousReferrals) * 100) 
        : 0;

      const conversionTrend = previousConversionRate > 0
        ? conversionRate - previousConversionRate
        : 0;

      // Calculate average response time (from referral_date to contact_date)
      const { data: responseTimeData } = await supabase
        .from('referrals')
        .select('referral_date, contact_date')
        .not('contact_date', 'is', null)
        .gte('created_at', thirtyDaysAgo.toISOString());

      let avgResponseHours = 0;
      if (responseTimeData && responseTimeData.length > 0) {
        const totalHours = responseTimeData.reduce((sum, ref) => {
          const referralTime = new Date(ref.referral_date).getTime();
          const contactTime = new Date(ref.contact_date).getTime();
          const hours = (contactTime - referralTime) / (1000 * 60 * 60);
          return sum + hours;
        }, 0);
        avgResponseHours = totalHours / responseTimeData.length;
      }

      // Previous period response time
      const { data: previousResponseTimeData } = await supabase
        .from('referrals')
        .select('referral_date, contact_date')
        .not('contact_date', 'is', null)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());

      let previousAvgResponseHours = 0;
      if (previousResponseTimeData && previousResponseTimeData.length > 0) {
        const totalHours = previousResponseTimeData.reduce((sum, ref) => {
          const referralTime = new Date(ref.referral_date).getTime();
          const contactTime = new Date(ref.contact_date).getTime();
          const hours = (contactTime - referralTime) / (1000 * 60 * 60);
          return sum + hours;
        }, 0);
        previousAvgResponseHours = totalHours / previousResponseTimeData.length;
      }

      const responseTrend = previousAvgResponseHours > 0
        ? Math.round(((avgResponseHours - previousAvgResponseHours) / previousAvgResponseHours) * 100)
        : 0;

      return {
        census: currentCensus || 0,
        censusTrend,
        conversionRate,
        conversionTrend,
        responseTime: avgResponseHours,
        responseTrend,
        activePartners: activeProspects || 0,
        todayReferrals: todayReferrals || 0,
        pendingFollowUps: pendingFollowUps || 0,
        monthlyReferrals: monthlyReferrals || 0,
        monthlyTrend
      };
    }
  });

  // Get recent activities for priority section
  const { data: recentActivities } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const { data } = await supabase
        .from('activity_communications')
        .select(`
          *,
          organizations(name)
        `)
        .order('activity_date', { ascending: false })
        .limit(10);

      return data || [];
    }
  });

  // Get overdue follow-ups
  const { data: overdueFollowUps } = useQuery({
    queryKey: ['overdue-followups'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data } = await supabase
        .from('activity_communications')
        .select(`
          *,
          organizations(name)
        `)
        .eq('follow_up_required', true)
        .eq('follow_up_completed', false)
        .lt('follow_up_date', today)
        .order('follow_up_date', { ascending: true })
        .limit(5);

      return data || [];
    }
  });

  const stats = dashboardStats || {
    census: 0,
    censusTrend: 0,
    conversionRate: 0,
    conversionTrend: 0,
    responseTime: 0,
    responseTrend: 0,
    activePartners: 0,
    todayReferrals: 0,
    pendingFollowUps: 0,
    monthlyReferrals: 0,
    monthlyTrend: 0
  };

  const formatResponseTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)} hrs`;
    } else {
      return `${Math.round(hours / 24)} days`;
    }
  };

  return (
    <PageLayout 
      title="CRM Dashboard" 
      subtitle="Elevate Hospice & Palliative Care"
    >
      <div className="space-y-6">
        {/* Header with Quick Actions */}
        <div className="flex justify-end">
          <div className="flex space-x-3">
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowQuickAdd(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Referral
            </Button>
          </div>
        </div>

        {/* Values Reminder */}
        <ValuesReminder />

        {/* Alert Center - Shows urgent actions needed */}
        <AlertCenter />

        {/* Enhanced Key Performance Indicators */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">KEY METRICS - LAST 30 DAYS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Census */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-50 to-green-100 rounded-full -mr-16 -mt-16" />
              <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-700" />
                    </div>
                    <CardTitle className="text-sm font-medium text-gray-600">Census</CardTitle>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => setShowCensusManager(true)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      {statsLoading ? '...' : stats.census}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">patients</p>
                  </div>
                  {stats.censusTrend !== 0 && !statsLoading && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      stats.censusTrend > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.censusTrend > 0 ? '+' : ''}{stats.censusTrend}%
                      {stats.censusTrend > 0 ? '↗️' : '↘️'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Conversion Rate */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full -mr-16 -mt-16" />
              <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Target className="h-5 w-5 text-blue-700" />
                    </div>
                    <CardTitle className="text-sm font-medium text-gray-600">Conversion</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      {statsLoading ? '...' : `${stats.conversionRate}%`}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">rate</p>
                  </div>
                  {stats.conversionTrend !== 0 && !statsLoading && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      stats.conversionTrend > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.conversionTrend > 0 ? '+' : ''}{stats.conversionTrend}%
                      {stats.conversionTrend > 0 ? '↗️' : '↘️'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Response Time */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-50 to-purple-100 rounded-full -mr-16 -mt-16" />
              <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Clock className="h-5 w-5 text-purple-700" />
                    </div>
                    <CardTitle className="text-sm font-medium text-gray-600">Response Time</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      {statsLoading ? '...' : formatResponseTime(stats.responseTime)}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">average</p>
                  </div>
                  {stats.responseTrend !== 0 && !statsLoading && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      stats.responseTrend < 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.responseTrend > 0 ? '+' : ''}{Math.abs(stats.responseTrend)}%
                      {stats.responseTrend < 0 ? '↗️' : '↘️'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Active Partners */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-50 to-orange-100 rounded-full -mr-16 -mt-16" />
              <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Building className="h-5 w-5 text-orange-700" />
                    </div>
                    <CardTitle className="text-sm font-medium text-gray-600">Active Partners</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      {statsLoading ? '...' : stats.activePartners}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">organizations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">
                Today's Referrals
              </CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {statsLoading ? '...' : stats.todayReferrals}
              </div>
              <p className="text-xs text-green-600">New referrals today</p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">
                Monthly Referrals
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {statsLoading ? '...' : stats.monthlyReferrals}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-orange-600">This month</p>
                {stats.monthlyTrend !== 0 && !statsLoading && (
                  <span className={`text-xs font-medium ${
                    stats.monthlyTrend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.monthlyTrend > 0 ? '+' : ''}{stats.monthlyTrend}%
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">
                Pending Follow-ups
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">
                {statsLoading ? '...' : stats.pendingFollowUps}
              </div>
              <p className="text-xs text-red-600">
                {overdueFollowUps?.length || 0} overdue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Priority Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Overdue Follow-ups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overdueFollowUps && overdueFollowUps.length > 0 ? (
                  overdueFollowUps.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-red-900">
                          {activity.organizations?.name || 'Unknown Organization'}
                        </p>
                        <p className="text-sm text-red-600">
                          Due: {activity.follow_up_date ? format(new Date(activity.follow_up_date), 'MMM dd, yyyy') : 'No date'}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">Follow Up</Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No overdue follow-ups
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities && recentActivities.length > 0 ? (
                  recentActivities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">
                          {activity.interaction_type} with {activity.organizations?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(activity.activity_date), 'MMM dd, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No recent activities
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConversionFunnelChart />
          <SourcePerformanceChart />
        </div>

        {/* Training and Marketer Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrainingMetrics />
          <MarketerPerformance />
        </div>

        <QuickAddDialog 
          open={showQuickAdd} 
          onOpenChange={setShowQuickAdd} 
        />

        <CensusManager
          open={showCensusManager}
          onOpenChange={setShowCensusManager}
        />
      </div>
    </PageLayout>
  );
};

export default Dashboard;
