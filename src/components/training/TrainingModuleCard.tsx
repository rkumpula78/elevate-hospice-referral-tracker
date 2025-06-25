
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, CheckCircle2, BookOpen, Users, Target } from 'lucide-react';

interface TrainingModuleCardProps {
  module: {
    id: string;
    module_name: string;
    module_category: string;
    content: any;
    organization_type: string;
  };
  isCompleted: boolean;
  onMarkComplete?: (moduleId: string) => void;
}

const TrainingModuleCard: React.FC<TrainingModuleCardProps> = ({
  module,
  isCompleted,
  onMarkComplete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'value_proposition':
        return <Users className="w-4 h-4" />;
      case 'action_plan':
        return <Target className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const renderContent = () => {
    const content = module.content;
    
    if (module.module_category === 'value_proposition') {
      return (
        <div className="space-y-4">
          {content.main_message && (
            <div>
              <h4 className="font-semibold mb-2">Main Message:</h4>
              <p className="text-sm text-muted-foreground">{content.main_message}</p>
            </div>
          )}
          
          {content.key_benefits && Array.isArray(content.key_benefits) && (
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

          {content.talking_points && Array.isArray(content.talking_points) && (
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

          {content.value_propositions && Array.isArray(content.value_propositions) && (
            <div>
              <h4 className="font-semibold mb-2">Value Propositions:</h4>
              <ul className="space-y-2">
                {content.value_propositions.map((prop: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground pl-4">
                    • {prop}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {content.description && (
          <p className="text-sm text-muted-foreground">{content.description}</p>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getCategoryIcon(module.module_category)}
            <div>
              <CardTitle className="text-lg">{module.module_name}</CardTitle>
              <CardDescription className="capitalize">
                {module.module_category.replace('_', ' ')} | {module.organization_type.replace('_', ' ')}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={isCompleted ? "default" : "outline"}
              className={isCompleted ? "bg-green-500" : ""}
            >
              {isCompleted ? "Completed" : "Available"}
            </Badge>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          {renderContent()}
          
          {!isCompleted && onMarkComplete && (
            <div className="mt-4 pt-4 border-t">
              <Button 
                onClick={() => onMarkComplete(module.id)}
                className="w-full"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark as Complete
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default TrainingModuleCard;
