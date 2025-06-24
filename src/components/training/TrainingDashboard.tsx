
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  CheckCircle2, 
  Target, 
  TrendingUp, 
  Users, 
  Calendar,
  Award,
  Clock
} from 'lucide-react';

const TrainingDashboard = () => {
  // Get current user info (would normally come from auth context)
  const marketerName = "Current Marketer"; // Replace with actual auth user

  // Fetch all training modules from database
  const { data: allModules, isLoading: modulesLoading } = useQuery({
    queryKey: ['all-training-modules'],
    queryFn: async () => {
      console.log('Fetching training modules from database...');
      const { data, error } = await supabase
        .from('organization_training_modules')
        .select('*')
        .eq('is_active', true)
        .order('organization_type, order_index');
      
      if (error) {
        console.error('Error fetching training modules:', error);
        throw error;
      }
      console.log('Training modules fetched:', data);
      return data;
    }
  });

  // Fetch marketer's training progress from database
  const { data: trainingProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['marketer-training-progress', marketerName],
    queryFn: async () => {
      console.log('Fetching training progress from database...');
      const { data, error } = await supabase
        .from('marketer_training_progress')
        .select('*')
        .eq('marketer_name', marketerName);
      
      if (error) {
        console.error('Error fetching training progress:', error);
        throw error;
      }
      console.log('Training progress fetched:', data);
      return data;
    }
  });

  // Show loading state
  if (modulesLoading || progressLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg">Loading training data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group modules by organization type
  const modulesByType = allModules?.reduce((acc: any, module: any) => {
    if (!acc[module.organization_type]) {
      acc[module.organization_type] = [];
    }
    acc[module.organization_type].push(module);
    return acc;
  }, {}) || {};

  // Calculate progress for each organization type
  const getTypeProgress = (type: string) => {
    const typeModules = modulesByType[type] || [];
    const completedModules = trainingProgress?.filter(p => 
      typeModules.some((m: any) => m.id === p.module_id)
    ).length || 0;
    
    return typeModules.length > 0 ? (completedModules / typeModules.length) * 100 : 0;
  };

  const getOrgTypeLabel = (type: string) => {
    const labels: any = {
      'assisted_living': 'Assisted Living Facilities',
      'hospital': 'Hospitals',
      'physician_office': 'Physician Offices',
      'nursing_home': 'Skilled Nursing Facilities',
      'home_health': 'Home Health Agencies',
      'clinic': 'Cancer Centers & Clinics'
    };
    return labels[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getOrgTypeIcon = (type: string) => {
    const icons: any = {
      'assisted_living': <Users className="w-5 h-5" />,
      'hospital': <Target className="w-5 h-5" />,
      'physician_office': <TrendingUp className="w-5 h-5" />,
      'nursing_home': <Calendar className="w-5 h-5" />,
      'home_health': <Clock className="w-5 h-5" />,
      'clinic': <Award className="w-5 h-5" />
    };
    return icons[type] || <BookOpen className="w-5 h-5" />;
  };

  const totalModules = allModules?.length || 0;
  const completedModules = trainingProgress?.length || 0;
  const overallProgress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  console.log('Dashboard data:', { 
    totalModules, 
    completedModules, 
    overallProgress, 
    modulesByType: Object.keys(modulesByType),
    allModules: allModules?.length 
  });

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>Training Overview</span>
          </CardTitle>
          <CardDescription>
            Your comprehensive training progress across all partnership types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {completedModules} of {totalModules} modules completed
                </span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>
            
            {overallProgress === 100 && totalModules > 0 && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Congratulations! You've completed all training modules!</span>
              </div>
            )}

            {totalModules === 0 && (
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  Training modules are being loaded from the database. 
                  If this persists, check that the database migration was successful.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress by Organization Type */}
      {Object.keys(modulesByType).length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.keys(modulesByType).map((type) => {
            const progress = getTypeProgress(type);
            const moduleCount = modulesByType[type]?.length || 0;
            const completedCount = trainingProgress?.filter(p => 
              modulesByType[type]?.some((m: any) => m.id === p.module_id)
            ).length || 0;

            return (
              <Card key={type}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getOrgTypeIcon(type)}
                      <CardTitle className="text-base">
                        {getOrgTypeLabel(type)}
                      </CardTitle>
                    </div>
                    {progress === 100 && moduleCount > 0 && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {completedCount} of {moduleCount} modules completed
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{totalModules}</p>
              <p className="text-xs text-muted-foreground">Total Modules</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{completedModules}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{totalModules - completedModules}</p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{Math.round(overallProgress)}%</p>
              <p className="text-xs text-muted-foreground">Progress</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrainingDashboard;
