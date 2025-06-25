
import React from 'react';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTrainingDashboard from '@/components/training/SimpleTrainingDashboard';

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
      <div className="p-4 bg-yellow-100 border border-yellow-300">
        <p className="text-yellow-700 font-medium">Training Page Debug:</p>
        <p className="text-sm text-yellow-600">Page component loaded at {new Date().toLocaleTimeString()}</p>
      </div>
      
      <PageHeader 
        title="Training Center" 
        subtitle="Master your hospice partnership strategies"
      />
      
      <div className="container mx-auto p-6">
        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded">
          <p className="text-green-700 text-sm">Loading SimpleTrainingDashboard component...</p>
        </div>
        
        <SimpleTrainingDashboard />
        
        <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded">
          <p className="text-blue-700 text-sm">SimpleTrainingDashboard component should be loaded above</p>
        </div>
      </div>
    </div>
  );
};

export default TrainingPage;
