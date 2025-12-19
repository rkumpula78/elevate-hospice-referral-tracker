import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Settings, 
  MessageSquare, 
  Clock,
  Users,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useTeamsIntegration } from '@/hooks/useTeamsIntegration';
import { format } from 'date-fns';

interface TeamsNotificationDashboardProps {
  className?: string;
}

const TeamsNotificationDashboard: React.FC<TeamsNotificationDashboardProps> = ({ className }) => {
  const {
    integrationState,
    notifications,
    retryFailedNotifications,
    checkF2FDeadlines,
    isLoading,
    refetchNotifications
  } = useTeamsIntegration();

  const [settings, setSettings] = useState({
    autoNotifyNewReferrals: true,
    autoNotifyStatusChanges: true,
    autoNotifyF2FDeadlines: true,
    autoCreateCalendarEvents: false,
    notificationFrequency: 'immediate' as 'immediate' | 'hourly' | 'daily'
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Sent
        </Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case 'retried':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <RefreshCw className="h-3 w-3 mr-1" />
          Retried
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'new_referral':
        return <MessageSquare className="h-4 w-4" />;
      case 'f2f_deadline':
        return <Calendar className="h-4 w-4" />;
      case 'status_change':
        return <Activity className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatNotificationType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Calculate stats - temporarily return zeros until teams_notifications table is created
  const notificationStats = {
    total: 0, sent: 0, failed: 0, pending: 0, retried: 0
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Teams Integration
              </CardTitle>
              <CardDescription>
                Manage Microsoft Teams notifications and calendar integration
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {integrationState.webhookConfigured ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Wifi className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!integrationState.webhookConfigured && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Teams webhook URL is not configured. Add REACT_APP_TEAMS_WEBHOOK_URL to your environment variables to enable notifications.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="notifications" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-2xl font-bold">{notificationStats.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Sent</p>
                        <p className="text-2xl font-bold text-green-600">{notificationStats.sent}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-sm text-gray-600">Failed</p>
                        <p className="text-2xl font-bold text-red-600">{notificationStats.failed}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <div>
                        <p className="text-sm text-gray-600">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">{notificationStats.pending}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => checkF2FDeadlines()}
                  disabled={isLoading.f2fDeadline}
                  variant="outline"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Check F2F Deadlines
                </Button>
                
                <Button
                  onClick={() => retryFailedNotifications()}
                  disabled={isLoading.retry || notificationStats.failed === 0}
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading.retry ? 'animate-spin' : ''}`} />
                  Retry Failed ({notificationStats.failed})
                </Button>
                
                <Button
                  onClick={() => refetchNotifications()}
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Notification History */}
              <div className="space-y-2">
                <h3 className="font-medium">Recent Notifications</h3>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {false ? (
                    []
                  ) : (
                    <Card className="p-8">
                      <div className="text-center text-gray-500">
                        <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No notifications yet</p>
                        <p className="text-sm">Notifications will appear here when sent</p>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Calendar Integration</h3>
                    <p className="text-sm text-gray-600">
                      Sync F2F appointments with Microsoft Teams calendar
                    </p>
                  </div>
                  <Badge variant={integrationState.isConnected ? "outline" : "secondary"}>
                    {integrationState.isConnected ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>

                {!integrationState.isConnected && (
                  <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription>
                      Connect to Microsoft Teams to enable automatic calendar event creation for F2F appointments.
                    </AlertDescription>
                  </Alert>
                )}

                <Card className="p-4">
                  <div className="text-center text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Calendar sync coming soon</p>
                    <p className="text-sm">F2F appointments will automatically sync to Teams calendar</p>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Notification Settings</h3>
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
                        checked={settings.autoNotifyNewReferrals}
                        onCheckedChange={(checked) =>
                          setSettings(prev => ({ ...prev, autoNotifyNewReferrals: checked }))
                        }
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
                        checked={settings.autoNotifyStatusChanges}
                        onCheckedChange={(checked) =>
                          setSettings(prev => ({ ...prev, autoNotifyStatusChanges: checked }))
                        }
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
                        checked={settings.autoNotifyF2FDeadlines}
                        onCheckedChange={(checked) =>
                          setSettings(prev => ({ ...prev, autoNotifyF2FDeadlines: checked }))
                        }
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
                        checked={settings.autoCreateCalendarEvents}
                        onCheckedChange={(checked) =>
                          setSettings(prev => ({ ...prev, autoCreateCalendarEvents: checked }))
                        }
                        disabled={!integrationState.isConnected}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-4">Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="webhook-url">Teams Webhook URL</Label>
                      <Input
                        id="webhook-url"
                        value={integrationState.webhookConfigured ? '••••••••••••••••' : ''}
                        placeholder="Configure in environment variables"
                        disabled
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Set REACT_APP_TEAMS_WEBHOOK_URL in your environment variables
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamsNotificationDashboard;