
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import OrganizationsList from "@/components/crm/OrganizationsList";
import PageLayout from "@/components/layout/PageLayout";

const CareTeamsPage = () => {
  return (
    <PageLayout title="Care Teams" subtitle="Manage care team assignments and schedules">
      <Card>
        <CardHeader>
          <CardTitle>Care Team Management</CardTitle>
          <CardDescription>Coordinate care teams and staff assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationsList />
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default CareTeamsPage;
