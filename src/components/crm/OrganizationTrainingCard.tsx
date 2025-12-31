
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle2 } from 'lucide-react';

interface OrganizationTrainingCardProps {
  organizationType: string;
}

const OrganizationTrainingCard: React.FC<OrganizationTrainingCardProps> = ({ 
  organizationType 
}) => {
  // Mock training progress data
  const mockProgress = {
    'assisted_living': { completed: 12, total: 14, progress: 86 },
    'hospital': { completed: 3, total: 8, progress: 38 },
    'physician_office': { completed: 2, total: 6, progress: 33 },
    'nursing_home': { completed: 0, total: 5, progress: 0 },
    'home_health': { completed: 1, total: 4, progress: 25 },
    'clinic': { completed: 4, total: 4, progress: 100 }
  };

  const progress = mockProgress[organizationType as keyof typeof mockProgress] || 
                  { completed: 0, total: 4, progress: 0 };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <BookOpen className="w-4 h-4 mr-2" />
          Training Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {progress.completed} of {progress.total} modules
            </span>
            {progress.progress === 100 && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>
          <Progress value={progress.progress} className="h-2" />
          <p className="text-xs text-muted-foreground">{progress.progress}% complete</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationTrainingCard;
