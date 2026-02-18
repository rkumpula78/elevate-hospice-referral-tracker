import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Plus, Calendar, FileText, TrendingUp, Users, Phone, AlertCircle, Building, Target, Clock, Edit2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
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
import GrowthMetricsCard from "@/components/dashboard/GrowthMetricsCard";
import { TrendMetricCard } from "@/components/dashboard/TrendMetricCard";

const Dashboard = () => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCensusManager, setShowCensusManager] = useState(false);
  const { displayName } = useAuth();
  const isMobile = useIsMobile();

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
            .from('census_entries')
            .select('*')
            .order('census_date', { ascending: false })
            .limit(1)
            .single();

          if (latestCensus) {
            currentCensus = latestCensus.patient_count;
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
            .from('census_entries')
            .select('*')
            .eq('census_date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
            .maybeSingle();

          if (previousCensus) {
            censusPrevious = previousCensus.patient_count;
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

      // Get 7-day sparkline data for census
      const censusSparkline = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateKey = `census_${format(date, 'yyyy-MM-dd')}`;
        const dayData = localStorage.getItem(dateKey);
        
        if (dayData) {
          censusSparkline.push({ value: JSON.parse(dayData).patient_count });
        } else {
          censusSparkline.push({ value: currentCensus });
        }
      }

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

      // Get 7-day sparkline data for referrals
      const referralsSparkline = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        
        const { count } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());
        
        referralsSparkline.push({ value: count || 0 });
      }

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

      // Get 7-day sparkline data for conversion
      const conversionSparkline = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        
        const { data: dayReferrals } = await supabase
          .from('referrals')
          .select('status')
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());
        
        const dayTotal = dayReferrals?.length || 0;
        const dayAdmitted = dayReferrals?.filter(r => 
          r.status === 'admitted' || r.status === 'admitted_our_hospice'
        ).length || 0;
        
        const dayConversion = dayTotal > 0 ? Math.round((dayAdmitted / dayTotal) * 100) : 0;
        conversionSparkline.push({ value: dayConversion });
      }

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

      // Get 7-day sparkline data for response time
      const responseSparkline = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        
        const { data: dayResponseData } = await supabase
          .from('referrals')
          .select('referral_date, contact_date')
          .not('contact_date', 'is', null)
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());
        
        if (dayResponseData && dayResponseData.length > 0) {
          const dayHours = dayResponseData.reduce((sum, ref) => {
            const referralTime = new Date(ref.referral_date).getTime();
            const contactTime = new Date(ref.contact_date).getTime();
            const hours = (contactTime - referralTime) / (1000 * 60 * 60);
            return sum + hours;
          }, 0) / dayResponseData.length;
          responseSparkline.push({ value: Math.round(dayHours) });
        } else {
          responseSparkline.push({ value: avgResponseHours });
        }
      }

      return {
        census: currentCensus || 0,
        censusTrend,
        censusSparkline,
        censusPrevious,
        conversionRate,
        conversionTrend,
        conversionSparkline,
        previousConversionRate,
        responseTime: avgResponseHours,
        responseTrend,
        responseSparkline,
        previousAvgResponseHours,
        activePartners: activeProspects || 0,
        todayReferrals: todayReferrals || 0,
        pendingFollowUps: pendingFollowUps || 0,
        monthlyReferrals: monthlyReferrals || 0,
        monthlyTrend,
        referralsSparkline,
        lastMonthReferrals
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
    censusSparkline: [],
    censusPrevious: 0,
    conversionRate: 0,
    conversionTrend: 0,
    conversionSparkline: [],
    previousConversionRate: 0,
    responseTime: 0,
    responseTrend: 0,
    responseSparkline: [],
    previousAvgResponseHours: 0,
    activePartners: 0,
    todayReferrals: 0,
    pendingFollowUps: 0,
    monthlyReferrals: 0,
    monthlyTrend: 0,
    referralsSparkline: [],
    lastMonthReferrals: 0
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
        {/* Header with Quick Actions - Mobile optimized */}
        <div className="flex justify-end">
          <Button 
            onClick={() => setShowQuickAdd(true)}
            className="shadow-lg touch-manipulation w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Referral
          </Button>
        </div>

        {/* Values Reminder */}
        <ValuesReminder />

        {/* Alert Center - Shows urgent actions needed */}
        <AlertCenter />

        {/* Enhanced Key Performance Indicators */}
        <div className="mb-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">KEY METRICS - LAST 30 DAYS</h2>
          {isMobile ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!statsLoading ? (
                <>
                {/* Census */}
                <TrendMetricCard
                  title="Census"
                  value={stats.census}
                  icon={TrendingUp}
                  iconColor="text-green-700"
                  iconBgColor="bg-green-100"
                  gradientFrom="from-green-50"
                  gradientTo="to-green-100"
                  trend={stats.censusTrend}
                  comparisonText="vs 30 days ago"
                  sparklineData={stats.censusSparkline}
                  tooltipData={{
                    currentValue: `${stats.census} patients`,
                    previousValue: `${stats.censusPrevious} patients`,
                    exactChange: `${stats.censusTrend > 0 ? '+' : ''}${stats.census - stats.censusPrevious} patients`,
                    dateRange: format(subDays(new Date(), 30), 'MMM d') + ' - ' + format(new Date(), 'MMM d, yyyy')
                  }}
                  editButton={
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => setShowCensusManager(true)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  }
                />

                {/* Conversion Rate */}
                <TrendMetricCard
                  title="Conversion"
                  value={`${stats.conversionRate}%`}
                  icon={Target}
                  iconColor="text-blue-700"
                  iconBgColor="bg-blue-100"
                  gradientFrom="from-blue-50"
                  gradientTo="to-blue-100"
                  trend={stats.conversionTrend}
                  comparisonText="vs last 30 days"
                  sparklineData={stats.conversionSparkline}
                  tooltipData={{
                    currentValue: `${stats.conversionRate}% conversion`,
                    previousValue: `${stats.previousConversionRate}% conversion`,
                    exactChange: `${stats.conversionTrend > 0 ? '+' : ''}${stats.conversionTrend}%`,
                    dateRange: 'Last 30 days vs previous 30 days'
                  }}
                />

                {/* Response Time */}
                <TrendMetricCard
                  title="Response Time"
                  value={formatResponseTime(stats.responseTime)}
                  icon={Clock}
                  iconColor="text-purple-700"
                  iconBgColor="bg-purple-100"
                  gradientFrom="from-purple-50"
                  gradientTo="to-purple-100"
                  trend={-stats.responseTrend}
                  comparisonText="vs last 30 days"
                  sparklineData={stats.responseSparkline}
                  tooltipData={{
                    currentValue: formatResponseTime(stats.responseTime),
                    previousValue: formatResponseTime(stats.previousAvgResponseHours),
                    exactChange: `${stats.responseTrend > 0 ? '+' : ''}${stats.responseTrend}% ${stats.responseTrend < 0 ? 'faster' : 'slower'}`,
                    dateRange: 'Last 30 days vs previous 30 days'
                  }}
                />

                {/* Active Partners */}
                <TrendMetricCard
                  title="Active Partners"
                  value={stats.activePartners}
                  icon={Building}
                  iconColor="text-orange-700"
                  iconBgColor="bg-orange-100"
                  gradientFrom="from-orange-50"
                  gradientTo="to-orange-100"
                  trend={0}
                  comparisonText="prospect & active organizations"
                  tooltipData={{
                    currentValue: `${stats.activePartners} organizations`,
                    previousValue: 'N/A',
                    exactChange: 'N/A',
                    dateRange: 'Current active partners'
                  }}
                />
              </>
            ) : (
              <>
                <Card className="relative overflow-hidden">
                  <CardHeader className="relative pb-2 p-3 sm:p-5 md:p-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-700" />
                      </div>
                      <CardTitle className="text-sm font-medium text-muted-foreground">Census</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="relative p-3 sm:p-5 md:p-6">
                    <div className="text-3xl font-bold">...</div>
                  </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                  <CardHeader className="relative pb-2 p-3 sm:p-5 md:p-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Target className="h-5 w-5 text-blue-700" />
                      </div>
                      <CardTitle className="text-sm font-medium text-muted-foreground">Conversion</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="relative p-3 sm:p-5 md:p-6">
                    <div className="text-3xl font-bold">...</div>
                  </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                  <CardHeader className="relative pb-2 p-3 sm:p-5 md:p-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Clock className="h-5 w-5 text-purple-700" />
                      </div>
                      <CardTitle className="text-sm font-medium text-muted-foreground">Response Time</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="relative p-3 sm:p-5 md:p-6">
                    <div className="text-3xl font-bold">...</div>
                  </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                  <CardHeader className="relative pb-2 p-3 sm:p-5 md:p-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Building className="h-5 w-5 text-orange-700" />
                      </div>
                      <CardTitle className="text-sm font-medium text-muted-foreground">Active Partners</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="relative p-3 sm:p-5 md:p-6">
                    <div className="text-3xl font-bold">...</div>
                  </CardContent>
                </Card>
              </>
            )}
            </div>
          ) : (
            <TooltipProvider>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!statsLoading ? (
                <>
                {/* Census */}
                <TrendMetricCard
                  title="Census"
                  value={stats.census}
                  icon={TrendingUp}
                  iconColor="text-green-700"
                  iconBgColor="bg-green-100"
                  gradientFrom="from-green-50"
                  gradientTo="to-green-100"
                  trend={stats.censusTrend}
                  comparisonText="vs 30 days ago"
                  sparklineData={stats.censusSparkline}
                  tooltipData={{
                    currentValue: `${stats.census} patients`,
                    previousValue: `${stats.censusPrevious} patients`,
                    exactChange: `${stats.censusTrend > 0 ? '+' : ''}${stats.census - stats.censusPrevious} patients`,
                    dateRange: format(subDays(new Date(), 30), 'MMM d') + ' - ' + format(new Date(), 'MMM d, yyyy')
                  }}
                  editButton={
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => setShowCensusManager(true)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  }
                />

                {/* Conversion Rate */}
                <TrendMetricCard
                  title="Conversion"
                  value={`${stats.conversionRate}%`}
                  icon={Target}
                  iconColor="text-blue-700"
                  iconBgColor="bg-blue-100"
                  gradientFrom="from-blue-50"
                  gradientTo="to-blue-100"
                  trend={stats.conversionTrend}
                  comparisonText="vs last 30 days"
                  sparklineData={stats.conversionSparkline}
                  tooltipData={{
                    currentValue: `${stats.conversionRate}% conversion`,
                    previousValue: `${stats.previousConversionRate}% conversion`,
                    exactChange: `${stats.conversionTrend > 0 ? '+' : ''}${stats.conversionTrend}%`,
                    dateRange: 'Last 30 days vs previous 30 days'
                  }}
                />

                {/* Response Time */}
                <TrendMetricCard
                  title="Response Time"
                  value={formatResponseTime(stats.responseTime)}
                  icon={Clock}
                  iconColor="text-purple-700"
                  iconBgColor="bg-purple-100"
                  gradientFrom="from-purple-50"
                  gradientTo="to-purple-100"
                  trend={-stats.responseTrend}
                  comparisonText="vs last 30 days"
                  sparklineData={stats.responseSparkline}
                  tooltipData={{
                    currentValue: formatResponseTime(stats.responseTime),
                    previousValue: formatResponseTime(stats.previousAvgResponseHours),
                    exactChange: `${stats.responseTrend > 0 ? '+' : ''}${stats.responseTrend}% ${stats.responseTrend < 0 ? 'faster' : 'slower'}`,
                    dateRange: 'Last 30 days vs previous 30 days'
                  }}
                />

                {/* Active Partners */}
                <TrendMetricCard
                  title="Active Partners"
                  value={stats.activePartners}
                  icon={Building}
                  iconColor="text-orange-700"
                  iconBgColor="bg-orange-100"
                  gradientFrom="from-orange-50"
                  gradientTo="to-orange-100"
                  trend={0}
                  comparisonText="prospect & active organizations"
                  tooltipData={{
                    currentValue: `${stats.activePartners} organizations`,
                    previousValue: 'N/A',
                    exactChange: 'N/A',
                    dateRange: 'Current active partners'
                  }}
                />
              </>
            ) : (
              <>
                <Card className="relative overflow-hidden">
                  <CardHeader className="relative pb-2 p-3 sm:p-5 md:p-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-700" />
                      </div>
                      <CardTitle className="text-sm font-medium text-muted-foreground">Census</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="relative p-3 sm:p-5 md:p-6">
                    <div className="text-3xl font-bold">...</div>
                  </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                  <CardHeader className="relative pb-2 p-3 sm:p-5 md:p-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Target className="h-5 w-5 text-blue-700" />
                      </div>
                      <CardTitle className="text-sm font-medium text-muted-foreground">Conversion</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="relative p-3 sm:p-5 md:p-6">
                    <div className="text-3xl font-bold">...</div>
                  </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                  <CardHeader className="relative pb-2 p-3 sm:p-5 md:p-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Clock className="h-5 w-5 text-purple-700" />
                      </div>
                      <CardTitle className="text-sm font-medium text-muted-foreground">Response Time</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="relative p-3 sm:p-5 md:p-6">
                    <div className="text-3xl font-bold">...</div>
                  </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                  <CardHeader className="relative pb-2 p-3 sm:p-5 md:p-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Building className="h-5 w-5 text-orange-700" />
                      </div>
                      <CardTitle className="text-sm font-medium text-muted-foreground">Active Partners</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="relative p-3 sm:p-5 md:p-6">
                    <div className="text-3xl font-bold">...</div>
                  </CardContent>
                </Card>
              </>
            )}
              </div>
            </TooltipProvider>
          )}
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TrainingMetrics />
          <MarketerPerformance />
          <GrowthMetricsCard />
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
