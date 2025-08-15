import React from 'react';
import PageLayout from "@/components/layout/PageLayout";
import MarketingProgramsManager from "@/components/crm/MarketingProgramsManager";
import MarketingBarriersManager from "@/components/crm/MarketingBarriersManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MarketingPage = () => {
  return (
    <PageLayout 
      title="Marketing Management" 
      subtitle="Strategic programs, barriers, and growth initiatives"
    >
      <Tabs defaultValue="programs" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-fit">
          <TabsTrigger value="programs">Marketing Programs</TabsTrigger>
          <TabsTrigger value="barriers">Barriers & Solutions</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-6">
          <MarketingProgramsManager />
        </TabsContent>

        <TabsContent value="barriers" className="space-y-6">
          <MarketingBarriersManager />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default MarketingPage;