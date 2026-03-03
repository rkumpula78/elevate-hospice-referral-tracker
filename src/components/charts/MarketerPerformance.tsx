
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Calendar } from "lucide-react";
import ChartExportButton from "@/components/ui/chart-export-button";
import { exportChartData } from "@/lib/exportUtils";

const MarketerPerformance = () => {
  const { data: marketerData, isLoading } = useQuery({
    queryKey: ['marketer-performance'],
    queryFn: async () => {
      // Get referral data grouped by marketer
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('assigned_marketer, status')
        .not('assigned_marketer', 'is', null);

      if (referralsError) throw referralsError;

      // Get visit data grouped by staff
      const { data: visits, error: visitsError } = await supabase
        .from('visits')
        .select('staff_name, is_completed')
        .gte('scheduled_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (visitsError) throw visitsError;

      // Process marketer data
      const marketerMetrics: Record<string, any> = {};

      referrals.forEach(referral => {
        const marketer = referral.assigned_marketer;
        if (!marketer) return;

        if (!marketerMetrics[marketer]) {
          marketerMetrics[marketer] = {
            name: marketer,
            totalReferrals: 0,
            admittedReferrals: 0,
            scheduledVisits: 0,
            completedVisits: 0
          };
        }

        marketerMetrics[marketer].totalReferrals++;
        if (referral.status === 'admitted' || referral.status === 'admitted_our_hospice') {
          marketerMetrics[marketer].admittedReferrals++;
        }
      });

      // Add visit data
      visits.forEach(visit => {
        const marketer = visit.staff_name;
        if (marketerMetrics[marketer]) {
          marketerMetrics[marketer].scheduledVisits++;
          if (visit.is_completed) {
            marketerMetrics[marketer].completedVisits++;
          }
        }
      });

      return Object.values(marketerMetrics)
        .map((marketer: any) => ({
          ...marketer,
          conversionRate: marketer.totalReferrals > 0 
            ? Math.round((marketer.admittedReferrals / marketer.totalReferrals) * 100) 
            : 0,
          visitCompletionRate: marketer.scheduledVisits > 0
            ? Math.round((marketer.completedVisits / marketer.scheduledVisits) * 100)
            : 0
        }))
        .sort((a: any, b: any) => b.totalReferrals - a.totalReferrals);
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Marketer Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div>Loading marketer data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Marketer Performance (Last 30 Days)</CardTitle>
            <CardDescription>Key metrics by assigned marketer</CardDescription>
          </div>
          <ChartExportButton onClick={() => {
            if (marketerData) exportChartData(marketerData, 'marketer-performance', [
              { key: 'name', label: 'Marketer' },
              { key: 'totalReferrals', label: 'Total Referrals' },
              { key: 'admittedReferrals', label: 'Admitted' },
              { key: 'conversionRate', label: 'Conversion Rate (%)' },
              { key: 'completedVisits', label: 'Completed Visits' },
              { key: 'scheduledVisits', label: 'Scheduled Visits' },
            ]);
          }} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {marketerData?.map((marketer) => (
            <div key={marketer.name} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-lg">{marketer.name}</h3>
                <div className="flex gap-2">
                  <Badge variant={marketer.conversionRate >= 50 ? "default" : "secondary"}>
                    {marketer.conversionRate}% conversion
                  </Badge>
                  {marketer.scheduledVisits > 0 && (
                    <Badge variant={marketer.visitCompletionRate >= 80 ? "default" : "secondary"}>
                      {marketer.visitCompletionRate}% visits completed
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-medium">{marketer.totalReferrals}</div>
                    <div className="text-gray-600">Total Referrals</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <div>
                    <div className="font-medium">{marketer.admittedReferrals}</div>
                    <div className="text-gray-600">Admitted</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="font-medium">{marketer.completedVisits}/{marketer.scheduledVisits}</div>
                    <div className="text-gray-600">Visits Completed</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {(!marketerData || marketerData.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              No marketer performance data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketerPerformance;
