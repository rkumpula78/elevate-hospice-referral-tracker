
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import VisitsList from "@/components/crm/VisitsList";
import PageLayout from "@/components/layout/PageLayout";

const SchedulePage = () => {
  return (
    <PageLayout title="Schedule" subtitle="Manage scheduled visits and appointments">
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Visits</CardTitle>
          <CardDescription>View and manage patient visits and appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <VisitsList />
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default SchedulePage;
