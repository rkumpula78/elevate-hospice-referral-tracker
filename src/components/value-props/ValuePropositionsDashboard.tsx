
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  Heart, 
  Stethoscope, 
  Home, 
  TestTube,
  ChevronDown,
  ChevronUp,
  Quote
} from 'lucide-react';

interface ValuePropData {
  type: string;
  title: string;
  icon: React.ReactNode;
  keyTakeaway: string;
  quote: string;
  coreValueProps: string[];
  detailedValueProps: {
    title: string;
    description: string;
    benefits: string[];
  }[];
}

const ValuePropositionsDashboard = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const organizationData: ValuePropData[] = [
    {
      type: 'assisted_living',
      title: 'Assisted Living Facilities',
      icon: <Users className="w-6 h-6" />,
      keyTakeaway: 'Seamless transitions that prioritize resident comfort and family peace of mind',
      quote: "We ensure your residents receive compassionate end-of-life care in their familiar environment",
      coreValueProps: [
        'Minimize disruptive transfers',
        'Maintain resident dignity and comfort',
        'Support family decision-making',
        'Reduce liability and regulatory concerns'
      ],
      detailedValueProps: [
        {
          title: 'Enhanced Resident Care',
          description: 'Keep residents in their familiar environment during end-of-life care',
          benefits: [
            'Reduced anxiety and confusion for residents',
            'Maintained daily routines and relationships',
            'Personalized care plans that respect preferences',
            'Family involvement in care decisions'
          ]
        },
        {
          title: 'Operational Excellence',
          description: 'Streamline care coordination and reduce administrative burden',
          benefits: [
            'Expert pain and symptom management',
            'Reduced emergency room visits',
            'Clear communication with families',
            'Documentation support for regulatory compliance'
          ]
        }
      ]
    },
    {
      type: 'hospital',
      title: 'Hospitals',
      icon: <Building2 className="w-6 h-6" />,
      keyTakeaway: 'Improved patient flow and quality outcomes through expert end-of-life care',
      quote: "We help you provide the right care, at the right time, in the right place",
      coreValueProps: [
        'Reduce readmissions and length of stay',
        'Improve quality metrics and patient satisfaction',
        'Support discharge planning efficiency',
        'Enhance palliative care services'
      ],
      detailedValueProps: [
        {
          title: 'Quality & Performance',
          description: 'Measurable improvements in patient outcomes and hospital metrics',
          benefits: [
            'Reduced 30-day readmission rates',
            'Improved HCAHPS scores',
            'Decreased length of stay for appropriate patients',
            'Enhanced end-of-life care quality measures'
          ]
        },
        {
          title: 'Care Coordination',
          description: 'Seamless transitions and expert consultation services',
          benefits: [
            'Rapid response for hospice-appropriate patients',
            'Expert pain and symptom management consultation',
            'Clear discharge planning pathways',
            'Family support and education'
          ]
        }
      ]
    },
    {
      type: 'physician_office',
      title: 'Physician Offices',
      icon: <Stethoscope className="w-6 h-6" />,
      keyTakeaway: 'Expert support for difficult conversations and comprehensive end-of-life care',
      quote: "We partner with you to provide compassionate care when cure is no longer the goal",
      coreValueProps: [
        'Expert consultation for complex cases',
        'Support for difficult family conversations',
        'Comprehensive symptom management',
        'Maintain physician-patient relationships'
      ],
      detailedValueProps: [
        {
          title: 'Clinical Partnership',
          description: 'Collaborative approach to patient care and family support',
          benefits: [
            'Expert guidance on prognosis and care planning',
            'Support for advance directive discussions',
            'Pain and symptom management expertise',
            'Coordination with existing care team'
          ]
        },
        {
          title: 'Practice Support',
          description: 'Resources and education to enhance your practice capabilities',
          benefits: [
            'Clinical education on end-of-life care',
            'Documentation and billing support',
            'After-hours on-call support',
            'Bereavement services for families'
          ]
        }
      ]
    },
    {
      type: 'nursing_home',
      title: 'Skilled Nursing Facilities',
      icon: <Heart className="w-6 h-6" />,
      keyTakeaway: 'Enhanced quality of life through specialized end-of-life care expertise',
      quote: "We help you provide dignified, comfortable care for residents in their final chapter",
      coreValueProps: [
        'Specialized end-of-life care expertise',
        'Improved quality measures and surveys',
        'Reduced hospitalizations and transfers',
        'Enhanced family satisfaction'
      ],
      detailedValueProps: [
        {
          title: 'Quality Enhancement',
          description: 'Improve facility outcomes and resident satisfaction',
          benefits: [
            'Enhanced quality measure performance',
            'Improved survey results',
            'Reduced unnecessary hospitalizations',
            'Better pain management outcomes'
          ]
        },
        {
          title: 'Staff Development',
          description: 'Education and support for your care team',
          benefits: [
            'End-of-life care training for staff',
            'Clinical support and consultation',
            'Family communication assistance',
            'Grief and bereavement resources'
          ]
        }
      ]
    },
    {
      type: 'home_health',
      title: 'Home Health Agencies',
      icon: <Home className="w-6 h-6" />,
      keyTakeaway: 'Natural partnership for comprehensive home-based care continuum',
      quote: "Together, we provide seamless care transitions from curative to comfort-focused",
      coreValueProps: [
        'Smooth care transitions and referrals',
        'Shared commitment to home-based care',
        'Complementary service offerings',
        'Enhanced patient and family support'
      ],
      detailedValueProps: [
        {
          title: 'Care Continuum',
          description: 'Seamless transitions between home health and hospice services',
          benefits: [
            'Clear transition criteria and processes',
            'Maintained caregiver relationships',
            'Comprehensive care coordination',
            'Family education and support'
          ]
        },
        {
          title: 'Operational Synergy',
          description: 'Collaborative approach to home-based healthcare',
          benefits: [
            'Shared resources and expertise',
            'Joint marketing opportunities',
            'Referral relationship development',
            'Quality improvement initiatives'
          ]
        }
      ]
    },
    {
      type: 'clinic',
      title: 'Cancer Centers & Clinics',
      icon: <TestTube className="w-6 h-6" />,
      keyTakeaway: 'Specialized palliative and end-of-life care for oncology patients',
      quote: "We provide expert comfort care while honoring the hope and dignity of every patient",
      coreValueProps: [
        'Specialized oncology palliative care',
        'Early integration improves outcomes',
        'Expert pain and symptom management',
        'Support throughout cancer journey'
      ],
      detailedValueProps: [
        {
          title: 'Oncology Expertise',
          description: 'Specialized care for cancer patients and families',
          benefits: [
            'Understanding of cancer-related symptoms',
            'Expertise in oncology medications',
            'Coordination with oncology teams',
            'Clinical trial coordination when appropriate'
          ]
        },
        {
          title: 'Comprehensive Support',
          description: 'Holistic care addressing physical, emotional, and spiritual needs',
          benefits: [
            'Advanced pain management techniques',
            'Psychosocial support services',
            'Spiritual care coordination',
            'Bereavement and grief counseling'
          ]
        }
      ]
    }
  ];

  const toggleCard = (type: string) => {
    setExpandedCard(expandedCard === type ? null : type);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Value Propositions by Organization Type
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover tailored value propositions and key messaging for different healthcare organization types. 
          Click on any card to explore detailed benefits and talking points.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {organizationData.map((org) => (
          <Card key={org.type} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader onClick={() => toggleCard(org.type)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {org.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{org.title}</CardTitle>
                  </div>
                </div>
                {expandedCard === org.type ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Key Takeaway */}
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm font-medium text-blue-900">{org.keyTakeaway}</p>
                </div>

                {/* Quote */}
                <div className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Quote className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <p className="text-sm italic text-gray-700">{org.quote}</p>
                </div>

                {/* Core Value Props - Always visible */}
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Core Value Propositions:</h4>
                  <ul className="space-y-1">
                    {org.coreValueProps.map((prop, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start">
                        <span className="text-primary mr-2">•</span>
                        {prop}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Detailed Props - Expandable */}
                {expandedCard === org.type && (
                  <div className="space-y-4 border-t pt-4">
                    {org.detailedValueProps.map((detail, index) => (
                      <div key={index} className="space-y-2">
                        <div>
                          <h4 className="font-semibold text-sm text-primary">{detail.title}</h4>
                          <p className="text-xs text-muted-foreground">{detail.description}</p>
                        </div>
                        <ul className="space-y-1 ml-4">
                          {detail.benefits.map((benefit, benefitIndex) => (
                            <li key={benefitIndex} className="text-xs text-muted-foreground flex items-start">
                              <span className="text-green-500 mr-2">✓</span>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => toggleCard(org.type)}
                >
                  {expandedCard === org.type ? 'Show Less' : 'View Details'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ValuePropositionsDashboard;
