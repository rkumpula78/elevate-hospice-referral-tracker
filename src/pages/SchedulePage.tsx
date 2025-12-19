
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VisitsList from "@/components/crm/VisitsList";
import CalendarView from "@/components/crm/CalendarView";
import PageLayout from "@/components/layout/PageLayout";
import { Calendar, List } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const SchedulePage = () => {
  const isMobile = useIsMobile();
  
  return (
    <PageLayout title="Schedule" subtitle="Manage scheduled visits and appointments">
      <Card>
        <CardHeader className={isMobile ? "p-4" : ""}>
          <CardTitle className={isMobile ? "text-lg" : ""}>Scheduled Visits</CardTitle>
          {!isMobile && <CardDescription>View and manage patient visits and appointments</CardDescription>}
        </CardHeader>
        <CardContent className={isMobile ? "p-4 pt-0" : ""}>
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className={`grid w-full grid-cols-2 ${isMobile ? 'h-11' : ''}`}>
              <TabsTrigger value="calendar" className={`flex items-center gap-2 ${isMobile ? 'text-sm' : ''}`}>
                <Calendar className={isMobile ? "w-4 h-4" : "w-4 h-4"} />
                <span>{isMobile ? "Calendar" : "Calendar View"}</span>
              </TabsTrigger>
              <TabsTrigger value="list" className={`flex items-center gap-2 ${isMobile ? 'text-sm' : ''}`}>
                <List className={isMobile ? "w-4 h-4" : "w-4 h-4"} />
                <span>{isMobile ? "List" : "List View"}</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="calendar" className={isMobile ? "mt-4" : "mt-6"}>
              <CalendarView />
            </TabsContent>
            <TabsContent value="list" className={isMobile ? "mt-4" : "mt-6"}>
              <VisitsList />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default SchedulePage;
