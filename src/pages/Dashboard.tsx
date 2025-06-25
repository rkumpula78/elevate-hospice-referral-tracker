
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

interface DashboardStats {
  todayReferrals: number;
  pendingFollowUps: number;
  activeProspects: number;
  monthlyReferrals: number;
  conversionRate: number;
}

const Dashboard = () => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const { displayName } = useAuth();

  // Mock stats for enhanced display
  const stats: DashboardStats = {
    todayReferrals: 3,
    pendingFollowUps: 7,
    activeProspects: 24,
    monthlyReferrals: 45,
    conversionRate: 78
  };

  // Fetch dashboard statistics
  const { data: dbStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [referralsCount, visitsCount, organizationsCount, patientsCount, admitsCount] = await Promise.all([
        supabase.from('referrals').select('*', { count: 'exact', head: true }),
        supabase.from('visits').select('*', { count: 'exact', head: true }),
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('patients').select('*', { count: 'exact', head: true }).not('admission_date', 'is', null)
      ]);

      return {
        referrals: referralsCount.count || 0,
        visits: visitsCount.count || 0,
        organizations: organizationsCount.count || 0,
        patients: patientsCount.count || 0,
        admits: admitsCount.count || 0
      };
    }
  });

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
              <div className="text-2xl font-bold text-green-900">{stats.todayReferrals}</div>
              <p className="text-xs text-green-600">+2 from yesterday</p>
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
              <div className="text-2xl font-bold text-orange-900">{stats.pendingFollowUps}</div>
              <p className="text-xs text-orange-600">3 overdue</p>
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
              <div className="text-2xl font-bold text-blue-900">{stats.activeProspects}</div>
              <p className="text-xs text-blue-600">5 A-rated accounts</p>
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
              <div className="text-2xl font-bold text-purple-900">{stats.monthlyReferrals}</div>
              <p className="text-xs text-purple-600">Goal: 50</p>
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
              <div className="text-2xl font-bold text-indigo-900">{stats.conversionRate}%</div>
              <p className="text-xs text-indigo-600">+5% vs last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Priority Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Today's Priorities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-red-900">Call Paradise Valley Estates</p>
                    <p className="text-sm text-red-600">Follow-up overdue by 2 days</p>
                  </div>
                  <Button size="sm" variant="outline">Call Now</Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-yellow-900">Visit HonorHealth Thompson Peak</p>
                    <p className="text-sm text-yellow-600">Scheduled for 2:00 PM</p>
                  </div>
                  <Button size="sm" variant="outline">Directions</Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-900">Email Arizona Cancer Care</p>
                    <p className="text-sm text-green-600">Send case study follow-up</p>
                  </div>
                  <Button size="sm" variant="outline">Send Email</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">New referral from Scottsdale Memory Care</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Meeting completed at Grayhawk Medical</p>
                    <p className="text-xs text-gray-500">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Follow-up email sent to Arizona Pulmonary</p>
                    <p className="text-xs text-gray-500">Yesterday</p>
                  </div>
                </div>
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
