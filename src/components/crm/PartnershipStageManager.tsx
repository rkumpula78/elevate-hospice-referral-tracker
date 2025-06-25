
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, Calendar, CheckCircle2, Briefcase, Star, Eye, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface PartnershipStageManagerProps {
  organizationId: string;
  currentStage: string;
  lastTrainingReview: string | null;
  partnershipNotes: string | null;
}

const PARTNERSHIP_STAGES = [
  {
    value: 'prospect',
    label: 'Prospect',
    icon: Eye,
    color: 'bg-gray-100 text-gray-800',
    description: 'Initial contact and qualification'
  },
  {
    value: 'developing',
    label: 'Developing',
    icon: TrendingUp,
    color: 'bg-blue-100 text-blue-800',
    description: 'Building relationship and trust'
  },
  {
    value: 'active',
    label: 'Active',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800',
    description: 'Regular referrals and engagement'
  },
  {
    value: 'strategic',
    label: 'Strategic Partner',
    icon: Star,
    color: 'bg-purple-100 text-purple-800',
    description: 'High-value strategic partnership'
  }
];

const PartnershipStageManager: React.FC<PartnershipStageManagerProps> = ({
  organizationId,
  currentStage = 'prospect',
  lastTrainingReview,
  partnershipNotes
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStage, setSelectedStage] = React.useState(currentStage);
  const [notes, setNotes] = React.useState(partnershipNotes || '');

  const updatePartnershipMutation = useMutation({
    mutationFn: async (data: { stage?: string; notes?: string; markTrainingReviewed?: boolean }) => {
      const updates: any = {
        partnership_notes: data.notes !== undefined ? data.notes : notes,
        updated_at: new Date().toISOString()
      };

      if (data.stage) {
        updates.partnership_stage = data.stage;
      }

      if (data.markTrainingReviewed) {
        updates.last_training_review = new Date().toISOString();
      }

      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });
      toast({
        title: "Partnership updated",
        description: "Partnership details have been saved."
      });
    }
  });

  const currentStageIndex = PARTNERSHIP_STAGES.findIndex(s => s.value === currentStage);
  const daysSinceReview = lastTrainingReview 
    ? Math.floor((Date.now() - new Date(lastTrainingReview).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      {/* Partnership Stage Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Partnership Stage</CardTitle>
          <CardDescription>Track the development of this partnership</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Stage Progress Visualization */}
            <div className="relative">
              <div className="flex items-center justify-between">
                {PARTNERSHIP_STAGES.map((stage, index) => {
                  const Icon = stage.icon;
                  const isActive = index <= currentStageIndex;
                  const isCurrent = stage.value === currentStage;
                  
                  return (
                    <div key={stage.value} className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="mt-2 text-center">
                        <p className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                          {stage.label}
                        </p>
                        <p className="text-xs text-gray-500 max-w-[100px]">{stage.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Progress Line */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 -z-10">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(currentStageIndex / (PARTNERSHIP_STAGES.length - 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Stage Selector */}
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label>Update Stage</Label>
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {PARTNERSHIP_STAGES.find(s => s.value === selectedStage) && (
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className={PARTNERSHIP_STAGES.find(s => s.value === selectedStage)?.color}
                          >
                            {PARTNERSHIP_STAGES.find(s => s.value === selectedStage)?.label}
                          </Badge>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg z-50">
                    {PARTNERSHIP_STAGES.map(stage => (
                      <SelectItem key={stage.value} value={stage.value} className="cursor-pointer hover:bg-gray-50">
                        <Badge variant="secondary" className={`${stage.color} mr-2`}>
                          {stage.label}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => updatePartnershipMutation.mutate({ stage: selectedStage })}
                disabled={selectedStage === currentStage}
              >
                Update Stage
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Review Status */}
      <Card>
        <CardHeader>
          <CardTitle>Training Review</CardTitle>
          <CardDescription>
            Track when training materials were last reviewed with this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              {lastTrainingReview ? (
                <>
                  <p className="text-sm font-medium">
                    Last reviewed: {format(new Date(lastTrainingReview), 'MMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {daysSinceReview} days ago
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No training review recorded</p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => updatePartnershipMutation.mutate({ markTrainingReviewed: true })}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Mark as Reviewed
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Partnership Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Partnership Notes</CardTitle>
          <CardDescription>
            Document important details about this partnership
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this partnership, key contacts, preferences, challenges, successes..."
              rows={4}
            />
            <Button
              onClick={() => updatePartnershipMutation.mutate({ notes })}
              disabled={notes === (partnershipNotes || '')}
            >
              Save Notes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnershipStageManager;
