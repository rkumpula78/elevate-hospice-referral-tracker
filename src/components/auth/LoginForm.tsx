
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface LoginFormProps {
  onToggleMode: () => void;
  isSignUp: boolean;
}

const LoginForm = ({ onToggleMode, isSignUp }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const validateEmail = (email: string) => {
    const allowedDomain = '@elevatehospiceaz.com';
    return email.toLowerCase().endsWith(allowedDomain);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    // Validate email domain before submission
    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email Domain",
        description: "Only @elevatehospiceaz.com email addresses are allowed.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        console.error('Authentication error:', error);
        toast({
          title: "Authentication Error",
          description: error.message || "An error occurred during authentication",
          variant: "destructive"
        });
      } else if (isSignUp) {
        toast({
          title: "Account Created",
          description: "Please check your @elevatehospiceaz.com email to verify your account before signing in.",
        });
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h2>
        <p className="text-gray-600">
          {isSignUp 
            ? 'Create a new account with your @elevatehospiceaz.com email'
            : 'Enter your @elevatehospiceaz.com credentials to access the Referral Dashboard'
          }
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="yourname@elevatehospiceaz.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
          {email && !validateEmail(email) && (
            <p className="text-sm text-red-600">
              Email must end with @elevatehospiceaz.com
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <Button 
          type="submit" 
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.01]" 
          disabled={isLoading || !validateEmail(email)}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSignUp ? 'Create Account' : 'Sign In'}
        </Button>
      </form>
      
      <div className="text-center">
        <Button
          variant="link"
          onClick={onToggleMode}
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          {isSignUp 
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"
          }
        </Button>
      </div>
      
      {isSignUp && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> You must use an @elevatehospiceaz.com email address. 
            After registration, check your email for a verification link before signing in.
          </p>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
