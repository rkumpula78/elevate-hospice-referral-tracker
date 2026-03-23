import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MobileOptimizedCard } from "@/components/ui/mobile-card";
import ReferralsList from "@/components/crm/ReferralsList";
import PalliativeOutreachBoard from "@/components/crm/PalliativeOutreachBoard";
import PageLayout from "@/components/layout/PageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const ReferralsPage = () => {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter');
  const tabParam = searchParams.get('tab');

  const { data: palliativeCount = 0 } = useQuery({
    queryKey: ['palliative-outreach-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .in('status', ['palliative_outreach', 'not_appropriate'] as any[]);
      if (error) throw error;
      return count || 0;
    },
  });

  return (
    <PageLayout title="Referrals" subtitle="Track patient referrals through the admission process">
      <Tabs defaultValue={tabParam === 'palliative' ? 'palliative' : 'pipeline'} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Referral Pipeline</TabsTrigger>
          <TabsTrigger value="palliative" className="flex items-center gap-2">
            Palliative Outreach
            {palliativeCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">{palliativeCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <MobileOptimizedCard 
            title="Referral Pipeline"
            description="Manage incoming referrals and track their progress"
            className="bg-background"
          >
            <ReferralsList initialFilter={filter} />
          </MobileOptimizedCard>
        </TabsContent>

        <TabsContent value="palliative">
          <MobileOptimizedCard
            title="Palliative Outreach"
            description="Patients being followed for potential future hospice conversion"
            className="bg-background"
          >
            <PalliativeOutreachBoard />
          </MobileOptimizedCard>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default ReferralsPage;
