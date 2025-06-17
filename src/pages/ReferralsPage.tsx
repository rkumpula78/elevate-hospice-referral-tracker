
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReferralsList from "@/components/crm/ReferralsList";
import PageLayout from "@/components/layout/PageLayout";

const ReferralsPage = () => {
  return (
    <PageLayout title="Referrals" subtitle="Track patient referrals through the admission process">
      <Card>
        <CardHeader>
          <CardTitle>Referral Pipeline</CardTitle>
          <CardDescription>Manage incoming referrals and track their progress</CardDescription>
        </CardHeader>
        <CardContent>
          <ReferralsList />
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default ReferralsPage;
