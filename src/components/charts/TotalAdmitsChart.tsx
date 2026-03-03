
import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format, startOfWeek, startOfMonth, startOfYear, eachWeekOfInterval, eachMonthOfInterval, subDays, subMonths, subYears } from "date-fns";
import ChartExportButton from "@/components/ui/chart-export-button";
import { exportChartData } from "@/lib/exportUtils";

type TimePeriod = 'week' | 'month' | 'ytd';

const TotalAdmitsChart = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');

  const { data: admitsData, isLoading } = useQuery({
    queryKey: ['total-admits', selectedPeriod],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;
      let dateFormat: string;
      let intervals: Date[];

      switch (selectedPeriod) {
        case 'week':
          startDate = subDays(now, 28); // Last 4 weeks
          dateFormat = 'MMM dd';
          intervals = eachWeekOfInterval({ start: startDate, end: now }, { weekStartsOn: 1 });
          break;
        case 'month':
          startDate = subMonths(now, 12); // Last 12 months
          dateFormat = 'MMM yyyy';
          intervals = eachMonthOfInterval({ start: startDate, end: now });
          break;
        case 'ytd':
          startDate = startOfYear(now);
          dateFormat = 'MMM yyyy';
          intervals = eachMonthOfInterval({ start: startDate, end: now });
          break;
        default:
          startDate = subMonths(now, 12);
          dateFormat = 'MMM yyyy';
          intervals = eachMonthOfInterval({ start: startDate, end: now });
      }

      const { data, error } = await supabase
        .from('patients')
        .select('admission_date')
        .gte('admission_date', startDate.toISOString())
        .not('admission_date', 'is', null)
        .order('admission_date', { ascending: true });

      if (error) throw error;

      // Group admits by time period
      const admitCounts = intervals.map(intervalStart => {
        let intervalEnd: Date;
        
        if (selectedPeriod === 'week') {
          intervalEnd = new Date(intervalStart);
          intervalEnd.setDate(intervalEnd.getDate() + 6);
        } else {
          intervalEnd = new Date(intervalStart);
          if (selectedPeriod === 'month' || selectedPeriod === 'ytd') {
            intervalEnd.setMonth(intervalEnd.getMonth() + 1);
            intervalEnd.setDate(0); // Last day of the month
          }
        }

        const admitsInPeriod = data.filter(patient => {
          const admissionDate = new Date(patient.admission_date);
          return admissionDate >= intervalStart && admissionDate <= intervalEnd;
        }).length;

        return {
          period: format(intervalStart, dateFormat),
          admits: admitsInPeriod,
          date: intervalStart.toISOString()
        };
      });

      return admitCounts;
    }
  });

  const chartConfig = {
    admits: {
      label: "Total Admits",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-medium">Total Admits</CardTitle>
          <CardDescription>Patient admissions over time</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <ChartExportButton onClick={() => {
            if (admitsData) exportChartData(admitsData, 'total-admits', [
              { key: 'period', label: 'Period' }, { key: 'admits', label: 'Admits' }
            ]);
          }} />
          <Select value={selectedPeriod} onValueChange={(value: TimePeriod) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 4 Weeks</SelectItem>
              <SelectItem value="month">Last 12 Months</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div>Loading chart data...</div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={admitsData}>
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="admits" 
                  fill="var(--color-admits)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TotalAdmitsChart;
