
import React from 'react';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTrainingDashboard from '@/components/training/SimpleTrainingDashboard';

const TrainingPage = () => {
  console.log('TrainingPage: Component is rendering');

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Training Center" 
        subtitle="Master your hospice partnership strategies"
      />
      <div className="container mx-auto p-6">
        <SimpleTrainingDashboard />
      </div>
    </div>
  );
};

export default TrainingPage;
