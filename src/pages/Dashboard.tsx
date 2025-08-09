import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, TrendingUp, AlertCircle, Building, Target, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import QuickAddDialog from "@/components/crm/QuickAddDialog";
import ConversionFunnelChart from "@/components/charts/ConversionFunnelChart";
import SourcePerformanceChart from "@/components/charts/SourcePerformanceChart";
import MarketerPerformance from "@/components/charts/MarketerPerformance";
import TrainingMetrics from "@/components/charts/TrainingMetrics";
import PageLayout from "@/components/layout/PageLayout";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import AlertCenter from "@/components/dashboard/AlertCenter";
import CensusManager from "@/components/dashboard/CensusManager";
import ValuesReminder from "@/components/dashboard/ValuesReminder";
import { fetchDashboardStats } from '@/lib/dashboard';
import KPICard from '@/components/dashboard/KPICard';

type ActivityWithOrganization = (Database['public']['Tables']['activity_communications']['Row'] & {
  organizations: { name: string | null } | null;
});

const Dashboard = () => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCensusManager, setShowCensusManager] = useState(false);
  useAuth();

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats
  });

  const { data: recentActivities } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const { data } = await supabase.from('activity_communications').select(`*, organizations(name)`).order('activity_date', { ascending: false }).limit(10);
      return data || [];
    }
  });

  const { data: overdueFollowUps } = useQuery({
    queryKey: ['overdue-followups'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('activity_communications').select(`*, organizations(name)`).eq('follow_up_required', true).eq('follow_up_completed', false).lt('follow_up_date', today).order('follow_up_date', { ascending: true }).limit(5);
      return data || [];
    }
  });

  const stats = dashboardStats || {
    census: 0, censusTrend: 0, conversionRate: 0, conversionTrend: 0,
    responseTime: 0, responseTrend: 0, activePartners: 0, todayReferrals: 0,
    pendingFollowUps: 0, monthlyReferrals: 0, monthlyTrend: 0
  };

  const formatResponseTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${hours.toFixed(1)} hrs`;
    return `${Math.round(hours / 24)} days`;
  };

  return (
    <PageLayout title="CRM Dashboard" subtitle="Elevate Hospice & Palliative Care">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowQuickAdd(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Referral
          </Button>
        </div>

        <ValuesReminder />
        <AlertCenter />

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">KEY METRICS - LAST 30 DAYS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Census"
              value={stats.census}
              unit="patients"
              trend={stats.censusTrend}
              Icon={TrendingUp}
              color="green"
              isLoading={statsLoading}
              onEdit={() => setShowCensusManager(true)}
            />
            <KPICard
              title="Conversion"
              value={`${stats.conversionRate}%`}
              unit="rate"
              trend={stats.conversionTrend}
              Icon={Target}
              color="blue"
              isLoading={statsLoading}
            />
            <KPICard
              title="Response Time"
              value={formatResponseTime(stats.responseTime)}
              unit="average"
              trend={stats.responseTrend}
              Icon={Clock}
              color="purple"
              isLoading={statsLoading}
              trendDirection="down"
            />
            <KPICard
              title="Active Partners"
              value={stats.activePartners}
              unit="organizations"
              trend={0} // No trend data for this metric
              Icon={Building}
              color="orange"
              isLoading={statsLoading}
            />
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Today's Referrals</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{statsLoading ? '...' : stats.todayReferrals}</div>
              <p className="text-xs text-green-600">New referrals today</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Monthly Referrals</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{statsLoading ? '...' : stats.monthlyReferrals}</div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-orange-600">This month</p>
                {stats.monthlyTrend !== 0 && !statsLoading && (
                  <span className={`text-xs font-medium ${stats.monthlyTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.monthlyTrend > 0 ? '+' : ''}{stats.monthlyTrend}%
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Pending Follow-ups</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">{statsLoading ? '...' : stats.pendingFollowUps}</div>
              <p className="text-xs text-red-600">{overdueFollowUps?.length || 0} overdue</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Priority Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-lg font-semibold">Overdue Follow-ups</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overdueFollowUps && overdueFollowUps.length > 0 ? (
                  overdueFollowUps.map((activity: ActivityWithOrganization) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-red-900">{activity.organizations?.name || 'Unknown Organization'}</p>
                        <p className="text-sm text-red-600">Due: {activity.follow_up_date ? format(new Date(activity.follow_up_date), 'MMM dd, yyyy') : 'No date'}</p>
                      </div>
                      <Button size="sm" variant="outline">Follow Up</Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">No overdue follow-ups</div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg font-semibold">Recent Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities && recentActivities.length > 0 ? (
                  recentActivities.slice(0, 5).map((activity: ActivityWithOrganization) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">{activity.interaction_type} with {activity.organizations?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{format(new Date(activity.activity_date), 'MMM dd, h:mm a')}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">No recent activities</div>
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

        <QuickAddDialog open={showQuickAdd} onOpenChange={setShowQuickAdd} />
        <CensusManager open={showCensusManager} onOpenChange={setShowCensusManager} />
      </div>
    </PageLayout>
  );
};

export default Dashboard;
