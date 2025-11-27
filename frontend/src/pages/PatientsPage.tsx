
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReferralsList from "@/components/crm/ReferralsList";
import PageLayout from "@/components/layout/PageLayout";

const PatientsPage = () => {
  return (
    <PageLayout title="Patients" subtitle="Manage patient records and care plans">
      <Card>
        <CardHeader>
          <CardTitle>All Patients</CardTitle>
          <CardDescription>View and manage patient information (sourced from referrals)</CardDescription>
        </CardHeader>
        <CardContent>
          <ReferralsList />
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default PatientsPage;
