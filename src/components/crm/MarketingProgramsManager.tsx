import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PhysicianOutreachProgram from "./PhysicianOutreachProgram";
import { useIsMobile } from "@/hooks/use-mobile";

const MarketingProgramsManager: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader className={isMobile ? "p-4" : "p-6"}>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
              <Target className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
              Strategic Marketing Programs
            </CardTitle>
            {!isMobile && (
              <CardDescription>Design and track targeted marketing initiatives by theme</CardDescription>
            )}
          </div>
          <Button variant="outline" size={isMobile ? "sm" : "default"}>
            <Plus className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
            {isMobile ? "New" : "New Theme"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className={isMobile ? "p-4 pt-0" : "p-6 pt-0"}>
        <Tabs defaultValue="physician" className={isMobile ? "space-y-3" : "space-y-4"}>
          <TabsList className={`grid grid-cols-1 ${isMobile ? 'w-full h-11' : 'w-fit'}`}>
            <TabsTrigger value="physician" className={isMobile ? "text-sm" : ""}>
              Physician Outreach
            </TabsTrigger>
          </TabsList>

          <TabsContent value="physician">
            <PhysicianOutreachProgram />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MarketingProgramsManager;