import React from 'react';
import PageHeader from '@/components/layout/PageHeader';
import TrainingDashboard from '@/components/training/TrainingDashboard';

const TrainingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
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