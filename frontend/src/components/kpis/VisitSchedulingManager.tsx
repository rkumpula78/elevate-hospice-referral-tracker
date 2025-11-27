import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, Construction } from "lucide-react";

interface VisitSchedulingManagerProps {
  marketerName?: string;
}

const VisitSchedulingManager: React.FC<VisitSchedulingManagerProps> = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          Visit Scheduling Manager
        </CardTitle>
        <CardDescription>Manage visit schedules and compliance alerts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Construction className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-2">Feature Under Development</p>
          <p className="text-xs text-muted-foreground">
            Visit scheduling management will be available in a future update.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisitSchedulingManager;