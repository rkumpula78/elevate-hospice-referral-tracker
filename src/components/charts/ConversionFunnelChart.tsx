
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

const ConversionFunnelChart = () => {
  const { data: funnelData, isLoading } = useQuery({
    queryKey: ['conversion-funnel'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('status')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Count referrals by status in funnel order
      const statusCounts = {
        pending: 0,
        contacted: 0,
        scheduled: 0,
        admitted: 0,
        admitted_our_hospice: 0
      };

      data.forEach(referral => {
        if (referral.status && statusCounts.hasOwnProperty(referral.status)) {
          statusCounts[referral.status as keyof typeof statusCounts]++;
        }
      });

      // Create funnel data with conversion rates
      const funnelSteps = [
        { stage: 'Pending', count: statusCounts.pending, color: '#f59e0b' },
        { stage: 'Contacted', count: statusCounts.contacted, color: '#3b82f6' },
        { stage: 'Scheduled', count: statusCounts.scheduled, color: '#8b5cf6' },
        { stage: 'Admitted', count: statusCounts.admitted + statusCounts.admitted_our_hospice, color: '#10b981' }
      ];

      // Calculate conversion rates
      const total = funnelSteps[0].count;
      return funnelSteps.map((step, index) => ({
        ...step,
        percentage: total > 0 ? Math.round((step.count / total) * 100) : 0,
        conversionRate: index > 0 && funnelSteps[index - 1].count > 0 
          ? Math.round((step.count / funnelSteps[index - 1].count) * 100) 
          : 100
      }));
    }
  });

  const chartConfig = {
    count: {
      label: "Referrals",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Referral Conversion Funnel</CardTitle>
        <CardDescription>Track referral progression through pipeline stages</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div>Loading funnel data...</div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="horizontal">
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="stage" 
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="font-medium">{data.stage}</p>
                          <p className="text-sm">Count: {data.count}</p>
                          <p className="text-sm">Of Total: {data.percentage}%</p>
                          {data.conversionRate < 100 && (
                            <p className="text-sm">Conversion: {data.conversionRate}%</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {funnelData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        {funnelData && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {funnelData.map((step) => (
              <div key={step.stage} className="text-center">
                <div className="font-medium text-gray-900">{step.count}</div>
                <div className="text-gray-600">{step.stage}</div>
                <div className="text-xs text-gray-500">{step.percentage}% of total</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversionFunnelChart;
