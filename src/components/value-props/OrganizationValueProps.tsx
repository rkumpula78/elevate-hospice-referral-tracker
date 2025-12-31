import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Users, FileText, Target, TrendingUp } from 'lucide-react';
import OrganizationTraining from '@/components/crm/OrganizationTraining';

interface ValuePropModule {
  id: string;
  title: string;
  description: string;
  keyPoints: string[];
}

interface ActionPlanModule {
  id: string;
  title: string;
  description: string;
  phases: Array<{
    name: string;
    days: string;
    actions: string[];
  }>;
}

interface OrganizationValuePropsProps {
  organizationType: string;
  organizationId: string;
}

const OrganizationValueProps = ({ organizationType, organizationId }: OrganizationValuePropsProps) => {
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
            id: 'hb2764_compliance',
            title: 'Master HB 2764 Compliance with Expert Clinical Partner',
            description: 'Transform regulatory burden into competitive advantage with Psychiatric NP-led expertise',
            keyPoints: [
              'Expert-Led Training: State-mandated 8-hour staff training grounded in advanced dementia care',
              'Streamlined Medical Certifications: Simplified bi-annual medical certification process',
              'Defensible Care Planning: Clinically robust, individualized care plans for regulatory protection',
              'Immediate Jeopardy Protection: Documentation that demonstrates high standard of care'
            ]
          },
          {
            id: 'behavioral_management',
            title: 'Stabilize Your Community with Advanced Behavioral Management',
            description: 'Expert behavioral health support to reduce incidents and staff burnout',
            keyPoints: [
              'Reduce Disruptive Behaviors: Psychiatric NP consultation for challenging residents',
              'Decrease Antipsychotic Reliance: Non-pharmacological strategies and de-prescribing expertise',
              'Prevent Staff Burnout: Direct support for difficult cases reduces caregiver stress',
              'Safer Environment: Calmer community for all residents and staff'
            ]
          },
          {
            id: 'market_reputation',
            title: 'Elevate Market Reputation as Leader in Dementia Care',
            description: 'Stand out with superior clinical expertise your competitors cannot match',
            keyPoints: [
              'Powerful Differentiator: Market memory care supported by Psychiatric NP-led team',
              'Increase High-Acuity Occupancy: Confidently accept complex behavioral cases',
              'Drive Positive Reviews: Expert care generates passionate family advocates',
              'Premium Positioning: Command higher rates with demonstrated clinical excellence'
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

  const getActionPlanModules = (orgType: string): ActionPlanModule[] => {
    switch (orgType) {
      case 'assisted_living':
        return [
          {
            id: 'compliance_partnership',
            title: 'HB 2764 Compliance Partnership Implementation',
            description: 'Comprehensive 90-day plan to establish compliance partnership and training programs',
            phases: [
              {
                name: 'Phase 1: Assessment & Planning',
                days: 'Days 1-14',
                actions: [
                  'Conduct comprehensive facility assessment of current HB 2764 compliance status',
                  'Review existing memory care policies and procedures',
                  'Identify high-risk residents requiring immediate attention',
                  'Schedule initial staff training needs assessment',
                  'Establish communication protocols with facility leadership',
                  'Create customized compliance timeline and milestones'
                ]
              },
              {
                name: 'Phase 2: Staff Training & Education',
                days: 'Days 15-35',
                actions: [
                  'Deliver state-mandated 8-hour dementia care training to all relevant staff',
                  'Conduct specialized behavioral management workshops',
                  'Train staff on new documentation requirements',
                  'Establish ongoing consultation availability for challenging cases',
                  'Create reference materials and quick-guide resources',
                  'Set up regular case review meetings'
                ]
              },
              {
                name: 'Phase 3: Care Plan Enhancement',
                days: 'Days 36-60',
                actions: [
                  'Review and enhance existing resident care plans',
                  'Implement individualized behavioral intervention strategies',
                  'Establish medical certification processes',
                  'Create defensible documentation templates',
                  'Conduct family education sessions',
                  'Implement quality assurance protocols'
                ]
              },
              {
                name: 'Phase 4: Operational Integration',
                days: 'Days 61-90',
                actions: [
                  'Fully integrate hospice services into facility operations',
                  'Establish regular clinical consultation schedule',
                  'Implement ongoing staff support programs',
                  'Create marketing materials highlighting partnership',
                  'Conduct quarterly compliance reviews',
                  'Establish long-term partnership sustainability plan'
                ]
              }
            ]
          },
          {
            id: 'behavioral_excellence',
            title: 'Behavioral Management Excellence Program',
            description: 'Specialized program to transform challenging behaviors into manageable care situations',
            phases: [
              {
                name: 'Phase 1: Baseline Assessment',
                days: 'Days 1-10',
                actions: [
                  'Conduct comprehensive behavioral assessments of challenging residents',
                  'Review current medication regimens with focus on antipsychotics',
                  'Identify environmental triggers and risk factors',
                  'Assess staff confidence and competency levels',
                  'Document baseline incident reports and patterns',
                  'Establish measurable behavioral improvement goals'
                ]
              },
              {
                name: 'Phase 2: Intervention Implementation',
                days: 'Days 11-30',
                actions: [
                  'Implement personalized non-pharmacological interventions',
                  'Begin systematic medication optimization process',
                  'Train staff on specific de-escalation techniques',
                  'Create individualized behavior management protocols',
                  'Establish 24/7 clinical consultation availability',
                  'Implement environmental modifications as needed'
                ]
              },
              {
                name: 'Phase 3: Monitoring & Refinement',
                days: 'Days 31-60',
                actions: [
                  'Monitor and document behavioral improvements',
                  'Adjust interventions based on resident response',
                  'Conduct ongoing staff coaching and support',
                  'Review and optimize medication regimens',
                  'Analyze incident reduction metrics',
                  'Refine protocols based on outcomes'
                ]
              }
            ]
          },
          {
            id: 'market_positioning',
            title: 'Premium Market Positioning Strategy',
            description: 'Strategic plan to establish facility as the premier dementia care provider',
            phases: [
              {
                name: 'Phase 1: Foundation Building',
                days: 'Days 1-21',
                actions: [
                  'Develop compelling value proposition messaging',
                  'Create marketing materials highlighting Psychiatric NP partnership',
                  'Establish clinical excellence documentation system',
                  'Train admission staff on new positioning strategy',
                  'Develop premium pricing structure',
                  'Create family education packages'
                ]
              },
              {
                name: 'Phase 2: Market Launch',
                days: 'Days 22-45',
                actions: [
                  'Launch updated website with clinical expertise messaging',
                  'Conduct physician and hospital outreach campaign',
                  'Implement referral source education program',
                  'Begin accepting higher-acuity residents',
                  'Establish family satisfaction monitoring system',
                  'Create case studies of successful outcomes'
                ]
              },
              {
                name: 'Phase 3: Reputation Building',
                days: 'Days 46-90',
                actions: [
                  'Implement systematic family feedback collection',
                  'Encourage positive online reviews and testimonials',
                  'Conduct community education seminars',
                  'Establish thought leadership through speaking engagements',
                  'Monitor and respond to competitive positioning',
                  'Continuously refine and optimize messaging'
                ]
              }
            ]
          }
        ];

      case 'hospital':
        return [
          {
            id: 'hospital_partnership',
            title: 'Comprehensive Hospital Partnership Development',
            description: '90-day strategic implementation plan for establishing premier hospital partnership',
            phases: [
              {
                name: 'Phase 1: Relationship Building',
                days: 'Days 1-30',
                actions: [
                  'Conduct stakeholder mapping and key contact identification',
                  'Schedule initial meetings with department heads',
                  'Present partnership value proposition to leadership',
                  'Establish communication protocols and meeting cadence',
                  'Begin discharge planning team integration',
                  'Create partnership agreement framework'
                ]
              },
              {
                name: 'Phase 2: Operational Integration',
                days: 'Days 31-60',
                actions: [
                  'Implement streamlined referral processes',
                  'Establish rapid response protocols for hospice-appropriate patients',
                  'Begin staff education on hospice benefits',
                  'Create joint quality improvement initiatives',
                  'Implement shared care protocols',
                  'Establish regular case review meetings'
                ]
              },
              {
                name: 'Phase 3: Partnership Optimization',
                days: 'Days 61-90',
                actions: [
                  'Monitor and analyze partnership metrics',
                  'Optimize referral and admission processes',
                  'Expand services based on hospital needs',
                  'Implement continuous improvement protocols',
                  'Establish long-term strategic planning',
                  'Create partnership success measurement system'
                ]
              }
            ]
          }
        ];

      case 'skilled_nursing':
        return [
          {
            id: 'snf_partnership',
            title: 'Skilled Nursing Facility Partnership Development',
            description: '90-day strategic implementation plan for establishing premier SNF partnership',
            phases: [
              {
                name: 'Phase 1: Relationship Building',
                days: 'Days 1-30',
                actions: [
                  'Identify key stakeholders and decision-makers within the SNF',
                  'Schedule initial meetings with the SNF administrator and DON',
                  'Present the value proposition of partnering with Elevate Hospice',
                  'Establish clear communication protocols and a regular meeting cadence',
                  'Integrate with the SNF’s care planning team',
                  'Develop a partnership agreement framework outlining mutual goals and responsibilities'
                ]
              },
              {
                name: 'Phase 2: Operational Integration',
                days: 'Days 31-60',
                actions: [
                  'Implement streamlined referral processes for hospice-appropriate patients',
                  'Establish rapid response protocols to ensure timely hospice evaluations',
                  'Provide staff education on the benefits of hospice care for SNF residents',
                  'Collaborate on joint quality improvement initiatives to enhance resident outcomes',
                  'Implement shared care protocols to ensure seamless transitions and coordinated care',
                  'Conduct regular case review meetings to discuss complex patient cases and optimize care plans'
                ]
              },
              {
                name: 'Phase 3: Partnership Optimization',
                days: 'Days 61-90',
                actions: [
                  'Monitor and analyze key partnership metrics, such as referral rates and patient satisfaction',
                  'Optimize referral and admission processes based on feedback and performance data',
                  'Expand hospice services offered within the SNF based on resident needs and preferences',
                  'Implement continuous improvement protocols to enhance the quality and efficiency of care',
                  'Establish a long-term strategic planning process to ensure the sustainability of the partnership',
                  'Create a system for measuring and celebrating partnership success, recognizing the contributions of both Elevate Hospice and the SNF'
                ]
              }
            ]
          }
        ];

      case 'physician_office':
        return [
          {
            id: 'physician_partnership',
            title: 'Physician Office Partnership Development',
            description: '90-day strategic implementation plan for establishing premier physician office partnership',
            phases: [
              {
                name: 'Phase 1: Relationship Building',
                days: 'Days 1-30',
                actions: [
                  'Identify key physicians and staff within the practice',
                  'Schedule initial meetings to introduce Elevate Hospice and its services',
                  'Present the value proposition of partnering with Elevate Hospice to the physicians',
                  'Establish clear communication protocols and a regular meeting cadence',
                  'Integrate with the physician office’s care coordination team',
                  'Develop a partnership agreement framework outlining mutual goals and responsibilities'
                ]
              },
              {
                name: 'Phase 2: Operational Integration',
                days: 'Days 31-60',
                actions: [
                  'Implement streamlined referral processes for hospice-appropriate patients',
                  'Provide education to physicians and staff on identifying appropriate patients',
                  'Offer support for difficult family conversations about end-of-life care',
                  'Collaborate on developing educational materials for patients and families',
                  'Implement shared care protocols to ensure seamless transitions and coordinated care',
                  'Conduct regular case review meetings to discuss complex patient cases and optimize care plans'
                ]
              },
              {
                name: 'Phase 3: Partnership Optimization',
                days: 'Days 61-90',
                actions: [
                  'Monitor and analyze key partnership metrics, such as referral rates and patient satisfaction',
                  'Optimize referral and communication processes based on feedback and performance data',
                  'Expand hospice services offered within the physician office based on patient needs',
                  'Implement continuous improvement protocols to enhance the quality and efficiency of care',
                  'Establish a long-term strategic planning process to ensure the sustainability of the partnership',
                  'Create a system for measuring and celebrating partnership success, recognizing the contributions of both Elevate Hospice and the physician office'
                ]
              }
            ]
          }
        ];

      case 'home_health':
        return [
          {
            id: 'home_health_partnership',
            title: 'Home Health Agency Partnership Development',
            description: '90-day strategic implementation plan for establishing premier home health agency partnership',
            phases: [
              {
                name: 'Phase 1: Relationship Building',
                days: 'Days 1-30',
                actions: [
                  'Identify key personnel within the home health agency',
                  'Schedule initial meetings to introduce Elevate Hospice and its services',
                  'Present the value proposition of partnering with Elevate Hospice to the agency leadership',
                  'Establish clear communication protocols and a regular meeting cadence',
                  'Integrate with the home health agency’s care coordination team',
                  'Develop a partnership agreement framework outlining mutual goals and responsibilities'
                ]
              },
              {
                name: 'Phase 2: Operational Integration',
                days: 'Days 31-60',
                actions: [
                  'Implement streamlined referral processes for hospice-appropriate patients',
                  'Provide education to home health staff on identifying appropriate patients',
                  'Offer support for difficult family conversations about end-of-life care',
                  'Collaborate on developing educational materials for patients and families',
                  'Implement shared care protocols to ensure seamless transitions and coordinated care',
                  'Conduct regular case review meetings to discuss complex patient cases and optimize care plans'
                ]
              },
              {
                name: 'Phase 3: Partnership Optimization',
                days: 'Days 61-90',
                actions: [
                  'Monitor and analyze key partnership metrics, such as referral rates and patient satisfaction',
                  'Optimize referral and communication processes based on feedback and performance data',
                  'Expand hospice services offered in collaboration with the home health agency',
                  'Implement continuous improvement protocols to enhance the quality and efficiency of care',
                  'Establish a long-term strategic planning process to ensure the sustainability of the partnership',
                  'Create a system for measuring and celebrating partnership success, recognizing the contributions of both Elevate Hospice and the home health agency'
                ]
              }
            ]
          }
        ];

      case 'cancer_center':
        return [
          {
            id: 'cancer_center_partnership',
            title: 'Cancer Center Partnership Development',
            description: '90-day strategic implementation plan for establishing premier cancer center partnership',
            phases: [
              {
                name: 'Phase 1: Relationship Building',
                days: 'Days 1-30',
                actions: [
                  'Identify key oncologists, nurse navigators, and social workers within the cancer center',
                  'Schedule initial meetings to introduce Elevate Hospice and its services',
                  'Present the value proposition of partnering with Elevate Hospice to the cancer center staff',
                  'Establish clear communication protocols and a regular meeting cadence',
                  'Integrate with the cancer center’s care coordination team',
                  'Develop a partnership agreement framework outlining mutual goals and responsibilities'
                ]
              },
              {
                name: 'Phase 2: Operational Integration',
                days: 'Days 31-60',
                actions: [
                  'Implement streamlined referral processes for hospice-appropriate patients',
                  'Provide education to cancer center staff on identifying appropriate patients',
                  'Offer support for difficult family conversations about end-of-life care',
                  'Collaborate on developing educational materials for patients and families',
                  'Implement shared care protocols to ensure seamless transitions and coordinated care',
                  'Conduct regular case review meetings to discuss complex patient cases and optimize care plans'
                ]
              },
              {
                name: 'Phase 3: Partnership Optimization',
                days: 'Days 61-90',
                actions: [
                  'Monitor and analyze key partnership metrics, such as referral rates and patient satisfaction',
                  'Optimize referral and communication processes based on feedback and performance data',
                  'Expand hospice services offered within the cancer center based on patient needs',
                  'Implement continuous improvement protocols to enhance the quality and efficiency of care',
                  'Establish a long-term strategic planning process to ensure the sustainability of the partnership',
                  'Create a system for measuring and celebrating partnership success, recognizing the contributions of both Elevate Hospice and the cancer center'
                ]
              }
            ]
          }
        ];

      default:
        return [
          {
            id: 'general_partnership',
            title: 'Strategic Partnership Development',
            description: 'General partnership development plan',
            phases: [
              {
                name: 'Phase 1: Foundation',
                days: 'Days 1-30',
                actions: [
                  'Establish initial contact and relationship building',
                  'Conduct needs assessment',
                  'Present value proposition',
                  'Create partnership framework'
                ]
              },
              {
                name: 'Phase 2: Implementation',
                days: 'Days 31-60',
                actions: [
                  'Implement agreed-upon services',
                  'Establish operational protocols',
                  'Begin service delivery',
                  'Monitor initial outcomes'
                ]
              },
              {
                name: 'Phase 3: Optimization',
                days: 'Days 61-90',
                actions: [
                  'Evaluate partnership effectiveness',
                  'Optimize processes and protocols',
                  'Plan for long-term sustainability',
                  'Establish ongoing improvement framework'
                ]
              }
            ]
          }
        ];
    }
  };

  const modules = getValuePropModules(organizationType);
  const actionPlans = getActionPlanModules(organizationType);

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

  const renderActionPlansContent = () => (
    <div className="space-y-4">
      {actionPlans.map((plan) => (
        <Card key={plan.id} className="border border-gray-200">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{plan.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
            </div>
            <div className="space-y-6">
              {plan.phases.map((phase, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">{phase.name}</h4>
                    <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">{phase.days}</span>
                  </div>
                  <ul className="space-y-2">
                    {phase.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="flex items-start text-sm text-gray-700">
                        <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <span className="text-xs font-semibold text-blue-600">{actionIndex + 1}</span>
                        </span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderActiveContent = () => {
    switch (activeSection) {
      case 'value-props':
        return renderValuePropsContent();
      case 'action-plan':
        return renderActionPlansContent();
      case 'checklists':
      case 'kpis':
        return (
          <OrganizationTraining
            organizationId={organizationId}
            organizationType={organizationType}
            activeTab={activeSection}
          />
        );
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
