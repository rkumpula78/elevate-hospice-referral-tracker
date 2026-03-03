
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import PageLayout from "@/components/layout/PageLayout";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, MapPin, Phone, Printer, Mail, Globe, RotateCcw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ONBOARDING_KEY } from "@/components/onboarding/OnboardingTour";
import MyTemplatesSettings from "@/components/settings/MyTemplatesSettings";
import ReminderSettings from "@/components/settings/ReminderSettings";

const SettingsPage = () => {
  const { user } = useAuth();
  const { profile, loading, updateProfile, updatePassword } = useProfile(user);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    display_name: '',
    phone: '',
    organization_name: '',
    organization_address: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Update form when profile loads
  React.useEffect(() => {
    if (profile) {
      setProfileForm({
        display_name: profile.display_name || '',
        phone: profile.phone || '',
        organization_name: profile.organization_name || '',
        organization_address: profile.organization_address || ''
      });
    }
  }, [profile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateProfile(profileForm);
    if (success) {
      // Force refresh of auth context by triggering a re-render
      window.location.reload();
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    const success = await updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
    if (success) {
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  };

  return (
    <PageLayout title="Settings" subtitle="Configure application settings and preferences">
      <div className={isMobile ? "space-y-4" : "space-y-6"}>
        <Card>
          <CardHeader className={isMobile ? "p-4" : ""}>
            <CardTitle className={isMobile ? "text-lg" : ""}>Company Information</CardTitle>
            {!isMobile && <CardDescription>Elevate Hospice & Palliative Care contact details</CardDescription>}
          </CardHeader>
          <CardContent className={isMobile ? "p-4 pt-0" : ""}>
            <div className={`grid grid-cols-1 md:grid-cols-2 ${isMobile ? 'gap-3' : 'gap-4'}`}>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <p className="text-sm text-gray-600">7010 E Acoma Dr, Suite 101, Scottsdale, AZ 85308</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-blue-600" />
                <div>
                  <Label className="text-sm font-medium">Main Phone</Label>
                  <p className="text-sm text-gray-600">480-800-4816</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Printer className="h-5 w-5 text-blue-600" />
                <div>
                  <Label className="text-sm font-medium">Fax</Label>
                  <p className="text-sm text-gray-600">480-800-4817</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <Label className="text-sm font-medium">General Info</Label>
                  <p className="text-sm text-gray-600">info@elevatehospiceaz.com</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <div>
                  <Label className="text-sm font-medium">Website</Label>
                  <p className="text-sm text-gray-600">www.elevatehospiceaz.com</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={isMobile ? "p-4" : ""}>
            <CardTitle className={isMobile ? "text-lg" : ""}>User Profile</CardTitle>
            {!isMobile && <CardDescription>Manage your personal information</CardDescription>}
          </CardHeader>
          <CardContent className={isMobile ? "p-4 pt-0" : ""}>
            <form onSubmit={handleProfileSubmit} className={isMobile ? "space-y-3" : "space-y-4"}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user-name">Display Name</Label>
                  <Input 
                    id="user-name" 
                    value={profileForm.display_name}
                    onChange={(e) => setProfileForm({...profileForm, display_name: e.target.value})}
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <Label htmlFor="user-email">Email</Label>
                  <Input 
                    id="user-email" 
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={isMobile ? "p-4" : ""}>
            <CardTitle className={isMobile ? "text-lg" : ""}>Change Password</CardTitle>
            {!isMobile && <CardDescription>Update your account password</CardDescription>}
          </CardHeader>
          <CardContent className={isMobile ? "p-4 pt-0" : ""}>
            <form onSubmit={handlePasswordSubmit} className={isMobile ? "space-y-3" : "space-y-4"}>
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input 
                    id="current-password"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    placeholder="Enter current password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input 
                    id="new-password"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
              </div>
              
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input 
                    id="confirm-password"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    placeholder="Confirm new password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Separator />
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={isMobile ? "p-4" : ""}>
            <CardTitle className={isMobile ? "text-lg" : ""}>Onboarding Tour</CardTitle>
            {!isMobile && <CardDescription>Restart the guided walkthrough of the Referral Dashboard</CardDescription>}
          </CardHeader>
          <CardContent className={isMobile ? "p-4 pt-0" : ""}>
            <p className="text-sm text-muted-foreground mb-4">
              Re-run the interactive tour to learn about key features of the Elevate Referral dashboard.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem(ONBOARDING_KEY);
                toast({
                  title: "Tour Reset",
                  description: "Navigate to the Dashboard to start the onboarding tour.",
                });
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart Tour
            </Button>
          </CardContent>
        </Card>

        <ReminderSettings />

        <MyTemplatesSettings />
      </div>
    </PageLayout>
  );
};

export default SettingsPage;

