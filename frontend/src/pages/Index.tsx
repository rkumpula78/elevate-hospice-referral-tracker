
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import HospiceReferralForm from '@/components/HospiceReferralForm';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <nav className="bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/0581d561-551f-491a-8b13-0be84633073f.png" 
              alt="Elevate Hospice & Palliative Care" 
              className="h-14 w-auto transition-transform duration-300 hover:scale-105"
            />
          </div>
          <Link to="/auth">
            <Button 
              variant="outline" 
              className="font-semibold shadow-sm hover:shadow-md transition-all duration-300"
            >
              Staff Login
            </Button>
          </Link>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-12">
        <HospiceReferralForm />
      </main>
    </div>
  );
};

export default Index;
