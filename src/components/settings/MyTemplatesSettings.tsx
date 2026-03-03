import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Trash2, Zap, Loader2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  interaction_type: string;
  default_notes: string | null;
  default_duration_minutes: number | null;
  is_global: boolean;
  user_id: string | null;
}

const INTERACTION_TYPES = ['Visit', 'Presentation', 'Call', 'Meeting', 'Email', 'Event'];

const MyTemplatesSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', interaction_type: 'Visit', default_notes: '', default_duration_minutes: '15' });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['activity-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_templates')
        .select('*')
        .order('is_global', { ascending: false })
        .order('name');
      if (error) throw error;
      return data as Template[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('activity_templates').insert({
        user_id: user?.id,
        name: form.name,
        interaction_type: form.interaction_type,
        default_notes: form.default_notes || null,
        default_duration_minutes: parseInt(form.default_duration_minutes) || 15,
        is_global: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-templates'] });
      toast({ title: 'Template created' });
      setForm({ name: '', interaction_type: 'Visit', default_notes: '', default_duration_minutes: '15' });
      setShowForm(false);
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('activity_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-templates'] });
      toast({ title: 'Template deleted' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const globalTemplates = templates?.filter(t => t.is_global) || [];
  const userTemplates = templates?.filter(t => !t.is_global) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          My Activity Templates
        </CardTitle>
        <CardDescription>Create quick-log templates for common activities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Global templates */}
        {globalTemplates.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Global Templates</p>
            <div className="space-y-2">
              {globalTemplates.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.interaction_type} • {t.default_duration_minutes} min</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">Global</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User templates */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Your Templates</p>
            <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="w-3 h-3 mr-1" />
              New
            </Button>
          </div>

          {showForm && (
            <div className="p-4 rounded-lg border border-border bg-card space-y-3 mb-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Quick Follow-Up" />
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={form.interaction_type} onValueChange={v => setForm(p => ({ ...p, interaction_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INTERACTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Default Notes</Label>
                  <Textarea value={form.default_notes} onChange={e => setForm(p => ({ ...p, default_notes: e.target.value }))} rows={2} />
                </div>
                <div>
                  <Label className="text-xs">Duration (min)</Label>
                  <Input type="number" value={form.default_duration_minutes} onChange={e => setForm(p => ({ ...p, default_duration_minutes: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                  Create
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : userTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No custom templates yet. Create one above.</p>
          ) : (
            <div className="space-y-2">
              {userTemplates.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.interaction_type} • {t.default_duration_minutes} min{t.default_notes ? ` • ${t.default_notes}` : ''}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(t.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyTemplatesSettings;
