import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MobileOptimizedCard } from "@/components/ui/mobile-card";
import ReferralsList from "@/components/crm/ReferralsList";
import ReferralKanban from "@/components/crm/ReferralKanban";
import PalliativeOutreachBoard from "@/components/crm/PalliativeOutreachBoard";
import AddReferralDialog from "@/components/crm/AddReferralDialog";
import PageLayout from "@/components/layout/PageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LayoutList, Kanban, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const VIEW_STORAGE_KEY = 'elevate-referrals-pipeline-view';

const ReferralsPage = () => {
  const [showAddReferral, setShowAddReferral] = useState(false);
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter');
  const tabParam = searchParams.get('tab');

  const [pipelineView, setPipelineView] = useState<'list' | 'kanban'>(() => {
    return (localStorage.getItem(VIEW_STORAGE_KEY) as 'list' | 'kanban') || 'list';
  });

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, pipelineView);
  }, [pipelineView]);

  const { data: palliativeCount = 0 } = useQuery({
    queryKey: ['palliative-outreach-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .in('status', ['palliative_outreach', 'not_appropriate'] as any[]);
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch referrals for kanban (shared query)
  const { data: allReferrals = [] } = useQuery({
    queryKey: ['referrals-kanban'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('*, organizations(name, type)')
        .is('deleted_at', null)
        .order('referral_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: pipelineView === 'kanban',
  });

  return (
    <PageLayout title="Referrals" subtitle="Track patient referrals through the admission process">
      <Tabs defaultValue={tabParam === 'palliative' ? 'palliative' : 'pipeline'} className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList>
            <TabsTrigger value="pipeline">Referral Pipeline</TabsTrigger>
            <TabsTrigger value="palliative" className="flex items-center gap-2">
              Palliative Outreach
              {palliativeCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">{palliativeCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className={cn('rounded-none gap-1.5 px-3', pipelineView === 'list' && 'bg-muted')}
                onClick={() => setPipelineView('list')}
              >
                <LayoutList className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">List</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn('rounded-none gap-1.5 px-3', pipelineView === 'kanban' && 'bg-muted')}
                onClick={() => setPipelineView('kanban')}
              >
                <Kanban className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Kanban</span>
              </Button>
            </div>

            {/* Add Referral button */}
            <Button onClick={() => setShowAddReferral(true)} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Referral</span>
            </Button>
          </div>
        </div>

        <TabsContent value="pipeline">
          {pipelineView === 'kanban' ? (
            <ReferralKanban referrals={allReferrals} />
          ) : (
            <MobileOptimizedCard 
              title="Referral Pipeline"
              description="Manage incoming referrals and track their progress"
              className="bg-background"
            >
              <ReferralsList initialFilter={filter} />
            </MobileOptimizedCard>
          )}
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
