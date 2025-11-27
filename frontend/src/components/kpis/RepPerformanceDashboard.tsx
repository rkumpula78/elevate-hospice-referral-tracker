import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Construction } from "lucide-react";

interface RepPerformanceDashboardProps {
  marketerName?: string;
}

const RepPerformanceDashboard: React.FC<RepPerformanceDashboardProps> = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          Rep Performance Dashboard
        </CardTitle>
        <CardDescription>Track marketer performance and metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Construction className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-2">Feature Under Development</p>
          <p className="text-xs text-muted-foreground">
            Performance tracking dashboard will be available in a future update.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RepPerformanceDashboard;