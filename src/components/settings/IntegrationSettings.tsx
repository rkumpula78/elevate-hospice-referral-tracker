import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  MessageSquare, 
  Bell, 
  Users, 
  Webhook, 
  Save,
  Download,
  Upload,
  TestTube,
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TeamsSettings {
  webhooks: {
    primary: string;
    urgent: string;
    scheduling: string;
    system: string;
    regionA: string;
    regionB: string;
  };
  teamMembers: Array<{
    name: string;
    email: string;
    role: string;
    region?: string;
  }>;
  notifications: {
    autoNotifyNewReferrals: boolean;
    autoNotifyStatusChanges: boolean;
    autoNotifyF2FDeadlines: boolean;
    autoCreateCalendarEvents: boolean;
    notificationFrequency: 'immediate' | 'hourly' | 'daily';
  };
  routing: {
    urgentToUrgentChannel: boolean;
    routeByRegion: boolean;
    routeByPriority: boolean;
    fallbackToPrimary: boolean;
  };
}

const defaultSettings: TeamsSettings = {
  webhooks: {
    primary: '',
    urgent: '',
    scheduling: '',
    system: '',
    regionA: '',
    regionB: ''
  },
  teamMembers: [
    { name: 'John Smith', email: 'john.smith@elevatehospice.com', role: 'Senior Marketer', region: 'North' },
    { name: 'Sarah Johnson', email: 'sarah.johnson@elevatehospice.com', role: 'Referral Coordinator', region: 'South' },
    { name: 'Mike Davis', email: 'mike.davis@elevatehospice.com', role: 'Regional Manager', region: 'North' },
    { name: 'Lisa Wilson', email: 'lisa.wilson@elevatehospice.com', role: 'Clinical Liaison', region: 'South' },
    { name: 'David Brown', email: 'david.brown@elevatehospice.com', role: 'Intake Coordinator', region: 'North' }
  ],
  notifications: {
    autoNotifyNewReferrals: true,
    autoNotifyStatusChanges: true,
    autoNotifyF2FDeadlines: true,
    autoCreateCalendarEvents: false,
    notificationFrequency: 'immediate'
  },
  routing: {
    urgentToUrgentChannel: true,
    routeByRegion: true,
    routeByPriority: true,
    fallbackToPrimary: true
  }
};

