import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Construction } from "lucide-react";

const MarketingBarriersManager: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Marketing Barriers & Countermeasures
            </CardTitle>
            <CardDescription>Identify and overcome obstacles to referral growth</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Construction className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-2">Feature Under Development</p>
          <p className="text-xs text-muted-foreground">
            Marketing barriers tracking will be available in a future update.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketingBarriersManager;