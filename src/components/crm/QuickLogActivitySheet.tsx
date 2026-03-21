import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Zap, Clock, FileText, Loader2, Pencil } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { getFollowUpDays } from '@/lib/followUpLogic';

interface QuickLogActivitySheetProps {
  organizationId: string;
  organizationName: string;
  accountRating?: string | null;
  trigger?: React.ReactNode;
}

interface ActivityTemplate {
  id: string;
  name: string;
  interaction_type: string;
  default_notes: string | null;
  default_duration_minutes: number | null;
  is_global: boolean;
}

const TYPE_ICON_MAP: Record<string, string> = {
  'Visit': '🏢',
  'Presentation': '📊',
  'Call': '📞',
  'Meeting': '🤝',
};

const QuickLogActivitySheet = ({ organizationId, organizationName, accountRating, trigger }: QuickLogActivitySheetProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['activity-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_templates')
        .select('*')
        .order('is_global', { ascending: false })
        .order('name');
      if (error) throw error;
      return data as ActivityTemplate[];
    },
  });

  const logMutation = useMutation({
    mutationFn: async (template: ActivityTemplate) => {
      const days = getFollowUpDays(accountRating);
      const followUpDate = format(addDays(new Date(), days), 'yyyy-MM-dd');
      const notes = additionalNotes
        ? `${template.default_notes || ''}\n\n${additionalNotes}`.trim()
        : template.default_notes || '';

      // Map template interaction_type to activity_communications interaction_type
      const typeMap: Record<string, string> = {
        'Visit': 'in_person_visit',
        'Presentation': 'lunch_learn',
        'Call': 'phone_call',
        'Meeting': 'in_person_visit',
      };

      const { error } = await supabase
        .from('activity_communications')
        .insert({
          organization_id: organizationId,
          interaction_type: typeMap[template.interaction_type] || 'in_person_visit',
          completed_by: user?.email || 'Unknown',
          discussion_points: notes,
          duration_minutes: template.default_duration_minutes,
          follow_up_required: true,
          follow_up_date: followUpDate,
          activity_date: new Date().toISOString(),
          outcome_sentiment: 'neutral',
        });
      if (error) throw error;
      return followUpDate;
    },
    onSuccess: (followUpDate) => {
      queryClient.invalidateQueries({ queryKey: ['activity-communications'] });
      const formattedDate = format(new Date(followUpDate), 'MMM d, yyyy');
      toast({
        title: '✅ Activity logged',
        description: `Follow-up set for ${formattedDate}.`,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Navigate to the activities tab / edit
              queryClient.invalidateQueries({ queryKey: ['activity-communications'] });
            }}
          >
            <Pencil className="w-3 h-3 mr-1" />
            Edit
          </Button>
        ),
      });
      setOpen(false);
      setSelectedTemplate(null);
      setAdditionalNotes('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error logging activity', description: error.message, variant: 'destructive' });
    },
  });

  const handleTemplateSelect = (template: ActivityTemplate) => {
    setSelectedTemplate(template);
  };

  const isInPersonType = (type: string) =>
    ['Visit', 'Meeting', 'Presentation'].includes(type);

  const handleConfirm = () => {
    if (!selectedTemplate) return;
    // Validate notes for in-person types
    if (isInPersonType(selectedTemplate.interaction_type)) {
      const totalNotes = ((selectedTemplate.default_notes || '') + ' ' + additionalNotes).trim();
      if (totalNotes.length < 10) {
        toast({
          title: '⚠️ Short notes',
          description: 'In-person activities should include meaningful discussion notes (10+ characters).',
          variant: 'warning',
        });
      }
    }
    logMutation.mutate(selectedTemplate);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSelectedTemplate(null); setAdditionalNotes(''); } }}>
      <SheetTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-2">
            <Zap className="w-4 h-4" />
            Quick Log
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-left">
            Log Activity — {organizationName}
          </SheetTitle>
        </SheetHeader>

        {!selectedTemplate ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">Tap a template to pre-fill:</p>
            {templatesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {templates?.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTemplateSelect(t)}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left"
                  >
                    <span className="text-2xl mt-0.5">{TYPE_ICON_MAP[t.interaction_type] || '📋'}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{t.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{t.default_duration_minutes} min</span>
                        <span>•</span>
                        <span>{t.interaction_type}</span>
                      </div>
                      {t.default_notes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{t.default_notes}</p>
                      )}
                    </div>
                    {!t.is_global && (
                      <Badge variant="outline" className="ml-auto text-[10px] shrink-0">Custom</Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="p-3 rounded-lg bg-accent/30 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{TYPE_ICON_MAP[selectedTemplate.interaction_type] || '📋'}</span>
                <p className="font-medium">{selectedTemplate.name}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selectedTemplate.default_duration_minutes} min</span>
                <span>{selectedTemplate.interaction_type}</span>
              </div>
              {selectedTemplate.default_notes && (
                <p className="text-sm text-muted-foreground mt-2 flex items-start gap-1">
                  <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                  {selectedTemplate.default_notes}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="additional-notes" className="text-sm">Additional Notes (optional)</Label>
              <Textarea
                id="additional-notes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Add any extra details..."
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedTemplate(null)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={logMutation.isPending} className="flex-1 gap-2">
                {logMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Save Activity
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default QuickLogActivitySheet;
