
import React from 'react';
import PageHeader from '@/components/layout/PageHeader';
import TrainingDashboard from '@/components/training/TrainingDashboard';

const TrainingPage = () => {
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
        title="Training Center" 
        subtitle="Master your hospice partnership strategies"
      />
      
      <div className="container mx-auto p-6">
        <TrainingDashboard />
      </div>
    </div>
  );
};

export default TrainingPage;
