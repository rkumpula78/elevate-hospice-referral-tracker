import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Construction } from "lucide-react";

interface SegmentMixAnalysisProps {
  period?: 'month' | 'quarter';
}

const SegmentMixAnalysis: React.FC<SegmentMixAnalysisProps> = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Segment Mix Analysis
        </CardTitle>
        <CardDescription>Analyze performance across organization segments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Construction className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-2">Feature Under Development</p>
          <p className="text-xs text-muted-foreground">
            Segment mix analysis will be available in a future update.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SegmentMixAnalysis;