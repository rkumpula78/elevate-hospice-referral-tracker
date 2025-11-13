import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { MobileOptimizedCard } from "@/components/ui/mobile-card";
import ReferralsList from "@/components/crm/ReferralsList";
import PageLayout from "@/components/layout/PageLayout";

const ReferralsPage = () => {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter');

  return (
    <PageLayout title="Referrals" subtitle="Track patient referrals through the admission process">
      <MobileOptimizedCard 
        title="Referral Pipeline"
        description="Manage incoming referrals and track their progress"
        className="bg-background"
      >
        <ReferralsList initialFilter={filter} />
      </MobileOptimizedCard>
    </PageLayout>
  );
};

export default ReferralsPage;
