import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Briefcase, TrendingUp, Users } from 'lucide-react';

const TrainingMetrics = () => {
  // Fetch partnership stage distribution
  const { data: stageDistribution } = useQuery({
    queryKey: ['partnership-stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('partnership_stage')
        .not('partnership_stage', 'is', null);
      
      if (error) throw error;
      
      const stages = {
        prospect: 0,
        developing: 0,
        active: 0,
        strategic: 0
      };
      
      data?.forEach(org => {
        if (org.partnership_stage in stages) {
          stages[org.partnership_stage as keyof typeof stages]++;
        }
      });
      
      return stages;
    }
  });

  // Fetch training completion stats
  const { data: trainingStats } = useQuery({
    queryKey: ['training-completion-stats'],
    queryFn: async () => {
      const { data: checklists } = await supabase
        .from('organization_checklists')
        .select('id');
      
      const { data: completions } = await supabase
        .from('checklist_completions')
        .select('checklist_id, completed_items');
      
      const totalChecklists = checklists?.length || 0;
      const completedChecklists = completions?.filter(c => 
        c.completed_items && c.completed_items.length > 0
      ).length || 0;
      
      return {
        totalChecklists,
        completedChecklists,
        completionRate: totalChecklists > 0 
          ? (completedChecklists / totalChecklists) * 100 
          : 0
      };
    }
  });

  // Fetch recent training reviews
  const { data: recentReviews } = useQuery({
    queryKey: ['recent-training-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('name, last_training_review')
        .not('last_training_review', 'is', null)
        .order('last_training_review', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  const totalOrgs = Object.values(stageDistribution || {}).reduce((a, b) => a + b, 0);
  
  const stageColors = {
    prospect: 'bg-gray-100 text-gray-800',
    developing: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    strategic: 'bg-purple-100 text-purple-800'
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Training & Partnership Metrics</CardTitle>
            <CardDescription>Overview of partner development and training progress</CardDescription>
          </div>
          <BookOpen className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Partnership Stages */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center">
            <Briefcase className="w-4 h-4 mr-2" />
            Partnership Pipeline
          </h4>
          <div className="space-y-2">
            {Object.entries(stageDistribution || {}).map(([stage, count]) => {
              const percentage = totalOrgs > 0 ? (count / totalOrgs) * 100 : 0;
              return (
                <div key={stage} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <Badge 
                      variant="secondary" 
                      className={stageColors[stage as keyof typeof stageColors]}
                    >
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </Badge>
                    <span className="text-muted-foreground">{count} orgs</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Training Completion */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Training Progress
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Checklist Completion Rate</span>
              <span className="text-sm font-medium">
                {trainingStats?.completionRate.toFixed(0)}%
              </span>
            </div>
            <Progress value={trainingStats?.completionRate || 0} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {trainingStats?.completedChecklists} of {trainingStats?.totalChecklists} checklists started
            </p>
          </div>
        </div>

        {/* Recent Training Reviews */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Recent Training Reviews
          </h4>
          {recentReviews && recentReviews.length > 0 ? (
            <div className="space-y-2">
              {recentReviews.map((review, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[150px]">{review.name}</span>
                  <span className="text-muted-foreground">
                    {new Date(review.last_training_review).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No training reviews recorded yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingMetrics; 