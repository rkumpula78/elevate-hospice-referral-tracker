
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Users, FileText, Target, TrendingUp } from 'lucide-react';

interface ValuePropModule {
  id: string;
  title: string;
  description: string;
  keyPoints: string[];
}

interface OrganizationValuePropsProps {
  organizationType: string;
}

const OrganizationValueProps = ({ organizationType }: OrganizationValuePropsProps) => {
  const [activeSection, setActiveSection] = useState<string>('value-props');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const getValuePropModules = (orgType: string): ValuePropModule[] => {
    switch (orgType) {
      case 'hospital':
        return [
          {
            id: 'partnership_excellence',
            title: 'Hospital Partnership Excellence',
            description: 'Comprehensive strategies for building strong hospital partnerships',
            keyPoints: [
              'Reduce readmissions and length of stay',
              'Improve quality metrics and patient satisfaction',
              'Support discharge planning efficiency',
              'Enhanced palliative care services'
            ]
          },
          {
            id: 'executive_leadership',
            title: 'Executive Leadership Value Drivers',
            description: 'Key value propositions for hospital executives and decision makers',
            keyPoints: [
              'Measurable ROI on partnership investments',
              'Improved HCAHPS scores and quality ratings',
              'Reduced liability and compliance risks',
              'Enhanced reputation for compassionate care'
            ]
          },
          {
            id: 'hospitalist_benefits',
            title: 'Hospitalist Partnership Benefits',
            description: 'Direct benefits and support for hospitalist physicians',
            keyPoints: [
              'Expert consultation for complex cases',
              'Rapid response for hospice-appropriate patients',
              'Clear discharge planning pathways',
              'Reduced after-hours burden'
            ]
          },
          {
            id: 'case_management',
            title: 'Case Management Partnership Excellence',
            description: 'Streamlined processes for case managers and discharge planners',
            keyPoints: [
              'Simplified referral and admission processes',
              'Expert guidance on appropriate level of care',
              'Comprehensive family support services',
              'Seamless transition coordination'
            ]
          },
          {
            id: 'palliative_care',
            title: 'Palliative Care Collaboration',
            description: 'Enhanced palliative care services and coordination',
            keyPoints: [
              'Early palliative care consultation',
              'Specialized pain and symptom management',
              'Goals of care conversations',
              'Smooth transition to hospice when appropriate'
            ]
          },
          {
            id: 'emergency_department',
            title: 'Emergency Department Partnership',
            description: 'Support for emergency department staff and workflows',
            keyPoints: [
              'Rapid hospice evaluation for appropriate patients',
              'Reduce frequent flyer readmissions',
              'Family crisis intervention support',
              'Clear protocols for end-of-life situations'
            ]
          }
        ];

      case 'assisted_living':
        return [
          {
            id: 'resident_care',
            title: 'Enhanced Resident Care Excellence',
            description: 'Maintaining comfort and dignity in familiar surroundings',
            keyPoints: [
              'Minimize disruptive transfers',
              'Maintain resident dignity and comfort',
              'Personalized care plans that respect preferences',
              'Family involvement in care decisions'
            ]
          },
          {
            id: 'operational_support',
            title: 'Operational Support & Efficiency',
            description: 'Streamlined operations and reduced administrative burden',
            keyPoints: [
              'Expert pain and symptom management',
              'Reduced emergency room visits',
              'Clear communication with families',
              'Documentation support for regulatory compliance'
            ]
          },
          {
            id: 'staff_education',
            title: 'Staff Education & Development',
            description: 'Training and support for facility staff',
            keyPoints: [
              'End-of-life care training',
              'Recognition of hospice-appropriate residents',
              'Family communication skills',
              'Grief and bereavement support'
            ]
          }
        ];

      case 'skilled_nursing':
        return [
          {
            id: 'quality_enhancement',
            title: 'Quality Enhancement Programs',
            description: 'Improve facility outcomes and resident satisfaction',
            keyPoints: [
              'Enhanced quality measure performance',
              'Improved survey results',
              'Reduced unnecessary hospitalizations',
              'Better pain management outcomes'
            ]
          },
          {
            id: 'staff_development',
            title: 'Staff Development & Training',
            description: 'Education and support for your care team',
            keyPoints: [
              'End-of-life care training for staff',
              'Clinical support and consultation',
              'Family communication assistance',
              'Grief and bereavement resources'
            ]
          },
          {
            id: 'regulatory_compliance',
            title: 'Regulatory Compliance Support',
            description: 'Meeting regulatory requirements and standards',
            keyPoints: [
              'Documentation assistance',
              'Quality reporting support',
              'Compliance with CMS regulations',
              'Survey preparation assistance'
            ]
          }
        ];

      case 'physician_office':
        return [
          {
            id: 'clinical_partnership',
            title: 'Clinical Partnership Excellence',
            description: 'Collaborative approach to patient care and family support',
            keyPoints: [
              'Expert consultation for complex cases',
              'Support for difficult family conversations',
              'Pain and symptom management expertise',
              'Coordination with existing care team'
            ]
          },
          {
            id: 'practice_support',
            title: 'Practice Support Services',
            description: 'Resources and education to enhance your practice capabilities',
            keyPoints: [
              'Clinical education on end-of-life care',
              'Documentation and billing support',
              'After-hours on-call support',
              'Bereavement services for families'
            ]
          }
        ];

      case 'home_health':
        return [
          {
            id: 'care_continuum',
            title: 'Seamless Care Continuum',
            description: 'Smooth transitions between home health and hospice services',
            keyPoints: [
              'Clear transition criteria and processes',
              'Maintained caregiver relationships',
              'Comprehensive care coordination',
              'Family education and support'
            ]
          },
          {
            id: 'operational_synergy',
            title: 'Operational Synergy',
            description: 'Collaborative approach to home-based healthcare',
            keyPoints: [
              'Shared resources and expertise',
              'Joint marketing opportunities',
              'Referral relationship development',
              'Quality improvement initiatives'
            ]
          }
        ];

      case 'cancer_center':
        return [
          {
            id: 'oncology_expertise',
            title: 'Specialized Oncology Partnership',
            description: 'Expert palliative and end-of-life care for cancer patients',
            keyPoints: [
              'Understanding of cancer-related symptoms',
              'Expertise in oncology medications',
              'Coordination with oncology teams',
              'Clinical trial coordination when appropriate'
            ]
          },
          {
            id: 'comprehensive_support',
            title: 'Comprehensive Patient Support',
            description: 'Holistic care addressing physical, emotional, and spiritual needs',
            keyPoints: [
              'Advanced pain management techniques',
              'Psychosocial support services',
              'Spiritual care coordination',
              'Bereavement and grief counseling'
            ]
          }
        ];

      default:
        return [
          {
            id: 'partnership_excellence',
            title: 'Partnership Excellence',
            description: 'Building strong collaborative relationships',
            keyPoints: [
              'Expert consultation and support',
              'Seamless care transitions',
              'Enhanced patient and family satisfaction',
              'Improved operational efficiency'
            ]
          }
        ];
    }
  };

  const modules = getValuePropModules(organizationType);

  const toggleModule = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const renderValuePropsContent = () => (
    <div className="space-y-3">
      {modules.map((module) => (
        <Card 
          key={module.id} 
          className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => toggleModule(module.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">{module.title}</h3>
                  {expandedModule === module.id && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-gray-600">{module.description}</p>
                      <ul className="space-y-1">
                        {module.keyPoints.map((point, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <span className="text-green-500 mr-2 mt-1">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <ChevronRight 
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedModule === module.id ? 'rotate-90' : ''
                }`} 
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderActionPlanContent = () => (
    <Card>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Action Plan</h3>
          <p className="text-gray-600">Implementation strategies and step-by-step guidance coming soon.</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderChecklistsContent = () => (
    <Card>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Quality Checklists</h3>
          <p className="text-gray-600">Quality assurance checklists and verification tools coming soon.</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderKPIsContent = () => (
    <Card>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">KPIs & Metrics</h3>
          <p className="text-gray-600">Key performance indicators and success metrics coming soon.</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderActiveContent = () => {
    switch (activeSection) {
      case 'value-props':
        return renderValuePropsContent();
      case 'action-plan':
        return renderActionPlanContent();
      case 'checklists':
        return renderChecklistsContent();
      case 'kpis':
        return renderKPIsContent();
      default:
        return renderValuePropsContent();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className={`p-4 text-center cursor-pointer transition-all ${
            activeSection === 'value-props' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
          }`}
          onClick={() => setActiveSection('value-props')}
        >
          <div className="text-2xl font-bold text-blue-600 mb-1">Value Props</div>
          <div className="text-sm text-gray-600">Strategic Benefits</div>
        </Card>
        <Card 
          className={`p-4 text-center cursor-pointer transition-all ${
            activeSection === 'action-plan' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:shadow-md'
          }`}
          onClick={() => setActiveSection('action-plan')}
        >
          <div className="text-2xl font-bold text-green-600 mb-1">Action Plan</div>
          <div className="text-sm text-gray-600">Implementation</div>
        </Card>
        <Card 
          className={`p-4 text-center cursor-pointer transition-all ${
            activeSection === 'checklists' ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:shadow-md'
          }`}
          onClick={() => setActiveSection('checklists')}
        >
          <div className="text-2xl font-bold text-purple-600 mb-1">Checklists</div>
          <div className="text-sm text-gray-600">Quality Assurance</div>
        </Card>
        <Card 
          className={`p-4 text-center cursor-pointer transition-all ${
            activeSection === 'kpis' ? 'ring-2 ring-orange-500 bg-orange-50' : 'hover:shadow-md'
          }`}
          onClick={() => setActiveSection('kpis')}
        >
          <div className="text-2xl font-bold text-orange-600 mb-1">KPIs</div>
          <div className="text-sm text-gray-600">Performance Metrics</div>
        </Card>
      </div>

      {renderActiveContent()}
    </div>
  );
};

export default OrganizationValueProps;
