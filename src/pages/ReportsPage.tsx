
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/layout/PageLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Calendar, TrendingUp, Users, Building, Phone } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const ReportsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  const getDateRange = (period: string) => {
    const now = new Date();
    switch (period) {
      case 'current-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last-month':
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case 'last-3-months':
        return { start: startOfMonth(subMonths(now, 3)), end: endOfMonth(now) };
      case 'last-6-months':
        return { start: startOfMonth(subMonths(now, 6)), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { start, end } = getDateRange(selectedPeriod);

  // Fetch referral summary data
  const { data: referralSummary, isLoading: referralLoading } = useQuery({
    queryKey: ['referral-summary', selectedPeriod],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('status, created_at, assigned_marketer')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (error) throw error;

      const summary = {
        total: data.length,
        admitted: data.filter(r => r.status === 'admitted' || r.status === 'admitted_our_hospice').length,
        pending: data.filter(r => r.status === 'pending').length,
        contacted: data.filter(r => r.status === 'contacted').length,
        scheduled: data.filter(r => r.status === 'scheduled').length,
        conversionRate: data.length > 0 ? Math.round((data.filter(r => r.status === 'admitted' || r.status === 'admitted_our_hospice').length / data.length) * 100) : 0
      };

      return summary;
    }
  });

  // Fetch organization performance
  const { data: orgPerformance, isLoading: orgLoading } = useQuery({
    queryKey: ['org-performance', selectedPeriod],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          organization_id,
          status,
          organizations!inner(name)
        `)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (error) throw error;

      const orgMetrics: Record<string, any> = {};
      
      data.forEach(referral => {
        const orgName = referral.organizations?.name || 'Unknown';
        
        if (!orgMetrics[orgName]) {
          orgMetrics[orgName] = { name: orgName, total: 0, admitted: 0 };
        }
        
        orgMetrics[orgName].total++;
        if (referral.status === 'admitted' || referral.status === 'admitted_our_hospice') {
          orgMetrics[orgName].admitted++;
        }
      });

      return Object.values(orgMetrics)
        .map((org: any) => ({
          ...org,
          conversionRate: org.total > 0 ? Math.round((org.admitted / org.total) * 100) : 0
        }))
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 10);
    }
  });

  // Fetch marketer performance
  const { data: marketerPerformance, isLoading: marketerLoading } = useQuery({
    queryKey: ['marketer-performance', selectedPeriod],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('assigned_marketer, status')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .not('assigned_marketer', 'is', null);

      if (error) throw error;

      const marketerMetrics: Record<string, any> = {};
      
      data.forEach(referral => {
        const marketer = referral.assigned_marketer;
        if (!marketerMetrics[marketer]) {
          marketerMetrics[marketer] = { name: marketer, total: 0, admitted: 0 };
        }
        
        marketerMetrics[marketer].total++;
        if (referral.status === 'admitted' || referral.status === 'admitted_our_hospice') {
          marketerMetrics[marketer].admitted++;
        }
      });

      return Object.values(marketerMetrics)
        .map((marketer: any) => ({
          ...marketer,
          conversionRate: marketer.total > 0 ? Math.round((marketer.admitted / marketer.total) * 100) : 0
        }))
        .sort((a: any, b: any) => b.total - a.total);
    }
  });

  const generateReport = (reportType: string) => {
    // In a real implementation, this would generate and download a report
    console.log(`Generating ${reportType} report for period: ${selectedPeriod}`);
    alert(`${reportType} report generation started. You will be notified when it's ready for download.`);
  };

  return (
    <PageLayout title="Reports" subtitle="Generate and download comprehensive reports">
      <div className="space-y-6">
        {/* Period Selection */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Report Period</h3>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Referrals</p>
                  <p className="text-2xl font-bold">{referralSummary?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Admitted</p>
                  <p className="text-2xl font-bold">{referralSummary?.admitted || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold">{referralSummary?.conversionRate || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Orgs</p>
                  <p className="text-2xl font-bold">{orgPerformance?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Generation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Referral Summary</span>
              </CardTitle>
              <CardDescription>
                Detailed referral activity and conversion metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Total Referrals:</span>
                  <span className="font-medium">{referralSummary?.total || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pending:</span>
                  <span className="font-medium">{referralSummary?.pending || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Contacted:</span>
                  <span className="font-medium">{referralSummary?.contacted || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Admitted:</span>
                  <span className="font-medium">{referralSummary?.admitted || 0}</span>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={() => generateReport('Referral Summary')}
                disabled={referralLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Organization Performance</span>
              </CardTitle>
              <CardDescription>
                Top performing referral sources and conversion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {orgPerformance?.slice(0, 3).map((org, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="truncate max-w-[120px]">{org.name}</span>
                    <span className="font-medium">{org.total} ({org.conversionRate}%)</span>
                  </div>
                ))}
                {(!orgPerformance || orgPerformance.length === 0) && (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </div>
              <Button 
                className="w-full" 
                onClick={() => generateReport('Organization Performance')}
                disabled={orgLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Marketer Performance</span>
              </CardTitle>
              <CardDescription>
                Individual marketer metrics and conversion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {marketerPerformance?.slice(0, 3).map((marketer, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="truncate max-w-[120px]">{marketer.name}</span>
                    <span className="font-medium">{marketer.total} ({marketer.conversionRate}%)</span>
                  </div>
                ))}
                {(!marketerPerformance || marketerPerformance.length === 0) && (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </div>
              <Button 
                className="w-full" 
                onClick={() => generateReport('Marketer Performance')}
                disabled={marketerLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Conversion Funnel</span>
              </CardTitle>
              <CardDescription>
                Referral to admission conversion analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Pending → Contacted:</span>
                  <span className="font-medium">
                    {referralSummary?.pending && referralSummary?.contacted 
                      ? Math.round((referralSummary.contacted / (referralSummary.pending + referralSummary.contacted)) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Contacted → Scheduled:</span>
                  <span className="font-medium">
                    {referralSummary?.contacted && referralSummary?.scheduled 
                      ? Math.round((referralSummary.scheduled / referralSummary.contacted) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Overall Conversion:</span>
                  <span className="font-medium">{referralSummary?.conversionRate || 0}%</span>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={() => generateReport('Conversion Funnel')}
                disabled={referralLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Activity Report</span>
              </CardTitle>
              <CardDescription>
                Detailed activity log and follow-up tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => generateReport('Activity Report')}
              >
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Custom Date Range</span>
              </CardTitle>
              <CardDescription>
                Generate reports for specific time periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => generateReport('Custom Date Range')}
              >
                <Download className="w-4 h-4 mr-2" />
                Custom Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default ReportsPage;
