import React from 'react';
import PageLayout from "@/components/layout/PageLayout";
import MarketingProgramsManager from "@/components/crm/MarketingProgramsManager";
import MarketingBarriersManager from "@/components/crm/MarketingBarriersManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

const MarketingPage = () => {
  const isMobile = useIsMobile();
  
  return (
    <PageLayout 
      title="Marketing Management" 
      subtitle="Strategic programs, barriers, and growth initiatives"
    >
      <Tabs defaultValue="programs" className={isMobile ? "space-y-4" : "space-y-6"}>
        <TabsList className={`grid grid-cols-2 ${isMobile ? 'w-full h-11' : 'w-fit'}`}>
          <TabsTrigger value="programs" className={isMobile ? "text-sm" : ""}>
            {isMobile ? "Programs" : "Marketing Programs"}
          </TabsTrigger>
          <TabsTrigger value="barriers" className={isMobile ? "text-sm" : ""}>
            {isMobile ? "Barriers" : "Barriers & Solutions"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className={isMobile ? "space-y-4" : "space-y-6"}>
          <MarketingProgramsManager />
        </TabsContent>

        <TabsContent value="barriers" className={isMobile ? "space-y-4" : "space-y-6"}>
          <MarketingBarriersManager />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default MarketingPage;