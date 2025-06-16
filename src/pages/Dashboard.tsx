
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, FileText, TrendingUp } from "lucide-react";
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
      const [referralsCount, visitsCount, organizationsCount, patientsCount] = await Promise.all([
        supabase.from('referrals').select('*', { count: 'exact', head: true }),
        supabase.from('visits').select('*', { count: 'exact', head: true }),
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('patients').select('*', { count: 'exact', head: true })
      ]);

      return {
        referrals: referralsCount.count || 0,
        visits: visitsCount.count || 0,
        organizations: organizationsCount.count || 0,
        patients: patientsCount.count || 0
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

      {/* Total Admits Chart */}
      <TotalAdmitsChart />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.referrals || 0}</div>
            <p className="text-xs text-muted-foreground">Active referrals in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Visits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.visits || 0}</div>
            <p className="text-xs text-muted-foreground">Upcoming visits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.organizations || 0}</div>
            <p className="text-xs text-muted-foreground">Referral sources & marketers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.patients || 0}</div>
            <p className="text-xs text-muted-foreground">Active and discharged patients</p>
          </CardContent>
        </Card>
      </div>

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
