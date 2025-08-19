import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { PieChart, BarChart3, TrendingUp, Building, Users, Target, AlertTriangle, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface SegmentMixAnalysisProps {
  period?: 'month' | 'quarter';
}

const SegmentMixAnalysis: React.FC<SegmentMixAnalysisProps> = ({ period = 'month' }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter'>(period);

  // Segment colors for consistency
  const segmentColors: Record<string, string> = {
    hospital: '#3B82F6',
    snf: '#10B981',
    alf: '#F59E0B',
    physician: '#8B5CF6',
    home_health: '#06B6D4',
    other: '#6B7280'
  };

  // Fetch segment performance data
  const { data: segmentData, isLoading } = useQuery({
    queryKey: ['segment-mix-analysis', selectedPeriod],
    queryFn: async () => {
      const now = new Date();
      const currentStart = startOfMonth(now);
      const currentEnd = endOfMonth(now);
      const previousStart = startOfMonth(subMonths(now, 1));
      const previousEnd = endOfMonth(subMonths(now, 1));

      // Get current period data
      const { data: currentSegments } = await supabase
        .from('segment_performance')
        .select('*')
        .gte('period_date', currentStart.toISOString().split('T')[0])
        .lte('period_date', currentEnd.toISOString().split('T')[0]);

      // Get previous period for comparison
      const { data: previousSegments } = await supabase
        .from('segment_performance')
        .select('*')
        .gte('period_date', previousStart.toISOString().split('T')[0])
        .lte('period_date', previousEnd.toISOString().split('T')[0]);

      // Get organization counts by segment
      const { data: organizations } = await supabase
        .from('organizations')
        .select('segment_type, account_tier, is_active')
        .eq('is_active', true);

      // Get referrals by organization segment
      const { data: referrals } = await supabase
        .from('referrals')
        .select(`
          *,
          organizations(segment_type)
        `)
        .gte('created_at', currentStart.toISOString())
        .lte('created_at', currentEnd.toISOString());

      // Process organization distribution
      const orgsBySegment = organizations?.reduce((acc, org) => {
        const segment = org.segment_type || 'other';
        if (!acc[segment]) {
          acc[segment] = { total: 0, A: 0, B: 0, C: 0, P: 0 };
        }
        acc[segment].total++;
        acc[segment][org.account_tier as keyof typeof acc[typeof segment]]++;
        return acc;
      }, {} as Record<string, any>) || {};

      // Process referrals by segment
      const referralsBySegment = referrals?.reduce((acc, ref) => {
        const segment = ref.organizations?.segment_type || 'other';
        if (!acc[segment]) {
          acc[segment] = { referrals: 0, admissions: 0 };
        }
        acc[segment].referrals++;
        if (ref.status === 'admitted' || ref.status === 'admitted_our_hospice') {
          acc[segment].admissions++;
        }
        return acc;
      }, {} as Record<string, any>) || {};

      // Calculate conversion rates
      const segmentPerformance = Object.keys(orgsBySegment).map(segment => {
        const orgs = orgsBySegment[segment];
        const performance = referralsBySegment[segment] || { referrals: 0, admissions: 0 };
        const conversionRate = performance.referrals > 0 
          ? (performance.admissions / performance.referrals) * 100 
          : 0;

        return {
          segment,
          totalAccounts: orgs.total,
          aAccounts: orgs.A || 0,
          bAccounts: orgs.B || 0,
          cAccounts: orgs.C || 0,
          pAccounts: orgs.P || 0,
          referrals: performance.referrals,
          admissions: performance.admissions,
          conversionRate: parseFloat(conversionRate.toFixed(1))
        };
      });

      // Calculate totals for percentages
      const totalReferrals = segmentPerformance.reduce((sum, s) => sum + s.referrals, 0);
      const totalAccounts = segmentPerformance.reduce((sum, s) => sum + s.totalAccounts, 0);

      // Add percentage calculations
      const segmentAnalysis = segmentPerformance.map(segment => ({
        ...segment,
        referralPercentage: totalReferrals > 0 
          ? parseFloat(((segment.referrals / totalReferrals) * 100).toFixed(1))
          : 0,
        accountPercentage: totalAccounts > 0
          ? parseFloat(((segment.totalAccounts / totalAccounts) * 100).toFixed(1))
          : 0
      }));

      return {
        segments: segmentAnalysis,
        totalReferrals,
        totalAccounts,
        overallConversion: totalReferrals > 0 
          ? parseFloat(((segmentAnalysis.reduce((sum, s) => sum + s.admissions, 0) / totalReferrals) * 100).toFixed(1))
          : 0
      };
    }
  });

  // Update segment performance mutation
  const updateSegmentMutation = useMutation({
    mutationFn: async ({ segment, data }: { segment: string, data: any }) => {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('segment_performance')
        .upsert({
          period_date: today,
          segment_type: segment,
          ...data
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Segment performance updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['segment-mix-analysis'] });
    },
    onError: () => {
      toast({ title: "Error updating segment performance", variant: "destructive" });
    }
  });

  const getSegmentLabel = (segment: string) => {
    const labels: Record<string, string> = {
      hospital: 'Hospital',
      snf: 'Skilled Nursing',
      alf: 'Assisted Living',
      physician: 'Physician Office',
      home_health: 'Home Health',
      other: 'Other'
    };
    return labels[segment] || segment;
  };

  const getPerformanceStatus = (conversionRate: number) => {
    if (conversionRate >= 70) return { color: 'text-green-600', bg: 'bg-green-100', label: 'Excellent' };
    if (conversionRate >= 50) return { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Good' };
    if (conversionRate >= 30) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Fair' };
    return { color: 'text-red-600', bg: 'bg-red-100', label: 'Needs Improvement' };
  };

  const pieChartData = segmentData?.segments.map(segment => ({
    name: getSegmentLabel(segment.segment),
    value: segment.referrals,
    percentage: segment.referralPercentage,
    color: segmentColors[segment.segment]
  })) || [];

  const barChartData = segmentData?.segments.map(segment => ({
    segment: getSegmentLabel(segment.segment),
    referrals: segment.referrals,
    conversionRate: segment.conversionRate,
    accounts: segment.totalAccounts
  })) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Segment Mix Analysis
            </CardTitle>
            <CardDescription>Analyze performance across different market segments</CardDescription>
          </div>
          <Select value={selectedPeriod} onValueChange={(value: 'month' | 'quarter') => setSelectedPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading segment analysis...</p>
        ) : segmentData ? (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Total Accounts</span>
                </div>
                <div className="text-2xl font-bold">{segmentData.totalAccounts}</div>
                <p className="text-sm text-muted-foreground">Active organizations</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Total Referrals</span>
                </div>
                <div className="text-2xl font-bold">{segmentData.totalReferrals}</div>
                <p className="text-sm text-muted-foreground">This period</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Overall Conversion</span>
                </div>
                <div className="text-2xl font-bold">{segmentData.overallConversion}%</div>
                <p className="text-sm text-muted-foreground">Referral to admission</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart - Referral Distribution */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-4">Referral Distribution by Segment</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart - Conversion Rates */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-4">Conversion Rates by Segment</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segment" fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="conversionRate" fill="#8884d8" name="Conversion Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Segment Breakdown */}
            <div>
              <h4 className="font-medium mb-4">Segment Performance Details</h4>
              <div className="space-y-3">
                {segmentData.segments.map((segment) => {
                  const status = getPerformanceStatus(segment.conversionRate);
                  return (
                    <div key={segment.segment} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: segmentColors[segment.segment] }}
                          />
                          <h5 className="font-medium">{getSegmentLabel(segment.segment)}</h5>
                          <Badge className={`${status.bg} ${status.color} border-0`}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{segment.conversionRate}%</div>
                          <p className="text-xs text-muted-foreground">conversion rate</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Accounts</p>
                          <p className="font-semibold">{segment.totalAccounts}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Referrals</p>
                          <p className="font-semibold">{segment.referrals}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Admissions</p>
                          <p className="font-semibold">{segment.admissions}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">% of Total</p>
                          <p className="font-semibold">{segment.referralPercentage}%</p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-2">Account Tier Distribution</p>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-green-700">A: {segment.aAccounts}</Badge>
                          <Badge variant="outline" className="text-yellow-700">B: {segment.bAccounts}</Badge>
                          <Badge variant="outline" className="text-orange-700">C: {segment.cAccounts}</Badge>
                          <Badge variant="outline" className="text-blue-700">P: {segment.pAccounts}</Badge>
                        </div>
                      </div>

                      <Progress 
                        value={segment.conversionRate} 
                        className="h-2" 
                        style={{ 
                          backgroundColor: `${segmentColors[segment.segment]}20`,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance Recommendations */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Performance Insights
              </h4>
              <div className="space-y-2">
                {segmentData.segments
                  .filter(s => s.conversionRate < 30)
                  .map(s => (
                    <div key={s.segment} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span>{getSegmentLabel(s.segment)} conversion rate ({s.conversionRate}%) needs improvement</span>
                    </div>
                  ))}
                {segmentData.segments
                  .filter(s => s.conversionRate >= 70)
                  .map(s => (
                    <div key={s.segment} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{getSegmentLabel(s.segment)} performing excellently ({s.conversionRate}%)</span>
                    </div>
                  ))}
                {segmentData.segments
                  .filter(s => s.totalAccounts < 5)
                  .map(s => (
                    <div key={s.segment} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>{getSegmentLabel(s.segment)} has limited account coverage ({s.totalAccounts} accounts)</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No segment data available
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SegmentMixAnalysis;