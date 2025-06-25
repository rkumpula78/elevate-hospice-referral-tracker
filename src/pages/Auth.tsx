
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" 
           style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" 
         style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      <div className="w-full max-w-md">
        <div className="login-container">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <img 
                src="/lovable-uploads/0581d561-551f-491a-8b13-0be84633073f.png" 
                alt="Elevate Hospice & Palliative Care" 
                className="h-12 w-auto"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
              Welcome Back
            </h1>
            <p className="text-white/80 text-lg">
              Elevate Hospice & Palliative Care
            </p>
            <div className="w-16 h-1 bg-white/30 rounded-full mx-auto mt-4"></div>
          </div>
          <LoginForm onToggleMode={toggleMode} isSignUp={isSignUp} />
        </div>
      </div>
    </div>
  );
};

export default Auth;