const IntegrationSettings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<TeamsSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from database
  const { data: savedSettings, isLoading } = useQuery({
    queryKey: ['integration-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('integration_type', 'teams')
        .eq('organization_id', 'default') // In multi-tenant, this would be dynamic
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found, which is OK
        throw error;
      }
      
      return data?.settings as TeamsSettings || defaultSettings;
    }
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: TeamsSettings) => {
      const { error } = await supabase
        .from('integration_settings')
        .upsert({
          integration_type: 'teams',
          organization_id: 'default',
          settings: settings,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Teams integration settings have been updated successfully"
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['integration-settings'] });
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Load saved settings when available
  useEffect(() => {
    if (savedSettings) {
      setSettings(savedSettings);
    }
  }, [savedSettings]);

  // Track changes
  const updateSettings = (updates: Partial<TeamsSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateWebhooks = (webhookUpdates: Partial<TeamsSettings['webhooks']>) => {
    updateSettings({
      webhooks: { ...settings.webhooks, ...webhookUpdates }
    });
  };

  const updateNotifications = (notificationUpdates: Partial<TeamsSettings['notifications']>) => {
    updateSettings({
      notifications: { ...settings.notifications, ...notificationUpdates }
    });
  };

  const updateRouting = (routingUpdates: Partial<TeamsSettings['routing']>) => {
    updateSettings({
      routing: { ...settings.routing, ...routingUpdates }
    });
  };

  // Test webhook functionality
  const testWebhook = async (url: string, channelName: string) => {
    if (!url) {
      toast({
        title: "No webhook URL",
        description: `Please configure the ${channelName} webhook URL first`,
        variant: "destructive"
      });
      return;
    }

    const testPayload = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": "#4A90E2",
      "summary": `${channelName} Channel Test`,
      "sections": [{
        "activityTitle": "🧪 Teams Integration Test",
        "activitySubtitle": `Testing ${channelName} webhook configuration`,
        "facts": [
          { "name": "Status", "value": "Configuration test successful ✅" },
          { "name": "Channel", "value": channelName },
          { "name": "Timestamp", "value": new Date().toLocaleString() },
          { "name": "Sent From", "value": "Hospice Referral Tracker Settings" }
        ]
      }],
      "potentialAction": [{
        "@type": "OpenUri",
        "name": "View Settings",
        "targets": [{
          "os": "default",
          "uri": window.location.href
        }]
      }]
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        toast({
          title: "Test successful! 🎉",
          description: `${channelName} webhook is working correctly. Check your Teams channel.`
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      toast({
        title: "Test failed",
        description: `Failed to send test message to ${channelName}: ${error}`,
        variant: "destructive"
      });
    }
  };

  // Add/remove team members
  const addTeamMember = () => {
    updateSettings({
      teamMembers: [...settings.teamMembers, {
        name: '',
        email: '',
        role: '',
        region: 'North'
      }]
    });
  };

  const updateTeamMember = (index: number, member: Partial<TeamsSettings['teamMembers'][0]>) => {
    const updatedMembers = [...settings.teamMembers];
    updatedMembers[index] = { ...updatedMembers[index], ...member };
    updateSettings({ teamMembers: updatedMembers });
  };

  const removeTeamMember = (index: number) => {
    const updatedMembers = settings.teamMembers.filter((_, i) => i !== index);
    updateSettings({ teamMembers: updatedMembers });
  };

  // Export/Import settings
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'teams-integration-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Settings exported",
      description: "Settings file has been downloaded"
    });
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings(importedSettings);
        setHasChanges(true);
        toast({
          title: "Settings imported",
          description: "Settings have been loaded from file. Don't forget to save!"
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid settings file format",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Integration Settings
          </h2>
          <p className="text-gray-600">Configure Teams integration and notification preferences</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Unsaved Changes
            </Badge>
          )}
          <Button
            onClick={() => saveSettingsMutation.mutate(settings)}
            disabled={!hasChanges || saveSettingsMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="webhooks" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="team">Team Members</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Webhooks Configuration */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Teams Webhook URLs
              </CardTitle>
              <CardDescription>
                Configure webhook URLs for different Teams channels. Create incoming webhooks in Teams channels first.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: 'primary', name: 'Primary Channel', desc: 'Main referrals and general notifications', required: true },
                { key: 'urgent', name: 'Urgent Channel', desc: 'High priority and overdue F2F alerts', required: false },
                { key: 'scheduling', name: 'Scheduling Channel', desc: 'F2F appointment coordination', required: false },
                { key: 'system', name: 'System Channel', desc: 'Integration status and system alerts', required: false },
                { key: 'regionA', name: 'Region A', desc: 'North region notifications', required: false },
                { key: 'regionB', name: 'Region B', desc: 'South region notifications', required: false }
              ].map((webhook) => (
                <div key={webhook.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="flex items-center gap-2">
                        {webhook.name}
                        {webhook.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                        {!webhook.required && <Badge variant="outline" className="text-xs">Optional</Badge>}
                      </Label>
                      <p className="text-sm text-gray-600">{webhook.desc}</p>
                    </div>
                    {settings.webhooks[webhook.key as keyof typeof settings.webhooks] && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testWebhook(
                          settings.webhooks[webhook.key as keyof typeof settings.webhooks], 
                          webhook.name
                        )}
                      >
                        <TestTube className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="https://outlook.office.com/webhook/xxx-xxx-xxx"
                    value={settings.webhooks[webhook.key as keyof typeof settings.webhooks]}
                    onChange={(e) => updateWebhooks({ 
                      [webhook.key]: e.target.value 
                    } as Partial<TeamsSettings['webhooks']>)}
                  />
                </div>
              ))}

              <Alert>
                <MessageSquare className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">How to create webhook URLs:</div>
                    <ol className="text-sm list-decimal list-inside space-y-1">
                      <li>Go to your Teams channel → Click "..." → Connectors</li>
                      <li>Find "Incoming Webhook" → Configure</li>
                      <li>Name: "Hospice Referral Bot" → Create</li>
                      <li>Copy the webhook URL and paste above</li>
                    </ol>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Members Configuration */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                Configure team members for @mentions in Teams notifications
              </CardDescription>
              <Button onClick={addTeamMember} size="sm" className="w-fit">
                <Plus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.teamMembers.map((member, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={member.name}
                        onChange={(e) => updateTeamMember(index, { name: e.target.value })}
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        value={member.email}
                        onChange={(e) => updateTeamMember(index, { email: e.target.value })}
                        placeholder="john.smith@elevatehospice.com"
                        type="email"
                      />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Input
                        value={member.role}
                        onChange={(e) => updateTeamMember(index, { role: e.target.value })}
                        placeholder="Senior Marketer"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label>Region</Label>
                        <Input
                          value={member.region || ''}
                          onChange={(e) => updateTeamMember(index, { region: e.target.value })}
                          placeholder="North/South"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTeamMember(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Configuration */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure when and how Teams notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-new-referrals">Auto-notify New Referrals</Label>
                    <p className="text-sm text-gray-600">
                      Automatically send Teams notification when new referrals are created
                    </p>
                  </div>
                  <Switch
                    id="auto-new-referrals"
                    checked={settings.notifications.autoNotifyNewReferrals}
                    onCheckedChange={(checked) => updateNotifications({ autoNotifyNewReferrals: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-status-changes">Auto-notify Status Changes</Label>
                    <p className="text-sm text-gray-600">
                      Send notifications for significant status changes
                    </p>
                  </div>
                  <Switch
                    id="auto-status-changes"
                    checked={settings.notifications.autoNotifyStatusChanges}
                    onCheckedChange={(checked) => updateNotifications({ autoNotifyStatusChanges: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-f2f-deadlines">Auto-notify F2F Deadlines</Label>
                    <p className="text-sm text-gray-600">
                      Send alerts when F2F visit deadlines are approaching
                    </p>
                  </div>
                  <Switch
                    id="auto-f2f-deadlines"
                    checked={settings.notifications.autoNotifyF2FDeadlines}
                    onCheckedChange={(checked) => updateNotifications({ autoNotifyF2FDeadlines: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-calendar">Auto-create Calendar Events</Label>
                    <p className="text-sm text-gray-600">
                      Automatically create Teams calendar events for F2F appointments
                    </p>
                  </div>
                  <Switch
                    id="auto-calendar"
                    checked={settings.notifications.autoCreateCalendarEvents}
                    onCheckedChange={(checked) => updateNotifications({ autoCreateCalendarEvents: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Configuration */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Import/export settings and configure routing behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Import/Export */}
              <div className="space-y-4">
                <h4 className="font-medium">Backup & Restore</h4>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={exportSettings}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Settings
                  </Button>
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importSettings}
                      style={{ display: 'none' }}
                      id="import-settings"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('import-settings')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import Settings
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Routing Preferences */}
              <div className="space-y-4">
                <h4 className="font-medium">Notification Routing</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Route Urgent to Urgent Channel</Label>
                    <p className="text-sm text-gray-600">
                      Send urgent referrals and overdue F2F to urgent channel
                    </p>
                  </div>
                  <Switch
                    checked={settings.routing.urgentToUrgentChannel}
                    onCheckedChange={(checked) => updateRouting({ urgentToUrgentChannel: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Route by Region</Label>
                    <p className="text-sm text-gray-600">
                      Route notifications based on assigned marketer's region
                    </p>
                  </div>
                  <Switch
                    checked={settings.routing.routeByRegion}
                    onCheckedChange={(checked) => updateRouting({ routeByRegion: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Fallback to Primary</Label>
                    <p className="text-sm text-gray-600">
                      Always send to primary channel if specific routing fails
                    </p>
                  </div>
                  <Switch
                    checked={settings.routing.fallbackToPrimary}
                    onCheckedChange={(checked) => updateRouting({ fallbackToPrimary: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {hasChanges && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have unsaved changes. Don't forget to save your settings before leaving this page.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationSettings;