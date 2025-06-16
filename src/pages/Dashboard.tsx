
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, FileText, TrendingUp, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ReferralsList from "@/components/crm/ReferralsList";
import VisitsList from "@/components/crm/VisitsList";
import OrganizationsList from "@/components/crm/OrganizationsList";
import PatientsList from "@/components/crm/PatientsList";
import QuickAddDialog from "@/components/crm/QuickAddDialog";
import TotalAdmitsChart from "@/components/charts/TotalAdmitsChart";

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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CRM Dashboard</h1>
          <p className="text-muted-foreground">Manage referrals, visits, and care coordination</p>
        </div>
        <Button onClick={() => setShowQuickAdd(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Quick Add
        </Button>
      </div>

      {/* Statistics Cards - All four in one row, colorful and visually appealing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Scheduled Visits</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats?.visits || 0}</div>
            <p className="text-xs text-blue-600">Upcoming visits</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Referrals</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats?.referrals || 0}</div>
            <p className="text-xs text-green-600">Active referrals in system</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{stats?.patients || 0}</div>
            <p className="text-xs text-purple-600">Active and discharged patients</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Total Admits</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats?.admits || 0}</div>
            <p className="text-xs text-orange-600">Patients admitted</p>
          </CardContent>
        </Card>
      </div>

      {/* Total Admits Chart - Now separate detailed chart */}
      <TotalAdmitsChart />

      {/* Main Content Tabs */}
      <Tabs defaultValue="referrals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="visits">Visits</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
        </TabsList>

        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>Referral Pipeline</CardTitle>
              <CardDescription>Track patient referrals through the admission process</CardDescription>
            </CardHeader>
            <CardContent>
              <ReferralsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visits">
          <Card>
            <CardHeader>
              <CardTitle>Visit Schedule</CardTitle>
              <CardDescription>Upcoming and completed visits</CardDescription>
            </CardHeader>
            <CardContent>
              <VisitsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizations">
          <Card>
            <CardHeader>
              <CardTitle>Organizations</CardTitle>
              <CardDescription>Referral sources, marketers, and partner organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients">
          <Card>
            <CardHeader>
              <CardTitle>Patient Management</CardTitle>
              <CardDescription>Manage patient information and care coordination</CardDescription>
            </CardHeader>
            <CardContent>
              <PatientsList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <QuickAddDialog 
        open={showQuickAdd} 
        onOpenChange={setShowQuickAdd} 
      />
    </div>
  );
};

export default Dashboard;
