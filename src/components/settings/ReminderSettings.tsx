import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Bell } from 'lucide-react';

const ReminderSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: prefs = {} } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preference_key, preference_value')
        .eq('user_id', user!.id);
      if (error) throw error;
      return Object.fromEntries((data || []).map(p => [p.preference_key, p.preference_value]));
    },
    enabled: !!user,
  });

  const upsertPref = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          { user_id: user!.id, preference_key: key, preference_value: value },
          { onConflict: 'user_id,preference_key' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Error saving preference', description: err.message, variant: 'destructive' });
    },
  });

  const handleBrowserPush = async (checked: boolean) => {
    if (checked && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({ title: 'Permission denied', description: 'Browser notifications were blocked. Enable them in your browser settings.', variant: 'destructive' });
        return;
      }
    }
    upsertPref.mutate({ key: 'reminder_browser_push', value: String(checked) });
    toast({ title: checked ? 'Notifications enabled' : 'Notifications disabled' });
  };

  const handleEmailDigest = async (checked: boolean) => {
    upsertPref.mutate({ key: 'reminder_email_digest', value: String(checked) });
  };

  const handleHoursBefore = (value: string) => {
    upsertPref.mutate({ key: 'reminder_hours_before', value });
    toast({ title: 'Reminder timing updated' });
  };

  return (
    <Card>
      <CardHeader className={isMobile ? 'p-4' : ''}>
        <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
          <Bell className="w-5 h-5" />
          Reminders
        </CardTitle>
        {!isMobile && <CardDescription>Configure follow-up reminder notifications</CardDescription>}
      </CardHeader>
      <CardContent className={`space-y-5 ${isMobile ? 'p-4 pt-0' : ''}`}>
        {/* Browser Push */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Browser Notifications</Label>
            <p className="text-xs text-muted-foreground">Get notified of overdue & due follow-ups</p>
          </div>
          <Switch
            checked={prefs.reminder_browser_push === 'true'}
            onCheckedChange={handleBrowserPush}
          />
        </div>

        {/* Email Digest */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <Label className="text-sm font-medium">Daily Email Digest</Label>
              <p className="text-xs text-muted-foreground">Receive a daily summary of pending items</p>
            </div>
            <Badge variant="outline" className="text-[10px]">Coming Soon</Badge>
          </div>
          <Switch
            checked={prefs.reminder_email_digest === 'true'}
            onCheckedChange={handleEmailDigest}
            disabled
          />
        </div>

        {/* Reminder Timing */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Remind Me Before</Label>
            <p className="text-xs text-muted-foreground">How early to trigger reminders</p>
          </div>
          <Select
            value={prefs.reminder_hours_before || '24'}
            onValueChange={handleHoursBefore}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 hour</SelectItem>
              <SelectItem value="2">2 hours</SelectItem>
              <SelectItem value="24">24 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReminderSettings;
