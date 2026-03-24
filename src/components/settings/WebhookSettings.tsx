import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Webhook, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface WebhookConfig {
  id: string;
  event_type: string;
  webhook_url: string;
  enabled: boolean;
  last_triggered_at: string | null;
  last_status: string | null;
}

interface WebhookLog {
  id: string;
  event_type: string;
  referral_id: string | null;
  http_status: number | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

const WebhookSettings = () => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: configs, isLoading: configsLoading } = useQuery({
    queryKey: ['webhook-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_config')
        .select('*')
        .order('event_type');
      if (error) throw error;
      return data as WebhookConfig[];
    },
  });

  const { data: logs } = useQuery({
    queryKey: ['webhook-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as WebhookLog[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WebhookConfig> }) => {
      const { error } = await supabase
        .from('webhook_config')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-config'] });
      toast({ title: 'Webhook config updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
    },
  });

  const eventLabels: Record<string, string> = {
    new_referral: 'New Referral Created',
    status_change: 'Referral Status Change',
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Webhook Integrations (n8n)
        </CardTitle>
        <CardDescription>
          Configure webhook URLs for automated Teams notifications via n8n workflows
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {configsLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          configs?.map((config) => (
            <WebhookConfigRow
              key={config.id}
              config={config}
              label={eventLabels[config.event_type] || config.event_type}
              onUpdate={(updates) => updateMutation.mutate({ id: config.id, updates })}
              disabled={updateMutation.isPending}
            />
          ))
        )}

        {/* Recent logs */}
        {logs && logs.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Recent Webhook Activity</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 text-xs p-2 rounded bg-muted/50">
                  {log.success ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  )}
                  <Badge variant="outline" className="text-xs">
                    {log.event_type}
                  </Badge>
                  <span className="text-muted-foreground">
                    {log.http_status ? `HTTP ${log.http_status}` : log.error_message || 'No response'}
                  </span>
                  <span className="ml-auto text-muted-foreground">
                    {format(new Date(log.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

function WebhookConfigRow({
  config,
  label,
  onUpdate,
  disabled,
}: {
  config: WebhookConfig;
  label: string;
  onUpdate: (updates: Partial<WebhookConfig>) => void;
  disabled: boolean;
}) {
  const [url, setUrl] = React.useState(config.webhook_url);
  const urlChanged = url !== config.webhook_url;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">{label}</h4>
          {config.last_triggered_at && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              Last fired: {format(new Date(config.last_triggered_at), 'MMM d, h:mm a')}
              {config.last_status && (
                <Badge
                  variant={config.last_status === 'success' ? 'default' : 'destructive'}
                  className="ml-1 text-xs"
                >
                  {config.last_status}
                </Badge>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`toggle-${config.id}`} className="text-xs text-muted-foreground">
            {config.enabled ? 'Enabled' : 'Disabled'}
          </Label>
          <Switch
            id={`toggle-${config.id}`}
            checked={config.enabled}
            onCheckedChange={(checked) => onUpdate({ enabled: checked })}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="text-xs font-mono"
          disabled={disabled}
        />
        {urlChanged && (
          <Button
            size="sm"
            onClick={() => onUpdate({ webhook_url: url })}
            disabled={disabled}
          >
            Save
          </Button>
        )}
      </div>
    </div>
  );
}

export default WebhookSettings;
