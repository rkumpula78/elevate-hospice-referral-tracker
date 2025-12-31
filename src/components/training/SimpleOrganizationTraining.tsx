
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
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

interface SimpleOrganizationTrainingProps {
  organizationId: string;
  organizationType: string;
}

const SimpleOrganizationTraining: React.FC<SimpleOrganizationTrainingProps> = ({ 
  organizationId, 
  organizationType 
}) => {
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  // Mock data based on organization type
  const getMockContent = (type: string) => {
    const content: any = {
      'assisted_living': {
        valueProps: {
          title: 'Assisted Living Value Propositions',
          stakeholders: [
            {
              role: 'Executive Director',
              points: ['Seamless care transitions', 'Family satisfaction improvement', 'Reduced hospital readmissions']
            },
            {
              role: 'Director of Nursing',
              points: ['24/7 clinical support', 'Medication management', 'Pain control expertise']
            }
          ]
        },
        actionPlan: [
          { phase: 'Foundation (Days 1-30)', actions: ['Initial facility tour', 'Meet key decision makers', 'Present hospice overview'] },
          { phase: 'Engagement (Days 31-60)', actions: ['Provide educational materials', 'Schedule lunch & learns', 'Share success stories'] }
        ],
        kpis: [
          { name: 'Referral Volume', target: '2-3 per month', description: 'Monthly referrals from facility' },
          { name: 'Response Time', target: '< 2 hours', description: 'Time to respond to referral calls' }
        ]
      },
      'hospital': {
        valueProps: {
          title: 'Hospital Value Propositions',
          stakeholders: [
            {
              role: 'Case Manager',
              points: ['Faster discharges', 'Reduced length of stay', 'Seamless transitions']
            },
            {
              role: 'Social Worker',
              points: ['Family support services', 'Grief counseling', 'Spiritual care']
            }
          ]
        },
        actionPlan: [
          { phase: 'Foundation (Days 1-30)', actions: ['Meet discharge planning team', 'Understand current processes', 'Identify key contacts'] },
          { phase: 'Engagement (Days 31-60)', actions: ['Provide educational resources', 'Attend interdisciplinary rounds', 'Share quality metrics'] }
        ],
        kpis: [
          { name: 'Referral Volume', target: '8-12 per month', description: 'Monthly referrals from hospital' },
          { name: 'Conversion Rate', target: '> 85%', description: 'Referrals that result in admissions' }
        ]
      }
    };

    return content[type] || content['assisted_living'];
  };

  const mockChecklists = [
    {
      id: '1',
      name: 'Initial Relationship Building',
      phase: 'foundation',
      items: [
        { id: '1', task: 'Schedule introductory meeting with administrator' },
        { id: '2', task: 'Tour facility and understand layout' },
        { id: '3', task: 'Meet nursing leadership team' },
        { id: '4', task: 'Provide hospice overview materials' }
      ]
    },
    {
      id: '2',
      name: 'Educational Engagement',
      phase: 'engagement',
      items: [
        { id: '5', task: 'Schedule lunch & learn presentation' },
        { id: '6', task: 'Provide staff educational materials' },
        { id: '7', task: 'Share hospice eligibility criteria' },
        { id: '8', task: 'Discuss referral process' }
      ]
    }
  ];

  const content = getMockContent(organizationType);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleCheckboxChange = (itemId: string, checked: boolean) => {
    setCheckedItems(prev => 
      checked 
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
    );
  };

  const getChecklistProgress = (items: any[]) => {
    const completedCount = items.filter(item => checkedItems.includes(item.id)).length;
    return (completedCount / items.length) * 100;
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
        <Card>
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleModule('value-props')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{content.valueProps.title}</CardTitle>
              </div>
              <ChevronRight 
                className={`w-5 h-5 transition-transform ${
                  expandedModules.includes('value-props') ? 'rotate-90' : ''
                }`}
              />
            </div>
          </CardHeader>
          {expandedModules.includes('value-props') && (
            <CardContent>
              <div className="space-y-4">
                {content.valueProps.stakeholders.map((stakeholder: any, index: number) => (
                  <div key={index}>
                    <h4 className="font-semibold mb-2">{stakeholder.role}</h4>
                    <ul className="space-y-2">
                      {stakeholder.points.map((point: string, pointIndex: number) => (
                        <li key={pointIndex} className="flex items-start">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </TabsContent>

      <TabsContent value="action-plan" className="mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">90-Day Action Plan</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {content.actionPlan.map((phase: any, index: number) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{phase.phase}</h4>
                  </div>
                  <ul className="space-y-2">
                    {phase.actions.map((action: string, actionIndex: number) => (
                      <li key={actionIndex} className="flex items-start">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <span className="text-xs font-semibold">{actionIndex + 1}</span>
                        </div>
                        <span className="text-sm">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="checklists" className="mt-6">
        <div className="space-y-4">
          {mockChecklists.map((checklist) => {
            const progress = getChecklistProgress(checklist.items);
            
            return (
              <Card key={checklist.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{checklist.name}</CardTitle>
                      <CardDescription>Partnership development phase</CardDescription>
                    </div>
                    <Badge variant={checklist.phase === 'foundation' ? 'default' : 'secondary'}>
                      {checklist.phase}
                    </Badge>
                  </div>
                  <Progress value={progress} className="mt-2" />
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {checklist.items.map((item: any) => (
                        <div key={item.id} className="flex items-start space-x-2">
                          <Checkbox
                            checked={checkedItems.includes(item.id)}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(item.id, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {item.task}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="kpis" className="mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Key Performance Indicators</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {content.kpis.map((metric: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{metric.name}</h4>
                    <Target className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{metric.description}</p>
                  <Badge variant="secondary">{metric.target}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default SimpleOrganizationTraining;
