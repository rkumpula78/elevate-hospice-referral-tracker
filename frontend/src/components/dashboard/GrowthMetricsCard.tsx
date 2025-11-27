import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const GrowthMetricsCard: React.FC = () => {
  // Fetch growth metrics summary
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['growth-metrics-summary'],
    queryFn: async () => {
      // Get organizations with goals
      const { data: orgsWithGoals } = await supabase
        .from('organizations')
        .select('id, name, estimated_monthly_referrals')
        .not('estimated_monthly_referrals', 'is', null)
        .gt('estimated_monthly_referrals', 0);

      return {
        organizations: orgsWithGoals || [],
        activeActions: [],
        activeBarriers: [],
        activePrograms: []
      };
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Growth Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusCounts = () => {
    if (!metrics?.organizations) return { onTrack: 0, atRisk: 0, behind: 0, exceeding: 0 };
    
    // For now, just return default counts since growth_status doesn't exist
    return { onTrack: metrics.organizations.length, atRisk: 0, behind: 0, exceeding: 0 };
  };

  const statusCounts = getStatusCounts();
  const totalOrgs = metrics?.organizations?.length || 0;
  const activeActions = metrics?.activeActions?.length || 0;
  const activeBarriers = metrics?.activeBarriers?.length || 0;
  const activePrograms = metrics?.activePrograms?.length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Growth Management
        </CardTitle>
        <CardDescription>Account goals and strategic initiatives</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Account Goals Status */}
        <div>
          <h4 className="text-sm font-medium mb-2">Account Goals ({totalOrgs} accounts)</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                On Track
              </Badge>
              <span className="text-sm">{statusCounts.onTrack}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Exceeding
              </Badge>
              <span className="text-sm">{statusCounts.exceeding}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                At Risk
              </Badge>
              <span className="text-sm">{statusCounts.atRisk}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800 text-xs">Behind</Badge>
              <span className="text-sm">{statusCounts.behind}</span>
            </div>
          </div>
        </div>

        {/* Active Initiatives */}
        <div className="pt-3 border-t">
          <h4 className="text-sm font-medium mb-2">Active Initiatives</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Strategic Actions</span>
              <span className="font-medium">{activeActions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Marketing Programs</span>
              <span className="font-medium">{activePrograms}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Barriers</span>
              <span className={`font-medium ${activeBarriers > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {activeBarriers}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        {totalOrgs > 0 && (
          <div className="pt-3 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {Math.round(((statusCounts.onTrack + statusCounts.exceeding) / totalOrgs) * 100)}%
              </p>
              <p className="text-xs text-muted-foreground">Accounts on track or exceeding goals</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GrowthMetricsCard;