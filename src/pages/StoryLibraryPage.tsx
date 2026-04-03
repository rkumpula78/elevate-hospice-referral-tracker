import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Inbox, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import StoryLibraryTab from '@/components/stories/StoryLibraryTab';
import SubmitStoryTab from '@/components/stories/SubmitStoryTab';
import ReviewQueueTab from '@/components/stories/ReviewQueueTab';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

const StoryLibraryPage = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('library');

  const { data: newSubmissionCount = 0 } = useQuery({
    queryKey: ['story-submissions-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('story_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');
      if (error) throw error;
      return count || 0;
    },
    enabled: isAdmin,
    refetchInterval: 60000,
  });

  return (
    <PageLayout title="Story Library" subtitle="Patient and family stories for marketing, referral materials, and team inspiration.">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-2 lg:grid-cols-3">
          <TabsTrigger value="library" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Story Library</span>
            <span className="sm:hidden">Library</span>
          </TabsTrigger>
          <TabsTrigger value="submit" className="flex items-center gap-2">
            <Inbox className="w-4 h-4" />
            <span>Submit</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="review" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Review Queue</span>
              <span className="sm:hidden">Review</span>
              {newSubmissionCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px]">
                  {newSubmissionCount}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="library">
          <StoryLibraryTab onSubmitClick={() => setActiveTab('submit')} />
        </TabsContent>

        <TabsContent value="submit">
          <SubmitStoryTab />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="review">
            <ReviewQueueTab />
          </TabsContent>
        )}
      </Tabs>
    </PageLayout>
  );
};

export default StoryLibraryPage;
