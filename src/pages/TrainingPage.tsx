
import React from 'react';
import PageHeader from '@/components/layout/PageHeader';
import ValuePropositionsDashboard from '@/components/value-props/ValuePropositionsDashboard';
import { useIsMobile } from "@/hooks/use-mobile";

const TrainingPage = () => {
  const isMobile = useIsMobile();
  console.log('TrainingPage: Component is rendering');

  React.useEffect(() => {
    console.log('TrainingPage: Component mounted');
    const pageElement = document.querySelector('[data-testid="training-page"]');
    if (pageElement) {
      console.log('TrainingPage: Page element found in DOM');
    } else {
      console.error('TrainingPage: Page element NOT found in DOM');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="training-page">
      <PageHeader 
        title="Value Propositions" 
        subtitle="Core value propositions for different organization types"
      />
      
      <div className={`container mx-auto ${isMobile ? 'p-4' : 'p-6'}`}>
        <ValuePropositionsDashboard />
      </div>
    </div>
  );
};

export default TrainingPage;
