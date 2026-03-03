import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Bell, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';

interface WebhookConfig {
  id: string;
  config_key: string;
  config_value: {
    url: string;
    enabled: boolean;
  };
  description: string;
}

interface NotificationConfig {
  id: string;
  config_key: string;
  config_value: any;
  description: string;
}

export const TeamsIntegrationSettings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  // Fetch webhook configurations
  const { data: webhookConfigs, isLoading: webhooksLoading } = useQuery({
    queryKey: ['teams-webhook-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams_configuration')
        .select('*')
        .eq('config_type', 'webhook_url')
        .eq('is_active', true)
        .order('config_key');
      
      if (error) throw error;
      return data as any[];
    }
  });

  // Fetch notification settings
  const { data: notificationConfigs, isLoading: notificationsLoading } = useQuery({
    queryKey: ['teams-notification-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams_configuration')
        .select('*')
        .eq('config_type', 'notification_settings')
        .eq('is_active', true)
        .order('config_key');
      
      if (error) throw error;
      return data as NotificationConfig[];
    }
  });

  // Fetch recent notifications for status display
  const { data: recentNotifications } = useQuery({
    queryKey: ['teams-recent-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Update webhook configuration
  const updateWebhookMutation = useMutation({
    mutationFn: async ({ id, configValue }: { id: string; configValue: any }) => {
      const { error } = await supabase
        .from('teams_configuration')
        .update({ 
          config_value: configValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-webhook-configs'] });
      toast({
        title: "Configuration updated",
        description: "Webhook settings have been saved successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update notification settings
  const updateNotificationMutation = useMutation({
    mutationFn: async ({ id, configValue }: { id: string; configValue: any }) => {
      const { error } = await supabase
        .from('teams_configuration')
        .update({ 
          config_value: configValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-notification-configs'] });
      toast({
        title: "Notification settings updated",
        description: "Settings have been saved successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Test webhook
  const testWebhookMutation = useMutation({
    mutationFn: async (webhookUrl: string) => {
      const testPayload = {
        notificationType: 'test',
        referralId: 'test-referral-id',
        payload: {
          title: '🧪 Test Notification',
          text: 'This is a test notification from your Hospice Referral Dashboard',
          summary: 'Test notification',
          sections: [{
            activityTitle: 'Test Message',
            facts: [
              { name: 'Sender', value: 'Hospice Referral System' },
              { name: 'Time', value: new Date().toLocaleString() },
              { name: 'Purpose', value: 'n8n Integration Test' }
            ]
          }]
        },
        timestamp: new Date().toISOString()
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });

      if (!response.ok) {
        throw new Error(`Test failed: ${response.status} ${response.statusText}`);
      }

      return await response.json().catch(() => ({}));
    },
    onSuccess: () => {
      toast({
        title: "Test successful",
        description: "Test notification sent successfully to n8n webhook"
      });
    },
    onError: (error) => {
      toast({
        title: "Test failed",
        description: error.message,
        variant: "destructive"
      });
    },
    onSettled: () => {
      setTestingWebhook(null);
    }
  });

  const handleWebhookUpdate = (config: WebhookConfig, field: 'url' | 'enabled', value: string | boolean) => {
    const updatedValue = {
      ...config.config_value,
      [field]: value
    };
    
    updateWebhookMutation.mutate({
      id: config.id,
      configValue: updatedValue
    });
  };

  const handleNotificationUpdate = (config: NotificationConfig, field: string, value: any) => {
    const updatedValue = {
      ...config.config_value,
      [field]: value
    };
    
    updateNotificationMutation.mutate({
      id: config.id,
      configValue: updatedValue
    });
  };

  const testWebhook = (webhookUrl: string, configKey: string) => {
    setTestingWebhook(configKey);
    testWebhookMutation.mutate(webhookUrl);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      case 'retrying': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'pending': 
      case 'retrying': return <Clock className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  if (webhooksLoading || notificationsLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Teams Integration</h2>
        <p className="text-muted-foreground">
          Configure Microsoft Teams notifications via n8n automation workflows. 
          Set up webhook URLs and customize when notifications are sent.
        </p>
      </div>

      <Alert>
        <Bell className="h-4 w-4" />
        <AlertDescription>
          Make sure your n8n workflows are configured to receive webhooks and forward messages to the appropriate Teams channels.
          Each webhook URL should point to a specific n8n workflow that handles the notification type.
        </AlertDescription>
      </Alert>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>n8n Webhook URLs</CardTitle>
          <CardDescription>
            Configure webhook URLs for different types of notifications. Each URL should point to an n8n workflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {webhookConfigs?.map((config) => (
            <div key={config.id} className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {config.config_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.config_value.enabled}
                    onCheckedChange={(checked) => handleWebhookUpdate(config, 'enabled', checked)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {config.config_value.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Input
                  placeholder="https://your-n8n-instance.com/webhook/..."
                  value={config.config_value.url}
                  onChange={(e) => handleWebhookUpdate(config, 'url', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>

              {config.config_value.url && config.config_value.enabled && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testWebhook(config.config_value.url, config.config_key)}
                    disabled={testingWebhook === config.config_key}
                  >
                    {testingWebhook === config.config_key ? 'Testing...' : 'Test Webhook'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(config.config_value.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open n8n
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Configure when and how notifications are sent to Teams channels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationConfigs?.map((config) => (
            <div key={config.id} className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {config.config_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Label>
                <Switch
                  checked={config.config_value.enabled}
                  onCheckedChange={(checked) => handleNotificationUpdate(config, 'enabled', checked)}
                />
              </div>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>
            Monitor the status of recent Teams notifications sent via n8n.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentNotifications && recentNotifications.length > 0 ? (
            <div className="space-y-2">
              {recentNotifications.map((notification) => (
                <div key={notification.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center space-x-2 ${getStatusColor(notification.status)}`}>
                      {getStatusIcon(notification.status)}
                      <Badge variant={notification.status === 'sent' ? 'default' : 
                                   notification.status === 'failed' ? 'destructive' : 'secondary'}>
                        {notification.status}
                      </Badge>
                    </div>
                    <div>
                      <div className="font-medium">
                        {notification.notification_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(notification.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">Referral: {notification.referral_id?.slice(0, 8)}...</div>
                    {notification.error_message && (
                      <div className="text-xs text-red-600">{notification.error_message}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent notifications found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamsIntegrationSettings;