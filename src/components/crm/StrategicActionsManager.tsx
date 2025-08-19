import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Construction } from "lucide-react";

interface StrategicActionsManagerProps {
  organizationId: string;
  organizationName: string;
}

const StrategicActionsManager: React.FC<StrategicActionsManagerProps> = ({ 
  organizationName 
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Strategic Actions
            </CardTitle>
            <CardDescription>Account-specific growth initiatives for {organizationName}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Construction className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-2">Feature Under Development</p>
          <p className="text-xs text-muted-foreground">
            Strategic action tracking will be available in a future update.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StrategicActionsManager;