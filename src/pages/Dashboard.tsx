
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, FileText, TrendingUp, Users, Phone, AlertCircle, Building } from "lucide-react";
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

const Dashboard = () => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const { displayName } = useAuth();

  // Fetch real dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const thisMonth = startOfMonth(new Date());
      const thirtyDaysAgo = subDays(new Date(), 30);

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

      const totalRecentReferrals = recentReferrals?.length || 0;
      const admittedReferrals = recentReferrals?.filter(r => 
        r.status === 'admitted' || r.status === 'admitted_our_hospice'
      ).length || 0;
      
      const conversionRate = totalRecentReferrals > 0 
        ? Math.round((admittedReferrals / totalRecentReferrals) * 100) 
        : 0;

      return {
        todayReferrals: todayReferrals || 0,
        pendingFollowUps: pendingFollowUps || 0,
        activeProspects: activeProspects || 0,
        monthlyReferrals: monthlyReferrals || 0,
        conversionRate
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
    todayReferrals: 0,
    pendingFollowUps: 0,
    activeProspects: 0,
    monthlyReferrals: 0,
    conversionRate: 0
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
            <Button variant="outline">
              <Phone className="w-4 h-4 mr-2" />
              Log Call
            </Button>
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Visit
            </Button>
          </div>
        </div>

        {/* Key Metrics Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">
                Today's Referrals
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
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
                Pending Follow-ups
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {statsLoading ? '...' : stats.pendingFollowUps}
              </div>
              <p className="text-xs text-orange-600">
                {overdueFollowUps?.length || 0} overdue
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">
                Active Prospects
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {statsLoading ? '...' : stats.activeProspects}
              </div>
              <p className="text-xs text-blue-600">Organizations in pipeline</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">
                Monthly Referrals
              </CardTitle>
              <Building className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {statsLoading ? '...' : stats.monthlyReferrals}
              </div>
              <p className="text-xs text-purple-600">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-indigo-50 border-indigo-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-800">
                Conversion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-900">
                {statsLoading ? '...' : `${stats.conversionRate}%`}
              </div>
              <p className="text-xs text-indigo-600">Last 30 days</p>
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
      </div>
    </PageLayout>
  );
};

export default Dashboard;
