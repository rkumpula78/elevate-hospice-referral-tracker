
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { 
  BookOpen, 
  CheckCircle2, 
  Target, 
  TrendingUp, 
  Users, 
  Calendar,
  ChevronRight,
  Award
} from 'lucide-react';

interface OrganizationTrainingProps {
  organizationId: string;
  organizationType: string;
}

// Type guards for JSONB data
const isStringArray = (value: any): value is string[] => {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
};

const isObjectArray = (value: any): value is any[] => {
  return Array.isArray(value);
};

const OrganizationTraining: React.FC<OrganizationTrainingProps> = ({ 
  organizationId, 
  organizationType 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  // Fetch training modules for this organization type from database
  const { data: trainingModules, isLoading: modulesLoading } = useQuery({
    queryKey: ['training-modules', organizationType],
    queryFn: async () => {
      console.log('Fetching training modules for organization type:', organizationType);
      const { data, error } = await supabase
        .from('organization_training_modules')
        .select('*')
        .eq('organization_type', organizationType)
        .eq('is_active', true)
        .order('order_index');
      
      if (error) {
        console.error('Error fetching training modules:', error);
        throw error;
      }
      console.log('Training modules fetched:', data);
      return data;
    }
  });

  // Fetch checklists for this organization type from database
  const { data: checklists, isLoading: checklistsLoading } = useQuery({
    queryKey: ['organization-checklists', organizationType],
    queryFn: async () => {
      console.log('Fetching checklists for organization type:', organizationType);
      const { data, error } = await supabase
        .from('organization_checklists')
        .select('*')
        .eq('organization_type', organizationType)
        .eq('is_active', true)
        .order('order_index');
      
      if (error) {
        console.error('Error fetching checklists:', error);
        throw error;
      }
      console.log('Checklists fetched:', data);
      return data;
    }
  });

  // Fetch checklist completions for this organization from database
  const { data: checklistCompletions } = useQuery({
    queryKey: ['checklist-completions', organizationId],
    queryFn: async () => {
      console.log('Fetching checklist completions for organization:', organizationId);
      const { data, error } = await supabase
        .from('checklist_completions')
        .select('*')
        .eq('organization_id', organizationId);
      
      if (error) {
        console.error('Error fetching checklist completions:', error);
        throw error;
      }
      console.log('Checklist completions fetched:', data);
      return data;
    }
  });

  // Mutation to update checklist completion
  const updateChecklistCompletion = useMutation({
    mutationFn: async ({ checklistId, itemId, completed }: { 
      checklistId: string; 
      itemId: string; 
      completed: boolean 
    }) => {
      const completion = checklistCompletions?.find(c => c.checklist_id === checklistId);
      let completedItems: string[] = [];
      
      if (completion?.completed_items && isStringArray(completion.completed_items)) {
        completedItems = completion.completed_items;
      }

      if (completed) {
        completedItems = [...completedItems, itemId];
      } else {
        completedItems = completedItems.filter((id: string) => id !== itemId);
      }

      if (completion) {
        const { error } = await supabase
          .from('checklist_completions')
          .update({ 
            completed_items: completedItems,
            updated_at: new Date().toISOString()
          })
          .eq('id', completion.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('checklist_completions')
          .insert({
            organization_id: organizationId,
            checklist_id: checklistId,
            completed_items: completedItems
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-completions', organizationId] });
      toast({
        title: "Progress saved",
        description: "Checklist progress has been updated."
      });
    }
  });

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getChecklistProgress = (checklistId: string, items: any[]) => {
    const completion = checklistCompletions?.find(c => c.checklist_id === checklistId);
    if (!completion?.completed_items || !isStringArray(completion.completed_items)) {
      return 0;
    }
    const completedCount = completion.completed_items.length;
    return (completedCount / items.length) * 100;
  };

  const isItemCompleted = (checklistId: string, itemId: string) => {
    const completion = checklistCompletions?.find(c => c.checklist_id === checklistId);
    if (!completion?.completed_items || !isStringArray(completion.completed_items)) {
      return false;
    }
    return completion.completed_items.includes(itemId);
  };

  // Show loading state
  if (modulesLoading || checklistsLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg">Loading training content...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderValueProposition = (module: any) => {
    const content = module.content;
    return (
      <Card key={module.id} className="mb-4">
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleModule(module.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">{content.title}</CardTitle>
            </div>
            <ChevronRight 
              className={`w-5 h-5 transition-transform ${
                expandedModules.includes(module.id) ? 'rotate-90' : ''
              }`}
            />
          </div>
        </CardHeader>
        {expandedModules.includes(module.id) && (
          <CardContent>
            <div className="space-y-4">
              {content.main_message && (
                <div>
                  <h4 className="font-semibold mb-2">Main Message:</h4>
                  <p className="text-sm text-muted-foreground">{content.main_message}</p>
                </div>
              )}
              {content.key_benefits && isObjectArray(content.key_benefits) && (
                <div>
                  <h4 className="font-semibold mb-2">Key Benefits:</h4>
                  <ul className="space-y-2">
                    {content.key_benefits.map((benefit: any, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{benefit.title}</span>
                          <p className="text-sm text-muted-foreground">{benefit.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {content.talking_points && isStringArray(content.talking_points) && (
                <div>
                  <h4 className="font-semibold mb-2">Talking Points:</h4>
                  <ul className="space-y-2">
                    {content.talking_points.map((point: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground pl-4">
                        • {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  const renderActionPlan = (module: any) => {
    const content = module.content;
    return (
      <Card key={module.id} className="mb-4">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{content.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {content.phases && isObjectArray(content.phases) ? content.phases.map((phase: any, index: number) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{phase.name}</h4>
                  <Badge variant="outline">{phase.days}</Badge>
                </div>
                <ul className="space-y-2">
                  {phase.actions && isStringArray(phase.actions) ? phase.actions.map((action: string, actionIndex: number) => (
                    <li key={actionIndex} className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <span className="text-xs font-semibold">{actionIndex + 1}</span>
                      </div>
                      <span className="text-sm">{action}</span>
                    </li>
                  )) : null}
                </ul>
              </div>
            )) : null}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderKPIs = (module: any) => {
    const content = module.content;
    return (
      <Card key={module.id} className="mb-4">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{content.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {content.metrics && isObjectArray(content.metrics) ? content.metrics.map((metric: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{metric.name}</h4>
                  <Target className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">{metric.description}</p>
                <Badge variant="secondary">{metric.target}</Badge>
              </div>
            )) : null}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderChecklist = (checklist: any) => {
    const items = checklist.items && isObjectArray(checklist.items) ? checklist.items : [];
    const progress = getChecklistProgress(checklist.id, items);
    
    return (
      <Card key={checklist.id} className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{checklist.checklist_name}</CardTitle>
              <CardDescription>{checklist.days_range}</CardDescription>
            </div>
            <Badge variant={checklist.phase === 'foundation' ? 'default' : 
                         checklist.phase === 'engagement' ? 'secondary' : 'outline'}>
              {checklist.phase}
            </Badge>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-start space-x-2">
                  <Checkbox
                    checked={isItemCompleted(checklist.id, item.id)}
                    onCheckedChange={(checked) => 
                      updateChecklistCompletion.mutate({
                        checklistId: checklist.id,
                        itemId: item.id,
                        completed: checked as boolean
                      })
                    }
                  />
                  <div className="flex-1">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {item.task}
                    </label>
                    {item.priority && (
                      <Badge 
                        variant={item.priority === 'high' ? 'destructive' : 
                                item.priority === 'medium' ? 'default' : 'secondary'}
                        className="ml-2 text-xs"
                      >
                        {item.priority}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  return (
    <Tabs defaultValue="value-props" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="value-props">
          <BookOpen className="w-4 h-4 mr-2" />
          Value Props
        </TabsTrigger>
        <TabsTrigger value="action-plan">
          <Calendar className="w-4 h-4 mr-2" />
          Action Plan
        </TabsTrigger>
        <TabsTrigger value="checklists">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Checklists
        </TabsTrigger>
        <TabsTrigger value="kpis">
          <TrendingUp className="w-4 h-4 mr-2" />
          KPIs
        </TabsTrigger>
      </TabsList>

      <TabsContent value="value-props" className="mt-6">
        <div className="space-y-4">
          {trainingModules && trainingModules.length > 0 ? (
            trainingModules
              .filter(m => m.module_category === 'value_proposition')
              .map(module => renderValueProposition(module))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    No training modules found for {organizationType}. 
                    Check that the database migration completed successfully.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="action-plan" className="mt-6">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground">Action plan modules coming soon for {organizationType}.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="checklists" className="mt-6">
        <div className="space-y-4">
          {checklists && checklists.length > 0 ? (
            checklists.map(checklist => renderChecklist(checklist))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    No checklists found for {organizationType}. 
                    Check that the database migration completed successfully.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="kpis" className="mt-6">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground">KPI modules coming soon for {organizationType}.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default OrganizationTraining;
