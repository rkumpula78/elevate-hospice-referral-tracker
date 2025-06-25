
import React from 'react';
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

const SimpleTrainingDashboard = () => {
  console.log('SimpleTrainingDashboard: Component is rendering');

  // Mock data for demonstration
  const mockProgress = {
    totalModules: 24,
    completedModules: 18,
    overallProgress: 75
  };

  const mockOrgTypes = [
    { type: 'assisted_living', label: 'Assisted Living Facilities', progress: 85, completed: 12, total: 14 },
    { type: 'hospital', label: 'Hospitals', progress: 60, completed: 3, total: 5 },
    { type: 'physician_office', label: 'Physician Offices', progress: 40, completed: 2, total: 5 },
    { type: 'nursing_home', label: 'Skilled Nursing Facilities', progress: 0, completed: 0, total: 4 },
    { type: 'home_health', label: 'Home Health Agencies', progress: 25, completed: 1, total: 4 },
    { type: 'clinic', label: 'Cancer Centers & Clinics', progress: 100, completed: 3, total: 3 }
  ];

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

  console.log('SimpleTrainingDashboard: About to render with mock data:', mockProgress);
  console.log('SimpleTrainingDashboard: Mock org types:', mockOrgTypes);

  // Debug component visibility
  React.useEffect(() => {
    console.log('SimpleTrainingDashboard: Component mounted successfully');
    const element = document.querySelector('[data-testid="training-dashboard"]');
    if (element) {
      console.log('SimpleTrainingDashboard: Dashboard element found in DOM');
    } else {
      console.error('SimpleTrainingDashboard: Dashboard element NOT found in DOM');
    }
  }, []);

  return (
    <div className="space-y-6" data-testid="training-dashboard">
      <div className="p-4 bg-blue-100 border border-blue-300 rounded-lg">
        <p className="text-blue-700 font-medium">Training Dashboard Debug Info:</p>
        <p className="text-sm text-blue-600">
          Component rendered with {mockProgress.totalModules} total modules, 
          {mockProgress.completedModules} completed ({mockProgress.overallProgress}% progress)
        </p>
      </div>

      {/* Overall Progress Card */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>Training Overview</span>
          </CardTitle>
          <CardDescription>
            Your comprehensive training progress across all partnership types
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {mockProgress.completedModules} of {mockProgress.totalModules} modules completed
                </span>
              </div>
              <Progress value={mockProgress.overallProgress} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">
                {mockProgress.overallProgress}% complete
              </p>
            </div>
            
            {mockProgress.overallProgress === 100 && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Congratulations! You've completed all training modules!</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress by Organization Type */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockOrgTypes.map((orgType) => (
          <Card key={orgType.type} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getOrgTypeIcon(orgType.type)}
                  <CardTitle className="text-base">
                    {orgType.label}
                  </CardTitle>
                </div>
                {orgType.progress === 100 && (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Complete
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={orgType.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {orgType.completed} of {orgType.total} modules completed ({orgType.progress}%)
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{mockProgress.totalModules}</p>
              <p className="text-xs text-muted-foreground">Total Modules</p>
            </div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{mockProgress.completedModules}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{mockProgress.totalModules - mockProgress.completedModules}</p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{mockProgress.overallProgress}%</p>
              <p className="text-xs text-muted-foreground">Progress</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Content Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Available Training Modules</CardTitle>
          <CardDescription>Sample training content for different organization types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">Assisted Living Value Propositions</p>
                  <p className="text-sm text-muted-foreground">ED, DON, Marketing, Social Services strategies</p>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500">Complete</Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border">
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">Hospital Partnership Development</p>
                  <p className="text-sm text-muted-foreground">Case managers, discharge planners, social workers</p>
                </div>
              </div>
              <Badge variant="secondary">In Progress</Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border">
              <div className="flex items-center space-x-3">
                <Award className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-medium">Cancer Center Relationships</p>
                  <p className="text-sm text-muted-foreground">Oncologists, nurse navigators, administrators</p>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500">Complete</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">
          Debug: Component fully rendered at {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default SimpleTrainingDashboard;
