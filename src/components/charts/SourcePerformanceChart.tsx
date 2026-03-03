
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import ChartExportButton from "@/components/ui/chart-export-button";
import { exportChartData } from "@/lib/exportUtils";

const SourcePerformanceChart = () => {
  const { data: sourceData, isLoading } = useQuery({
    queryKey: ['source-performance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          organization_id,
          status,
          organizations!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by organization and calculate metrics
      const orgMetrics: Record<string, any> = {};
      
      data.forEach(referral => {
        const orgName = referral.organizations?.name || 'Unknown';
        
        if (!orgMetrics[orgName]) {
          orgMetrics[orgName] = {
            name: orgName,
            total: 0,
            admitted: 0,
            pending: 0,
            contacted: 0,
            scheduled: 0
          };
        }
        
        orgMetrics[orgName].total++;
        
        if (referral.status === 'admitted' || referral.status === 'admitted_our_hospice') {
          orgMetrics[orgName].admitted++;
        } else if (referral.status) {
          orgMetrics[orgName][referral.status]++;
        }
      });

      // Convert to array and calculate conversion rates
      return Object.values(orgMetrics)
        .map((org: any) => ({
          ...org,
          conversionRate: org.total > 0 ? Math.round((org.admitted / org.total) * 100) : 0
        }))
        .filter((org: any) => org.total > 0)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 10); // Top 10 sources
    }
  });

  const chartConfig = {
    total: {
      label: "Total Referrals",
      color: "#3b82f6",
    },
    admitted: {
      label: "Admitted",
      color: "#10b981",
    },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Top Referral Sources</CardTitle>
            <CardDescription>Performance by referring organization (Top 10)</CardDescription>
          </div>
          <ChartExportButton onClick={() => {
            if (sourceData) exportChartData(sourceData, 'referral-sources', [
              { key: 'name', label: 'Organization' },
              { key: 'total', label: 'Total' },
              { key: 'admitted', label: 'Admitted' },
              { key: 'conversionRate', label: 'Conversion Rate (%)' },
            ]);
          }} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div>Loading source data...</div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm">Total Referrals: {data.total}</p>
                          <p className="text-sm">Admitted: {data.admitted}</p>
                          <p className="text-sm">Conversion Rate: {data.conversionRate}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default SourcePerformanceChart;
