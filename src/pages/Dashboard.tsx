
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, FileText, TrendingUp, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import QuickAddDialog from "@/components/crm/QuickAddDialog";
import ConversionFunnelChart from "@/components/charts/ConversionFunnelChart";
import SourcePerformanceChart from "@/components/charts/SourcePerformanceChart";
import MarketerPerformance from "@/components/charts/MarketerPerformance";
import PageLayout from "@/components/layout/PageLayout";

const Dashboard = () => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Fetch dashboard statistics
  const { data: stats } = useQuery({
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
      title="Dashboard" 
      subtitle="Welcome back, Sarah. Here's what's happening with your patients today."
    >
      <div className="space-y-6">
        {/* Quick Add Button */}
        <div className="flex justify-end">
          <Button onClick={() => setShowQuickAdd(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Quick Add
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Patient Satisfaction</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">94.2%</div>
              <p className="text-xs text-blue-600">+2.1% vs last month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Active Patients</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats?.patients || 0}</div>
              <p className="text-xs text-green-600">+12 this month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Referral Conversion</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">0%</div>
              <p className="text-xs text-purple-600">+5.3% vs last month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Staff Utilization</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">89.2%</div>
              <p className="text-xs text-orange-600">-1.2% this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConversionFunnelChart />
          <SourcePerformanceChart />
        </div>

        {/* Marketer Performance */}
        <MarketerPerformance />

        {/* Recent Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Patients (0)</CardTitle>
            <CardDescription>Latest patient admissions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              No patients found.
            </div>
          </CardContent>
        </Card>

        <QuickAddDialog 
          open={showQuickAdd} 
          onOpenChange={setShowQuickAdd} 
        />
      </div>
    </PageLayout>
  );
};

export default Dashboard;
