
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import HospiceReferralForm from '@/components/HospiceReferralForm';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Hospice Care Management</h1>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Go to CRM Dashboard
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto py-8">
        <HospiceReferralForm />
      </main>
    </div>
  );
};

export default Index;
