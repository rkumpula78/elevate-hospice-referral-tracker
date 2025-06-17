
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VisitsList from "@/components/crm/VisitsList";
import CalendarView from "@/components/crm/CalendarView";
import PageLayout from "@/components/layout/PageLayout";
import { Calendar, List } from "lucide-react";

const SchedulePage = () => {
  return (
    <PageLayout title="Schedule" subtitle="Manage scheduled visits and appointments">
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Visits</CardTitle>
          <CardDescription>View and manage patient visits and appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calendar" className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Calendar View</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center space-x-2">
                <List className="w-4 h-4" />
                <span>List View</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="calendar" className="mt-6">
              <CalendarView />
            </TabsContent>
            <TabsContent value="list" className="mt-6">
              <VisitsList />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default SchedulePage;
