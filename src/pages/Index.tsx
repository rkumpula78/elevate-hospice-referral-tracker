
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import HospiceReferralForm from '@/components/HospiceReferralForm';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/0581d561-551f-491a-8b13-0be84633073f.png" 
              alt="Elevate Hospice & Palliative Care" 
              className="h-12 w-auto"
            />
          </div>
          <Link to="/auth">
            <Button variant="outline">
              Staff Login
            </Button>
          </Link>
        </div>
      </nav>
      <main className="container mx-auto py-8">
        <HospiceReferralForm />
      </main>
    </div>
  );
};

export default Index;
