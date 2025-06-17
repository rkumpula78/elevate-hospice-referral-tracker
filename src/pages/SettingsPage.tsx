
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import PageLayout from "@/components/layout/PageLayout";

const SettingsPage = () => {
  return (
    <PageLayout title="Settings" subtitle="Configure application settings and preferences">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Settings</CardTitle>
            <CardDescription>Configure your organization's information and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="org-name">Organization Name</Label>
                <Input id="org-name" defaultValue="Elevate Hospice & Palliative Care" />
              </div>
              <div>
                <Label htmlFor="org-phone">Phone Number</Label>
                <Input id="org-phone" placeholder="(555) 123-4567" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="org-address">Address</Label>
                <Input id="org-address" placeholder="123 Main St, City, State 12345" />
              </div>
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Preferences</CardTitle>
            <CardDescription>Customize your experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="user-name">Display Name</Label>
                <Input id="user-name" defaultValue="Sarah Admin" />
              </div>
              <div>
                <Label htmlFor="user-email">Email</Label>
                <Input id="user-email" defaultValue="sarah@elevatehospice.com" />
              </div>
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button>Update Profile</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default SettingsPage;
